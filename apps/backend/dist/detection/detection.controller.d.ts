import { DetectionService } from './detection.service';
import { DetectImageDto } from './detection.dto';
export declare class DetectionController {
    private readonly detectionService;
    constructor(detectionService: DetectionService);
    detectObjects(file: Express.Multer.File, dto: DetectImageDto): Promise<{
        id: string;
        detections: any;
        instruction: string;
        image_width: number;
        image_height: number;
        driver_latitude: number;
        driver_longitude: number;
        passenger_latitude: number;
        passenger_longitude: number;
        distance_meters: number;
        direction: string;
    }>;
    getHistory(limit?: number): Promise<{
        id: string;
        detections: any;
        instruction: string;
        driver_latitude: number;
        driver_longitude: number;
        passenger_latitude: number;
        passenger_longitude: number;
        distance_meters: number;
        direction: string;
        createdAt: Date;
    }[]>;
    getDetection(id: string): Promise<{
        id: string;
        detections: any;
        instruction: string;
        driver_latitude: number;
        driver_longitude: number;
        passenger_latitude: number;
        passenger_longitude: number;
        distance_meters: number;
        direction: string;
        createdAt: Date;
    }>;
}
