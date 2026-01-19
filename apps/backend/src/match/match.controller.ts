import { Controller, Post, Get, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { MatchService } from './match.service';
import { RequestMatchDto } from './dto/request-match.dto';
import { UpdateGPSDto } from './dto/update-gps.dto';

@Controller('api/match')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post('request')
  async requestMatch(@Body() dto: RequestMatchDto) {
    return this.matchService.requestMatch(
      dto.userId,
      dto.username,
      dto.role,
      dto.targetUsername,
    );
  }

  @Get('status')
  async getMatchStatus(
    @Query('userId') userId: string,
    @Query('role') role: 'driver' | 'passenger',
  ) {
    const match = await this.matchService.getMatchStatus(userId, role);
    return match || { status: 'none' };
  }

  @Get(':matchId')
  async getMatch(@Param('matchId') matchId: string) {
    return this.matchService.findById(matchId);
  }

  @Put(':matchId/gps')
  async updateGPS(
    @Param('matchId') matchId: string,
    @Body() dto: UpdateGPSDto,
  ) {
    return this.matchService.updateGPS(
      matchId,
      dto.userId,
      dto.role,
      dto.latitude,
      dto.longitude,
    );
  }

  @Delete(':matchId')
  async cancelMatch(@Param('matchId') matchId: string) {
    await this.matchService.cancelMatch(matchId);
    return { success: true };
  }

  @Post(':matchId/complete')
  async completeMatch(@Param('matchId') matchId: string) {
    await this.matchService.completeMatch(matchId);
    return { success: true };
  }
}
