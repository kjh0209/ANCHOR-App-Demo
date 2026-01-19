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
exports.InstructionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const instruction_entity_1 = require("./instruction.entity");
let InstructionService = class InstructionService {
    constructor(instructionRepository) {
        this.instructionRepository = instructionRepository;
    }
    async create(matchId, content, detectionData, imageWidth, imageHeight) {
        const instruction = this.instructionRepository.create({
            matchId,
            content,
            detectionData,
            imageWidth,
            imageHeight,
            sentToPassenger: false,
        });
        return this.instructionRepository.save(instruction);
    }
    async send(instructionId) {
        const instruction = await this.instructionRepository.findOne({
            where: { id: instructionId },
        });
        if (!instruction) {
            throw new common_1.NotFoundException('안내문을 찾을 수 없습니다.');
        }
        instruction.sentToPassenger = true;
        return this.instructionRepository.save(instruction);
    }
    async cancel(instructionId) {
        await this.instructionRepository.delete(instructionId);
    }
    async getPending(matchId) {
        return this.instructionRepository.findOne({
            where: {
                matchId,
                sentToPassenger: true,
            },
            order: { createdAt: 'DESC' },
        });
    }
    async getLatest(matchId) {
        return this.instructionRepository.findOne({
            where: { matchId },
            order: { createdAt: 'DESC' },
        });
    }
    async getUnsent(matchId) {
        return this.instructionRepository.findOne({
            where: {
                matchId,
                sentToPassenger: false,
            },
            order: { createdAt: 'DESC' },
        });
    }
};
exports.InstructionService = InstructionService;
exports.InstructionService = InstructionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(instruction_entity_1.Instruction)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], InstructionService);
//# sourceMappingURL=instruction.service.js.map