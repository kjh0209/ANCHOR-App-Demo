import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from './match.entity';

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
  ) {}

  async requestMatch(
    userId: string,
    username: string,
    role: 'driver' | 'passenger',
    targetUsername: string,
  ): Promise<Match> {
    console.log(`[매칭 요청] userId: ${userId}, username: ${username}, role: ${role}, targetUsername: ${targetUsername}`);

    // username 조합이 같은 기존 매칭 찾기 (양방향) - 먼저 찾기
    // (driverUsername, passengerUsername) 조합이 같으면 같은 매칭
    const driverUsername = role === 'driver' ? username : targetUsername;
    const passengerUsername = role === 'driver' ? targetUsername : username;

    console.log(`[매칭 검색] driverUsername: ${driverUsername}, passengerUsername: ${passengerUsername}`);

    // username 조합으로 먼저 찾기 (NULL이 아닌 경우만)
    let match = await this.matchRepository.findOne({
      where: [
        // 경우 1: 기사가 먼저 입력한 경우
        {
          driverUsername: driverUsername,
          passengerUsername: passengerUsername,
          status: 'pending',
        },
        // 경우 2: 승객이 먼저 입력한 경우 (순서 반대)
        {
          driverUsername: passengerUsername,
          passengerUsername: driverUsername,
          status: 'pending',
        },
      ],
    });

    if (match) {
      console.log(`[기존 매칭 발견] id: ${match.id}, driverUsername: ${match.driverUsername}, passengerUsername: ${match.passengerUsername}, driverConfirmed: ${match.driverConfirmed}, passengerConfirmed: ${match.passengerConfirmed}, driverId: ${match.driverId}, passengerId: ${match.passengerId}`);

      // username이 NULL이면 설정
      if (!match.driverUsername || !match.passengerUsername) {
        console.log(`[username NULL 수정] driverUsername: ${driverUsername}, passengerUsername: ${passengerUsername}`);
        match.driverUsername = driverUsername;
        match.passengerUsername = passengerUsername;
      }

      // username 순서 정규화 (항상 driverUsername: driver, passengerUsername: passenger)
      if (match.driverUsername === passengerUsername && match.passengerUsername === driverUsername) {
        // 순서가 반대인 경우 정규화
        console.log(`[username 순서 정규화]`);
        match.driverUsername = driverUsername;
        match.passengerUsername = passengerUsername;
      }

      if (role === 'driver') {
        // 기사가 입력
        if (match.passengerConfirmed && !match.driverConfirmed) {
          // 승객이 이미 입력함 - 매칭 완료
          console.log(`[매칭 완료] 기사 입력 - 승객이 이미 입력함`);
          match.driverId = userId;
          match.driverConfirmed = true;
          match.status = 'matched';
        } else if (!match.driverConfirmed) {
          // 기사가 아직 확인하지 않음 - 확인 처리
          console.log(`[매칭 업데이트] 기사 확인 처리`);
          match.driverId = userId;
          match.driverConfirmed = true;
          // 승객도 확인했으면 매칭 완료
          if (match.passengerConfirmed) {
            match.status = 'matched';
          }
        } else if (match.driverId !== userId) {
          // 다른 기사 ID인 경우 업데이트
          console.log(`[매칭 업데이트] 기사 ID 변경`);
          match.driverId = userId;
        }
      } else {
        // 승객이 입력
        if (match.driverConfirmed && !match.passengerConfirmed) {
          // 기사가 이미 입력함 - 매칭 완료
          console.log(`[매칭 완료] 승객 입력 - 기사가 이미 입력함`);
          match.passengerId = userId;
          match.passengerConfirmed = true;
          match.status = 'matched';
        } else if (!match.passengerConfirmed) {
          // 승객이 아직 확인하지 않음 - 확인 처리
          console.log(`[매칭 업데이트] 승객 확인 처리`);
          match.passengerId = userId;
          match.passengerConfirmed = true;
          // 기사도 확인했으면 매칭 완료
          if (match.driverConfirmed) {
            match.status = 'matched';
          }
        } else if (match.passengerId !== userId) {
          // 다른 승객 ID인 경우 업데이트
          console.log(`[매칭 업데이트] 승객 ID 변경`);
          match.passengerId = userId;
        }
      }

      const saved = await this.matchRepository.save(match);
      console.log(`[매칭 저장 완료] id: ${saved.id}, status: ${saved.status}, driverConfirmed: ${saved.driverConfirmed}, passengerConfirmed: ${saved.passengerConfirmed}`);
      return saved;
    } else {
      // 새 매칭 요청 생성
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

  async findActiveMatchByUser(
    userId: string,
    role: 'driver' | 'passenger',
  ): Promise<Match | null> {
    if (role === 'driver') {
      return this.matchRepository.findOne({
        where: [
          { driverId: userId, status: 'pending' },
          { driverId: userId, status: 'matched' },
        ],
        order: { createdAt: 'DESC' },
      });
    } else {
      return this.matchRepository.findOne({
        where: [
          { passengerId: userId, status: 'pending' },
          { passengerId: userId, status: 'matched' },
        ],
        order: { createdAt: 'DESC' },
      });
    }
  }

  async getMatchStatus(
    userId: string,
    role: 'driver' | 'passenger',
  ): Promise<Match | null> {
    return this.findActiveMatchByUser(userId, role);
  }

  async updateGPS(
    matchId: string,
    userId: string,
    role: 'driver' | 'passenger',
    latitude: number,
    longitude: number,
  ): Promise<Match> {
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
    });

    if (!match) {
      throw new BadRequestException('매칭을 찾을 수 없습니다.');
    }

    if (role === 'driver') {
      match.driverLatitude = latitude;
      match.driverLongitude = longitude;
    } else {
      match.passengerLatitude = latitude;
      match.passengerLongitude = longitude;
    }

    return this.matchRepository.save(match);
  }

  async cancelMatch(matchId: string): Promise<void> {
    await this.matchRepository.delete(matchId);
  }

  async completeMatch(matchId: string): Promise<void> {
    const match = await this.matchRepository.findOne({ where: { id: matchId } });
    if (match) {
      match.status = 'completed';
      await this.matchRepository.save(match);
    }
  }

  async findById(matchId: string): Promise<Match | null> {
    return this.matchRepository.findOne({ where: { id: matchId } });
  }
}
