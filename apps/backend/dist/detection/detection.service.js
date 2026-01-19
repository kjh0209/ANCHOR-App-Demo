"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DetectionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const detection_entity_1 = require("./detection.entity");
const axios_1 = require("axios");
const NodeFormData = require('form-data');
let DetectionService = class DetectionService {
    constructor(detectionRepository) {
        this.detectionRepository = detectionRepository;
        this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://ml-service:8000';
    }
    async detectObjects(file, dto) {
        const formData = new NodeFormData();
        formData.append('image', file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype,
        });
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
        const response = await axios_1.default.post(`${this.mlServiceUrl}/detect`, formData, {
            headers: formData.getHeaders(),
        });
        const mlResult = response.data;
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
    async getHistory(limit) {
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
    async getDetectionById(id) {
        const detection = await this.detectionRepository.findOne({ where: { id } });
        if (!detection) {
            throw new common_1.NotFoundException('Detection not found');
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
};
exports.DetectionService = DetectionService;
exports.DetectionService = DetectionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(detection_entity_1.Detection)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], DetectionService);
//# sourceMappingURL=detection.service.js.map