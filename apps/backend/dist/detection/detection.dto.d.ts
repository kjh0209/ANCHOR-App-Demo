export declare class BoundingBoxDto {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    confidence: number;
    class_name: string;
    class_id: number;
    ocr_text?: string;
}
export declare class DetectImageDto {
    user_mode?: string;
    driver_latitude?: number;
    driver_longitude?: number;
    passenger_latitude?: number;
    passenger_longitude?: number;
}
export declare class DetectionResponseDto {
    detections: BoundingBoxDto[];
    instruction: string;
    image_width: number;
    image_height: number;
    driver_latitude?: number;
    driver_longitude?: number;
    passenger_latitude?: number;
    passenger_longitude?: number;
    distance_meters?: number;
    direction?: string;
}
