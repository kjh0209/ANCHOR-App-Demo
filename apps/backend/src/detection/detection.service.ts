import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Detection } from './detection.entity';
import { DetectImageDto } from './detection.dto';
import axios from 'axios';
import FormData from 'form-data';

@Injectable()
export class DetectionService {
  private readonly mlServiceUrl: string;

  constructor(
    @InjectRepository(Detection)
    private detectionRepository: Repository<Detection>,
  ) {
    this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://ml-service:8000';
  }

  async detectObjects(file: Express.Multer.File, dto: DetectImageDto) {
    // Prepare form data for ML service
    const formData = new FormData();
    formData.append('image', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    // Add GPS data if provided
    if (dto.user_mode) {
      formData.append('user_mode', dto.user_mode);
    }
    if (dto.driver_latitude !== undefined) {
      formData.append('driver_latitude', dto.driver_latitude.toString());
    }
    if (dto.driver_longitude !== undefined) {
      formData.append('driver_longitude', dto.driver_longitude.toString());
    }
    if (dto.passenger_latitude !== undefined) {
      formData.append('passenger_latitude', dto.passenger_latitude.toString());
    }
    if (dto.passenger_longitude !== undefined) {
      formData.append('passenger_longitude', dto.passenger_longitude.toString());
    }

    // Call ML service
    const response = await axios.post(
      `${this.mlServiceUrl}/detect`,
      formData,
      {
        headers: formData.getHeaders(),
      },
    );

    const mlResult = response.data;

    // Save to database
    const detection = this.detectionRepository.create({
      detections: mlResult.detections,
      instruction: mlResult.instruction,
      imageWidth: mlResult.image_width,
      imageHeight: mlResult.image_height,
      driverLatitude: dto.driver_latitude,
      driverLongitude: dto.driver_longitude,
      passengerLatitude: dto.passenger_latitude,
      passengerLongitude: dto.passenger_longitude,
      distanceMeters: mlResult.distance_meters,
      direction: mlResult.direction,
    });

    const saved = await this.detectionRepository.save(detection);

    return {
      id: saved.id,
      detections: saved.detections,
      instruction: saved.instruction,
      image_width: saved.imageWidth,
      image_height: saved.imageHeight,
      driver_latitude: saved.driverLatitude,
      driver_longitude: saved.driverLongitude,
      passenger_latitude: saved.passengerLatitude,
      passenger_longitude: saved.passengerLongitude,
      distance_meters: saved.distanceMeters,
      direction: saved.direction,
    };
  }

  async getHistory(limit: number) {
    const detections = await this.detectionRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return detections.map((d) => ({
      id: d.id,
      detections: d.detections,
      instruction: d.instruction,
      driver_latitude: d.driverLatitude,
      driver_longitude: d.driverLongitude,
      passenger_latitude: d.passengerLatitude,
      passenger_longitude: d.passengerLongitude,
      distance_meters: d.distanceMeters,
      direction: d.direction,
      createdAt: d.createdAt,
    }));
  }

  async getDetectionById(id: string) {
    const detection = await this.detectionRepository.findOne({ where: { id } });
    if (!detection) {
      throw new Error('Detection not found');
    }

    return {
      id: detection.id,
      detections: detection.detections,
      instruction: detection.instruction,
      driver_latitude: detection.driverLatitude,
      driver_longitude: detection.driverLongitude,
      passenger_latitude: detection.passengerLatitude,
      passenger_longitude: detection.passengerLongitude,
      distance_meters: detection.distanceMeters,
      direction: detection.direction,
      createdAt: detection.createdAt,
    };
  }
}
