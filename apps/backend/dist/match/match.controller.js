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
exports.MatchController = void 0;
const common_1 = require("@nestjs/common");
const match_service_1 = require("./match.service");
const request_match_dto_1 = require("./dto/request-match.dto");
const update_gps_dto_1 = require("./dto/update-gps.dto");
let MatchController = class MatchController {
    constructor(matchService) {
        this.matchService = matchService;
    }
    async requestMatch(dto) {
        return this.matchService.requestMatch(dto.userId, dto.username, dto.role, dto.targetUsername);
    }
    async getMatchStatus(userId, role) {
        const match = await this.matchService.getMatchStatus(userId, role);
        return match || { status: 'none' };
    }
    async getMatch(matchId) {
        return this.matchService.findById(matchId);
    }
    async updateGPS(matchId, dto) {
        return this.matchService.updateGPS(matchId, dto.userId, dto.role, dto.latitude, dto.longitude);
    }
    async cancelMatch(matchId) {
        await this.matchService.cancelMatch(matchId);
        return { success: true };
    }
    async completeMatch(matchId) {
        await this.matchService.completeMatch(matchId);
        return { success: true };
    }
};
exports.MatchController = MatchController;
__decorate([
    (0, common_1.Post)('request'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_match_dto_1.RequestMatchDto]),
    __metadata("design:returntype", Promise)
], MatchController.prototype, "requestMatch", null);
__decorate([
    (0, common_1.Get)('status'),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MatchController.prototype, "getMatchStatus", null);
__decorate([
    (0, common_1.Get)(':matchId'),
    __param(0, (0, common_1.Param)('matchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MatchController.prototype, "getMatch", null);
__decorate([
    (0, common_1.Put)(':matchId/gps'),
    __param(0, (0, common_1.Param)('matchId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_gps_dto_1.UpdateGPSDto]),
    __metadata("design:returntype", Promise)
], MatchController.prototype, "updateGPS", null);
__decorate([
    (0, common_1.Delete)(':matchId'),
    __param(0, (0, common_1.Param)('matchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MatchController.prototype, "cancelMatch", null);
__decorate([
    (0, common_1.Post)(':matchId/complete'),
    __param(0, (0, common_1.Param)('matchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MatchController.prototype, "completeMatch", null);
exports.MatchController = MatchController = __decorate([
    (0, common_1.Controller)('api/match'),
    __metadata("design:paramtypes", [match_service_1.MatchService])
], MatchController);
//# sourceMappingURL=match.controller.js.map