"""
Airport Pickup Guidance - ML Service with GPS
YOLO Object Detection + PaddleOCR + Object-based Navigation Instructions
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Tuple, Any
import cv2
import numpy as np
from pathlib import Path
import os
import re
from ultralytics import YOLO
from paddleocr import PaddleOCR
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

# Class definitions - will be updated from model
CLASSES: List[str] = []
CLASS2ID: Dict[int, str] = {}

# Global model instances
yolo_model: Optional[YOLO] = None
ocr_model: Optional[PaddleOCR] = None


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
    """Load YOLO model and PaddleOCR"""
    global yolo_model, ocr_model, CLASSES, CLASS2ID

    # Load YOLO model
    if not os.path.exists(MODEL_PATH):
        print(f"Model not found at {MODEL_PATH}")
    else:
        try:
            yolo_model = YOLO(MODEL_PATH)

            # Extract class names from model
            if hasattr(yolo_model, 'names'):
                CLASS2ID = yolo_model.names
                CLASSES = [CLASS2ID.get(i, f"class_{i}") for i in range(len(CLASS2ID))]
                print(f"YOLO model loaded from {MODEL_PATH}")
                print(f"Classes: {CLASS2ID}")
            else:
                print(f"Warning: Could not extract class names from model")
        except Exception as e:
            print(f"Error loading YOLO model: {e}")
            yolo_model = None

    # Load PaddleOCR
    try:
        print("Loading PaddleOCR...")
        # use_angle_cls=True for better accuracy with rotated text
        # lang='en' is usually sufficient for numbers and simple text
        ocr_model = PaddleOCR(use_angle_cls=True, lang='en')
        print("PaddleOCR loaded")
    except Exception as e:
        print(f"Error loading PaddleOCR: {e}")
        ocr_model = None


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two GPS coordinates using Haversine formula"""
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


# ============== OCR Functions (PaddleOCR) ==============

def perform_ocr(image: np.ndarray) -> Optional[str]:
    """
    Perform OCR on cropped image using PaddleOCR
    """
    if ocr_model is None:
        print("[OCR] Model not loaded")
        return None

    # Check image size
    if image.size == 0:
        print("[OCR] Empty image")
        return None
    
    h, w = image.shape[:2]
    if h < 10 or w < 10:
        print(f"[OCR] Image too small: {w}x{h}")
        return None

    try:
        # Convert BGR to RGB for better OCR
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        result = ocr_model.ocr(image_rgb, cls=True)
        
        if not result or not result[0]:
            print("[OCR] No text detected")
            return None
        
        # result structure: [[[[x1,y1],[x2,y2],[x3,y3],[x4,y4]], [text, confidence]], ...]
        
        all_texts = []
        best_text = ""
        best_conf = 0.0
        
        for line in result[0]:
            text, conf = line[1]
            all_texts.append(f"'{text}'({conf:.2f})")
            
            # Try to extract meaningful text (numbers or short text)
            # First try digits only
            digits = re.sub(r'[^0-9]', '', text)
            
            # Accept 1-4 digit numbers (platform numbers, gate numbers)
            if digits and 1 <= len(digits) <= 4 and conf > best_conf:
                best_conf = conf
                best_text = digits
            # Also accept short alphanumeric (like "A1", "B2", "3A")
            elif len(text.strip()) <= 5 and conf > best_conf and conf > 0.5:
                clean_text = re.sub(r'[^\w\d]', '', text)
                if clean_text:
                    best_conf = conf
                    best_text = clean_text
        
        print(f"[OCR] Found: {', '.join(all_texts)} -> Selected: '{best_text}' (conf: {best_conf:.2f})")
        
        if best_text and best_conf > 0.5:  # Lowered threshold
            return best_text
            
        return None

    except Exception as e:
        print(f"[OCR Error] {e}")
        return None


# ============== Object Position Analysis ==============

def get_position_description(bbox: BoundingBox, img_width: int, img_height: int) -> str:
    """Get position description of object in image (left/center/right)"""
    cx = (bbox.x1 + bbox.x2) / 2

    if cx < img_width * 0.33:
        return "왼쪽"
    elif cx > img_width * 0.67:
        return "오른쪽"
    else:
        return "정면"


def get_vertical_position(bbox: BoundingBox, img_height: int) -> str:
    """Get vertical position description (near/far based on y position)"""
    cy = (bbox.y1 + bbox.y2) / 2
    if cy < img_height * 0.4:
        return "멀리"
    elif cy > img_height * 0.7:
        return "가까이"
    else:
        return "중간"


def get_relative_position(obj1: BoundingBox, obj2: BoundingBox) -> str:
    """Get relative position of obj2 with respect to obj1"""
    cx1, cy1 = (obj1.x1 + obj1.x2) / 2, (obj1.y1 + obj1.y2) / 2
    cx2, cy2 = (obj2.x1 + obj2.x2) / 2, (obj2.y1 + obj2.y2) / 2

    dx = cx2 - cx1
    dy = cy2 - cy1

    # Horizontal relationship
    if abs(dx) > abs(dy):
        if dx > 0:
            return "오른쪽"
        else:
            return "왼쪽"
    else:
        if dy > 0:
            return "아래"  # below in image = closer to camera
        else:
            return "뒤"  # above in image = further from camera


def get_object_size_category(bbox: BoundingBox, img_width: int, img_height: int) -> str:
    """Get object size relative to image (for estimating distance)"""
    area = (bbox.x2 - bbox.x1) * (bbox.y2 - bbox.y1)
    img_area = img_width * img_height
    ratio = area / img_area

    if ratio > 0.1:
        return "large"
    elif ratio > 0.02:
        return "medium"
    else:
        return "small"


# ============== Instruction Generation ==============

def _match_class(class_name: str, *patterns: str) -> bool:
    """Check if class_name matches any of the patterns (case-insensitive)"""
    name_lower = class_name.lower()
    return any(p.lower() in name_lower for p in patterns)


def generate_instruction(
    detections: List[BoundingBox],
    img_width: int,
    img_height: int,
    driver_lat: Optional[float] = None,
    driver_lon: Optional[float] = None,
    passenger_lat: Optional[float] = None,
    passenger_lon: Optional[float] = None,
    user_mode: Optional[str] = None,
) -> Tuple[str, Optional[float], Optional[str]]:
    """
    Generate pickup instruction based on detected objects.
    Uses PASSENGER PERSPECTIVE - directions are inverted from driver's camera view.
    """
    # Helper to invert direction for passenger perspective
    def invert_direction(direction: str) -> str:
        """Invert direction from driver view to passenger view"""
        inversions = {
            "왼쪽": "오른쪽",
            "오른쪽": "왼쪽",
            "앞": "뒤",
            "뒤": "앞",
            "아래": "앞",
            "정면": "정면",
            "멀리": "멀리",
            "가까이": "가까이",
            "중간": ""
        }
        return inversions.get(direction, direction)
    
    # Categorize detections - separate OCR success/fail
    platform_signs_with_ocr = [d for d in detections if _match_class(d.class_name, "platform") and d.ocr_text]
    platform_signs_no_ocr = [d for d in detections if _match_class(d.class_name, "platform") and not d.ocr_text]
    
    traffic_signs_with_ocr = [d for d in detections if _match_class(d.class_name, "traffic_sign", "sign") 
                              and not _match_class(d.class_name, "platform") and d.ocr_text]
    traffic_signs_no_ocr = [d for d in detections if _match_class(d.class_name, "traffic_sign", "sign") 
                            and not _match_class(d.class_name, "platform") and not d.ocr_text]
    
    all_platform_signs = platform_signs_with_ocr + platform_signs_no_ocr
    all_traffic_signs = traffic_signs_with_ocr + traffic_signs_no_ocr
    
    crosswalks = [d for d in detections if _match_class(d.class_name, "crosswalk", "crossing")]
    traffic_lights = [d for d in detections if _match_class(d.class_name, "traffic_light", "light")]
    vehicles = [d for d in detections if _match_class(d.class_name, "vehicle", "car", "bus", "truck")]
    pedestrians = [d for d in detections if _match_class(d.class_name, "pedestrian", "person", "people")]

    distance_meters = None
    direction = None

    if driver_lat and driver_lon and passenger_lat and passenger_lon:
        distance_meters = calculate_distance(
            passenger_lat, passenger_lon, driver_lat, driver_lon
        )

    # Find the main landmark (sign)
    main_landmark = None
    landmark_name = ""
    
    if platform_signs_with_ocr:
        main_landmark = max(platform_signs_with_ocr, key=lambda x: x.confidence)
        landmark_name = f"{main_landmark.ocr_text} 표지판"
    elif traffic_signs_with_ocr:
        main_landmark = max(traffic_signs_with_ocr, key=lambda x: x.confidence)
        landmark_name = f"{main_landmark.ocr_text} 표지판"
    elif all_platform_signs:
        main_landmark = max(all_platform_signs, key=lambda x: x.confidence)
        landmark_name = "표지판"
    elif all_traffic_signs:
        main_landmark = max(all_traffic_signs, key=lambda x: x.confidence)
        landmark_name = "표지판"
    elif traffic_lights:
        main_landmark = max(traffic_lights, key=lambda x: x.confidence)
        landmark_name = "신호등"

    # Build context items (from driver camera perspective, will be inverted)
    context_items = []
    
    # Traffic light position relative to landmark
    if traffic_lights and main_landmark and landmark_name != "신호등":
        light = max(traffic_lights, key=lambda x: x.confidence)
        rel = get_relative_position(main_landmark, light)
        inverted_rel = invert_direction(rel)
        if inverted_rel:
            context_items.append(f"신호등 {inverted_rel}")
    
    # Vehicle count
    if vehicles:
        vehicle_count = len(vehicles)
        if vehicle_count == 1:
            context_items.append("차량 1대 주변")
        elif vehicle_count <= 5:
            context_items.append(f"차량 {vehicle_count}대 주변")
        else:
            context_items.append(f"차량 다수({vehicle_count}대) 주변")
    
    # Crosswalk
    if crosswalks and main_landmark:
        cw = max(crosswalks, key=lambda x: x.confidence)
        rel = get_relative_position(main_landmark, cw)
        inverted_rel = invert_direction(rel)
        if inverted_rel:
            context_items.append(f"횡단보도 {inverted_rel}")
    
    # Pedestrians
    if pedestrians and len(pedestrians) >= 3:
        context_items.append(f"보행자 {len(pedestrians)}명 주변")

    # Build instruction based on mode
    instruction = ""
    
    if user_mode == 'driver':
        # Driver mode: Tell where the driver is located
        if main_landmark:
            # Get driver position relative to landmark (from passenger perspective)
            driver_rel = get_position_description(main_landmark, img_width, img_height)
            inverted_driver_rel = invert_direction(driver_rel)
            
            if inverted_driver_rel and inverted_driver_rel != "정면":
                instruction = f"기사님이 {landmark_name} 근처 {inverted_driver_rel}에 있습니다."
            else:
                instruction = f"기사님이 {landmark_name} 근처에 있습니다."
            
            # Add context
            if context_items:
                context_str = ", ".join(context_items[:2])
                instruction += f" ({context_str})"
        elif context_items:
            context_str = ", ".join(context_items[:2])
            instruction = f"기사님이 픽업 위치에 있습니다. ({context_str})"
        else:
            instruction = "기사님이 픽업 위치 근처에 있습니다."
    
    else:  # Passenger mode
        if main_landmark:
            driver_rel = get_position_description(main_landmark, img_width, img_height)
            inverted_driver_rel = invert_direction(driver_rel)
            
            if inverted_driver_rel and inverted_driver_rel != "정면":
                instruction = f"{landmark_name} 근처 {inverted_driver_rel}으로 오세요."
            else:
                instruction = f"{landmark_name} 쪽으로 오세요."
            
            if context_items:
                context_str = ", ".join(context_items[:2])
                instruction += f" ({context_str})"
        elif traffic_lights:
            light = max(traffic_lights, key=lambda x: x.confidence)
            pos = get_position_description(light, img_width, img_height)
            inverted_pos = invert_direction(pos)
            if inverted_pos and inverted_pos != "정면":
                instruction = f"신호등 {inverted_pos}으로 이동하세요."
            else:
                instruction = "신호등 방향으로 이동하세요."
        else:
            instruction = "주변 표지판을 확인하며 이동하세요."

    return instruction, distance_meters, direction


@app.on_event("startup")
async def startup_event():
    load_model()


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": yolo_model is not None,
        "ocr_loaded": ocr_model is not None
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
    if yolo_model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    contents = await image.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image")

    height, width = img.shape[:2]

    # Run YOLO
    results = yolo_model(img, conf=0.25)[0]

    sign_detections = []
    other_detections = []

    # Collect detections
    for box in results.boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        conf = float(box.conf[0])
        cls_id = int(box.cls[0])
        cls_name = CLASS2ID.get(cls_id, f"class_{cls_id}")
        
        # Calculate area for sorting
        area = (x2 - x1) * (y2 - y1)
        
        detection_data = {
            "bbox": (x1, y1, x2, y2),
            "confidence": conf,
            "class_name": cls_name,
            "class_id": cls_id,
            "area": area
        }

        # Check if it's a sign that needs OCR
        if _match_class(cls_name, "platform", "traffic_sign", "sign"):
            sign_detections.append(detection_data)
        else:
            other_detections.append(detection_data)

    # Sort signs by area (descending) and take top 3
    sign_detections.sort(key=lambda x: x["area"], reverse=True)
    top_signs = sign_detections[:3]
    remaining_signs = sign_detections[3:]

    final_detections = []

    # Process top signs (with OCR)
    for d in top_signs:
        x1, y1, x2, y2 = map(int, d["bbox"])
        
        # Crop for OCR
        # Clamp coordinates
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(width, x2), min(height, y2)
        
        ocr_text = None
        if x2 > x1 and y2 > y1:
            crop = img[y1:y2, x1:x2]
            ocr_text = perform_ocr(crop)
        
        final_detections.append(BoundingBox(
            x1=d["bbox"][0], y1=d["bbox"][1], x2=d["bbox"][2], y2=d["bbox"][3],
            confidence=d["confidence"],
            class_name=d["class_name"],
            class_id=d["class_id"],
            ocr_text=ocr_text
        ))

    # Add remaining signs (without OCR)
    for d in remaining_signs:
        final_detections.append(BoundingBox(
            x1=d["bbox"][0], y1=d["bbox"][1], x2=d["bbox"][2], y2=d["bbox"][3],
            confidence=d["confidence"],
            class_name=d["class_name"],
            class_id=d["class_id"],
            ocr_text=None
        ))

    # Add other detections
    for d in other_detections:
        final_detections.append(BoundingBox(
            x1=d["bbox"][0], y1=d["bbox"][1], x2=d["bbox"][2], y2=d["bbox"][3],
            confidence=d["confidence"],
            class_name=d["class_name"],
            class_id=d["class_id"],
            ocr_text=None
        ))

    instruction, distance, direction = generate_instruction(
        final_detections,
        img_width=width,
        img_height=height,
        driver_lat=driver_latitude,
        driver_lon=driver_longitude,
        passenger_lat=passenger_latitude,
        passenger_lon=passenger_longitude,
        user_mode=user_mode,
    )

    return DetectionResponse(
        detections=final_detections,
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