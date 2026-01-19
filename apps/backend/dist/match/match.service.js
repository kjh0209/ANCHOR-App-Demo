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
exports.MatchService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const match_entity_1 = require("./match.entity");
let MatchService = class MatchService {
    constructor(matchRepository) {
        this.matchRepository = matchRepository;
    }
    async requestMatch(userId, username, role, targetUsername) {
        console.log(`[매칭 요청] userId: ${userId}, username: ${username}, role: ${role}, targetUsername: ${targetUsername}`);
        const driverUsername = role === 'driver' ? username : targetUsername;
        const passengerUsername = role === 'driver' ? targetUsername : username;
        console.log(`[매칭 검색] driverUsername: ${driverUsername}, passengerUsername: ${passengerUsername}`);
        let match = await this.matchRepository.findOne({
            where: [
                {
                    driverUsername: driverUsername,
                    passengerUsername: passengerUsername,
                    status: 'pending',
                },
                {
                    driverUsername: passengerUsername,
                    passengerUsername: driverUsername,
                    status: 'pending',
                },
            ],
        });
        if (match) {
            console.log(`[기존 매칭 발견] id: ${match.id}, driverUsername: ${match.driverUsername}, passengerUsername: ${match.passengerUsername}, driverConfirmed: ${match.driverConfirmed}, passengerConfirmed: ${match.passengerConfirmed}, driverId: ${match.driverId}, passengerId: ${match.passengerId}`);
            if (!match.driverUsername || !match.passengerUsername) {
                console.log(`[username NULL 수정] driverUsername: ${driverUsername}, passengerUsername: ${passengerUsername}`);
                match.driverUsername = driverUsername;
                match.passengerUsername = passengerUsername;
            }
            if (match.driverUsername === passengerUsername && match.passengerUsername === driverUsername) {
                console.log(`[username 순서 정규화]`);
                match.driverUsername = driverUsername;
                match.passengerUsername = passengerUsername;
            }
            if (role === 'driver') {
                if (match.passengerConfirmed && !match.driverConfirmed) {
                    console.log(`[매칭 완료] 기사 입력 - 승객이 이미 입력함`);
                    match.driverId = userId;
                    match.driverConfirmed = true;
                    match.status = 'matched';
                }
                else if (!match.driverConfirmed) {
                    console.log(`[매칭 업데이트] 기사 확인 처리`);
                    match.driverId = userId;
                    match.driverConfirmed = true;
                    if (match.passengerConfirmed) {
                        match.status = 'matched';
                    }
                }
                else if (match.driverId !== userId) {
                    console.log(`[매칭 업데이트] 기사 ID 변경`);
                    match.driverId = userId;
                }
            }
            else {
                if (match.driverConfirmed && !match.passengerConfirmed) {
                    console.log(`[매칭 완료] 승객 입력 - 기사가 이미 입력함`);
                    match.passengerId = userId;
                    match.passengerConfirmed = true;
                    match.status = 'matched';
                }
                else if (!match.passengerConfirmed) {
                    console.log(`[매칭 업데이트] 승객 확인 처리`);
                    match.passengerId = userId;
                    match.passengerConfirmed = true;
                    if (match.driverConfirmed) {
                        match.status = 'matched';
                    }
                }
                else if (match.passengerId !== userId) {
                    console.log(`[매칭 업데이트] 승객 ID 변경`);
                    match.passengerId = userId;
                }
            }
            const saved = await this.matchRepository.save(match);
            console.log(`[매칭 저장 완료] id: ${saved.id}, status: ${saved.status}, driverConfirmed: ${saved.driverConfirmed}, passengerConfirmed: ${saved.passengerConfirmed}`);
            return saved;
        }
        else {
            console.log(`[새 매칭 생성] driverUsername: ${driverUsername}, passengerUsername: ${passengerUsername}`);
            const newMatch = this.matchRepository.create({
                driverId: role === 'driver' ? userId : null,
                driverUsername: driverUsername,
                passengerId: role === 'passenger' ? userId : null,
                passengerUsername: passengerUsername,
                driverConfirmed: role === 'driver',
                passengerConfirmed: role === 'passenger',
                status: 'pending',
            });
            const saved = await this.matchRepository.save(newMatch);
            console.log(`[새 매칭 저장 완료] id: ${saved.id}, status: ${saved.status}`);
            return saved;
        }
    }
    async findActiveMatchByUser(userId, role) {
        if (role === 'driver') {
            return this.matchRepository.findOne({
                where: [
                    { driverId: userId, status: 'pending' },
                    { driverId: userId, status: 'matched' },
                ],
                order: { createdAt: 'DESC' },
            });
        }
        else {
            return this.matchRepository.findOne({
                where: [
                    { passengerId: userId, status: 'pending' },
                    { passengerId: userId, status: 'matched' },
                ],
                order: { createdAt: 'DESC' },
            });
        }
    }
    async getMatchStatus(userId, role) {
        return this.findActiveMatchByUser(userId, role);
    }
    async updateGPS(matchId, userId, role, latitude, longitude) {
        const match = await this.matchRepository.findOne({
            where: { id: matchId },
        });
        if (!match) {
            throw new common_1.BadRequestException('매칭을 찾을 수 없습니다.');
        }
        if (role === 'driver') {
            match.driverLatitude = latitude;
            match.driverLongitude = longitude;
        }
        else {
            match.passengerLatitude = latitude;
            match.passengerLongitude = longitude;
        }
        return this.matchRepository.save(match);
    }
    async cancelMatch(matchId) {
        await this.matchRepository.delete(matchId);
    }
    async completeMatch(matchId) {
        const match = await this.matchRepository.findOne({ where: { id: matchId } });
        if (match) {
            match.status = 'completed';
            await this.matchRepository.save(match);
        }
    }
    async findById(matchId) {
        return this.matchRepository.findOne({ where: { id: matchId } });
    }
};
exports.MatchService = MatchService;
exports.MatchService = MatchService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(match_entity_1.Match)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], MatchService);
//# sourceMappingURL=match.service.js.map