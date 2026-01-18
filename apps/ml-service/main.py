"""
Airport Pickup Guidance - ML Service with GPS
YOLO Object Detection + OCR + GPS-based Navigation
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import cv2
import numpy as np
from pathlib import Path
import os
import re
from ultralytics import YOLO
import pytesseract
from PIL import Image
import io
import math

app = FastAPI(title="Airport Pickup ML Service")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model paths
MODEL_PATH = os.getenv("MODEL_PATH", "/app/models/best.pt")

# Class definitions
CLASSES = [
    "platform_sign",
    "traffic_light",
    "crosswalk",
    "traffic_sign",
    "vehicle",
    "pedestrian",
]

CLASS2ID = {c: i for i, c in enumerate(CLASSES)}
PLATFORM_REGEX = re.compile(r"^(?:[A-Z]\-?\d{1,2}|\d{1,2})$")

# Global model instance
yolo_model: Optional[YOLO] = None


class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    confidence: float
    class_name: str
    class_id: int
    ocr_text: Optional[str] = None


class DetectionResponse(BaseModel):
    detections: List[BoundingBox]
    instruction: str
    image_width: int
    image_height: int
    driver_latitude: Optional[float] = None
    driver_longitude: Optional[float] = None
    passenger_latitude: Optional[float] = None
    passenger_longitude: Optional[float] = None
    distance_meters: Optional[float] = None
    direction: Optional[str] = None


def load_model():
    """Load YOLO model"""
    global yolo_model
    if not os.path.exists(MODEL_PATH):
        print(f"Model not found at {MODEL_PATH}")
        return
    
    try:
        yolo_model = YOLO(MODEL_PATH)
        print(f"Model loaded from {MODEL_PATH}")
    except Exception as e:
        print(f"Error loading model: {e}")
        yolo_model = None


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance between two GPS coordinates using Haversine formula
    Returns distance in meters
    """
    R = 6371000  # Earth's radius in meters
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_lat / 2) ** 2 +
         math.cos(lat1_rad) * math.cos(lat2_rad) *
         math.sin(delta_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c


def calculate_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> str:
    """
    Calculate bearing/direction from point 1 to point 2
    Returns cardinal direction in Korean
    """
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lon = math.radians(lon2 - lon1)
    
    y = math.sin(delta_lon) * math.cos(lat2_rad)
    x = (math.cos(lat1_rad) * math.sin(lat2_rad) -
         math.sin(lat1_rad) * math.cos(lat2_rad) * math.cos(delta_lon))
    
    bearing = math.atan2(y, x)
    bearing_deg = (math.degrees(bearing) + 360) % 360
    
    # Convert to cardinal direction
    directions = ['북', '북동', '동', '남동', '남', '남서', '서', '북서']
    index = round(bearing_deg / 45) % 8
    return directions[index]


def format_distance(meters: float) -> str:
    """Format distance for human reading"""
    if meters < 1000:
        return f"{int(meters)}m"
    else:
        return f"{meters/1000:.1f}km"


def perform_ocr(image: np.ndarray, bbox: tuple) -> Optional[str]:
    """
    Perform OCR on detected sign
    """
    x1, y1, x2, y2 = bbox
    h, w = image.shape[:2]
    
    # Expand bbox for better OCR
    expansion = 0.3
    dx = (x2 - x1) * expansion
    dy = (y2 - y1) * expansion
    
    ex1 = max(0, int(x1 - dx))
    ey1 = max(0, int(y1 - dy))
    ex2 = min(w, int(x2 + dx))
    ey2 = min(h, int(y2 + dy))
    
    crop = image[ey1:ey2, ex1:ex2]
    
    if crop.size == 0:
        return None
    
    # Multiple preprocessing variants
    variants = []
    
    # Original
    variants.append(crop)
    
    # CLAHE
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    clahe_img = clahe.apply(gray)
    variants.append(cv2.cvtColor(clahe_img, cv2.COLOR_GRAY2BGR))
    
    # Adaptive threshold
    adaptive = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
    )
    variants.append(cv2.cvtColor(adaptive, cv2.COLOR_GRAY2BGR))
    
    results = []
    
    for variant in variants:
        # Resize for better OCR
        scale = 2.6
        resized = cv2.resize(variant, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
        
        # Tesseract with digits only
        custom_config = r'--oem 3 --psm 7 -c tessedit_char_whitelist=0123456789'
        
        try:
            text = pytesseract.image_to_string(resized, config=custom_config).strip()
            
            # Clean and validate
            text = text.replace('O', '0').replace('o', '0')
            text = re.sub(r'[^0-9]', '', text)
            
            if text and 1 <= len(text) <= 3 and text.isdigit():
                # Prefer 2-digit numbers
                score = len(text) if len(text) == 2 else len(text) * 0.8
                results.append((text, score))
        except Exception as e:
            continue
    
    if results:
        results.sort(key=lambda x: x[1], reverse=True)
        return results[0][0]
    
    return None


def generate_instruction(
    detections: List[BoundingBox],
    driver_lat: Optional[float] = None,
    driver_lon: Optional[float] = None,
    passenger_lat: Optional[float] = None,
    passenger_lon: Optional[float] = None,
    user_mode: Optional[str] = None,
) -> tuple[str, Optional[float], Optional[str]]:
    """
    Generate pickup instruction based on detections and GPS
    Returns: (instruction, distance_meters, direction)
    """
    platform_signs = [d for d in detections if d.class_name == "platform_sign" and d.ocr_text]
    traffic_signs = [d for d in detections if d.class_name == "traffic_sign" and d.ocr_text]
    
    has_crosswalk = any(d.class_name == "crosswalk" for d in detections)
    has_traffic_light = any(d.class_name == "traffic_light" for d in detections)
    has_pedestrian = any(d.class_name == "pedestrian" for d in detections)
    
    instruction_parts = []
    distance_meters = None
    direction = None
    
    # Calculate GPS-based info if available
    if driver_lat and driver_lon and passenger_lat and passenger_lon:
        distance_meters = calculate_distance(
            passenger_lat, passenger_lon, driver_lat, driver_lon
        )
        direction = calculate_bearing(
            passenger_lat, passenger_lon, driver_lat, driver_lon
        )
    
    # Main direction based on user mode
    if user_mode == 'driver':
        # Driver mode: inform passenger
        if platform_signs:
            best_platform = max(platform_signs, key=lambda x: x.confidence)
            instruction_parts.append(f"기사님이 현재 플랫폼 {best_platform.ocr_text} 표지판 근처에 있습니다.")
        elif traffic_signs:
            best_traffic = max(traffic_signs, key=lambda x: x.confidence)
            instruction_parts.append(f"기사님이 표지 숫자 '{best_traffic.ocr_text}' 근처에 위치해 있습니다.")
        else:
            instruction_parts.append("기사님이 픽업 위치 근처에 있습니다.")
        
        if distance_meters and direction:
            instruction_parts.append(
                f"승객님 위치에서 {direction}쪽으로 약 {format_distance(distance_meters)} 떨어져 있습니다."
            )
    
    elif user_mode == 'passenger':
        # Passenger mode: guide to driver
        if platform_signs:
            best_platform = max(platform_signs, key=lambda x: x.confidence)
            instruction_parts.append(f"플랫폼 {best_platform.ocr_text} 표지판 방향으로 이동하세요.")
        elif traffic_signs:
            best_traffic = max(traffic_signs, key=lambda x: x.confidence)
            instruction_parts.append(f"표지 숫자 '{best_traffic.ocr_text}' 방향으로 이동하세요.")
        else:
            instruction_parts.append("가까운 플랫폼 표지판을 찾아 이동하세요.")
        
        if distance_meters and direction:
            instruction_parts.append(
                f"기사님이 {direction}쪽으로 약 {format_distance(distance_meters)} 떨어진 곳에 있습니다."
            )
    
    else:
        # Default mode (no user_mode specified)
        if platform_signs:
            best_platform = max(platform_signs, key=lambda x: x.confidence)
            instruction_parts.append(f"플랫폼 {best_platform.ocr_text} 표지 방향으로 이동하세요.")
        elif traffic_signs:
            best_traffic = max(traffic_signs, key=lambda x: x.confidence)
            instruction_parts.append(f"근처 표지 숫자 '{best_traffic.ocr_text}' 방향으로 이동하세요.")
        else:
            instruction_parts.append("가까운 플랫폼 표지판이 보이는 방향으로 이동하세요.")
        
        if distance_meters and direction:
            instruction_parts.append(f"약 {format_distance(distance_meters)} 떨어져 있습니다.")
    
    # Safety warnings
    if has_crosswalk:
        instruction_parts.append("횡단보도에서는 정지 후 좌우를 확인하세요.")
    if has_traffic_light:
        instruction_parts.append("신호등을 확인하고 안전하게 이동하세요.")
    if has_pedestrian:
        instruction_parts.append("보행자 통행에 유의하세요.")
    
    return " ".join(instruction_parts), distance_meters, direction


@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    load_model()


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    model_loaded = yolo_model is not None
    return {
        "status": "healthy" if model_loaded else "unhealthy",
        "model_loaded": model_loaded,
        "model_path": MODEL_PATH,
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Airport Pickup ML Service",
        "version": "2.0.0 (GPS-enabled)",
        "features": ["YOLO Detection", "OCR", "GPS Navigation"],
    }


@app.post("/detect", response_model=DetectionResponse)
async def detect_objects(
    image: UploadFile = File(...),
    user_mode: Optional[str] = Form(None),
    driver_latitude: Optional[float] = Form(None),
    driver_longitude: Optional[float] = Form(None),
    passenger_latitude: Optional[float] = Form(None),
    passenger_longitude: Optional[float] = Form(None),
):
    """
    Detect objects in image and generate pickup instruction
    Supports GPS-based navigation
    """
    if yolo_model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    # Read and decode image
    contents = await image.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image")
    
    height, width = img.shape[:2]
    
    # Run YOLO detection
    results = yolo_model(img, conf=0.25)[0]
    
    detections = []
    
    for box in results.boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        conf = float(box.conf[0])
        cls_id = int(box.cls[0])
        cls_name = CLASSES[cls_id] if cls_id < len(CLASSES) else f"class_{cls_id}"
        
        # Perform OCR on signs
        ocr_text = None
        if cls_name in ["platform_sign", "traffic_sign"]:
            ocr_text = perform_ocr(img, (x1, y1, x2, y2))
        
        detections.append(
            BoundingBox(
                x1=x1, y1=y1, x2=x2, y2=y2,
                confidence=conf,
                class_name=cls_name,
                class_id=cls_id,
                ocr_text=ocr_text,
            )
        )
    
    # Generate instruction with GPS
    instruction, distance, direction = generate_instruction(
        detections,
        driver_lat=driver_latitude,
        driver_lon=driver_longitude,
        passenger_lat=passenger_latitude,
        passenger_lon=passenger_longitude,
        user_mode=user_mode,
    )
    
    return DetectionResponse(
        detections=detections,
        instruction=instruction,
        image_width=width,
        image_height=height,
        driver_latitude=driver_latitude,
        driver_longitude=driver_longitude,
        passenger_latitude=passenger_latitude,
        passenger_longitude=passenger_longitude,
        distance_meters=distance,
        direction=direction,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
