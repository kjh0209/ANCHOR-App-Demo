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
exports.InstructionController = void 0;
const common_1 = require("@nestjs/common");
const instruction_service_1 = require("./instruction.service");
const class_validator_1 = require("class-validator");
class CreateInstructionDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateInstructionDto.prototype, "matchId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateInstructionDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateInstructionDto.prototype, "detectionData", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateInstructionDto.prototype, "imageWidth", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateInstructionDto.prototype, "imageHeight", void 0);
let InstructionController = class InstructionController {
    constructor(instructionService) {
        this.instructionService = instructionService;
    }
    async create(dto) {
        return this.instructionService.create(dto.matchId, dto.content, dto.detectionData, dto.imageWidth, dto.imageHeight);
    }
    async send(id) {
        return this.instructionService.send(id);
    }
    async cancel(id) {
        await this.instructionService.cancel(id);
        return { success: true };
    }
    async getPending(matchId) {
        const instruction = await this.instructionService.getPending(matchId);
        return instruction || { status: 'waiting' };
    }
    async getLatest(matchId) {
        return this.instructionService.getLatest(matchId);
    }
    async getUnsent(matchId) {
        return this.instructionService.getUnsent(matchId);
    }
};
exports.InstructionController = InstructionController;
__decorate([
    (0, common_1.Post)('create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateInstructionDto]),
    __metadata("design:returntype", Promise)
], InstructionController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/send'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InstructionController.prototype, "send", null);
__decorate([
    (0, common_1.Delete)(':id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InstructionController.prototype, "cancel", null);
__decorate([
    (0, common_1.Get)('pending'),
    __param(0, (0, common_1.Query)('matchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InstructionController.prototype, "getPending", null);
__decorate([
    (0, common_1.Get)('latest'),
    __param(0, (0, common_1.Query)('matchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InstructionController.prototype, "getLatest", null);
__decorate([
    (0, common_1.Get)('unsent'),
    __param(0, (0, common_1.Query)('matchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InstructionController.prototype, "getUnsent", null);
exports.InstructionController = InstructionController = __decorate([
    (0, common_1.Controller)('api/instruction'),
    __metadata("design:paramtypes", [instruction_service_1.InstructionService])
], InstructionController);
//# sourceMappingURL=instruction.controller.js.map