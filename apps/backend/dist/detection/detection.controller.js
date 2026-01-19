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
exports.DetectionController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const detection_service_1 = require("./detection.service");
const detection_dto_1 = require("./detection.dto");
let DetectionController = class DetectionController {
    constructor(detectionService) {
        this.detectionService = detectionService;
    }
    async detectObjects(file, dto) {
        return this.detectionService.detectObjects(file, dto);
    }
    async getHistory(limit) {
        return this.detectionService.getHistory(limit || 10);
    }
    async getDetection(id) {
        return this.detectionService.getDetectionById(id);
    }
};
exports.DetectionController = DetectionController;
__decorate([
    (0, common_1.Post)('detect'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, detection_dto_1.DetectImageDto]),
    __metadata("design:returntype", Promise)
], DetectionController.prototype, "detectObjects", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], DetectionController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DetectionController.prototype, "getDetection", null);
exports.DetectionController = DetectionController = __decorate([
    (0, common_1.Controller)('api/detection'),
    __metadata("design:paramtypes", [detection_service_1.DetectionService])
], DetectionController);
//# sourceMappingURL=detection.controller.js.map