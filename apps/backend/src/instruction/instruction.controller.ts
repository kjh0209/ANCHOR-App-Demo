import { Controller, Post, Get, Delete, Body, Param, Query } from '@nestjs/common';
import { InstructionService } from './instruction.service';
import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

class CreateInstructionDto {
  @IsString()
  @IsNotEmpty()
  matchId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  detectionData: any;

  @IsOptional()
  @IsNumber()
  imageWidth?: number;

  @IsOptional()
  @IsNumber()
  imageHeight?: number;
}

@Controller('api/instruction')
export class InstructionController {
  constructor(private readonly instructionService: InstructionService) {}

  @Post('create')
  async create(@Body() dto: CreateInstructionDto) {
    return this.instructionService.create(
      dto.matchId,
      dto.content,
      dto.detectionData,
      dto.imageWidth,
      dto.imageHeight,
    );
  }

  @Post(':id/send')
  async send(@Param('id') id: string) {
    return this.instructionService.send(id);
  }

  @Delete(':id/cancel')
  async cancel(@Param('id') id: string) {
    await this.instructionService.cancel(id);
    return { success: true };
  }

  @Get('pending')
  async getPending(@Query('matchId') matchId: string) {
    const instruction = await this.instructionService.getPending(matchId);
    return instruction || { status: 'waiting' };
  }

  @Get('latest')
  async getLatest(@Query('matchId') matchId: string) {
    return this.instructionService.getLatest(matchId);
  }

  @Get('unsent')
  async getUnsent(@Query('matchId') matchId: string) {
    return this.instructionService.getUnsent(matchId);
  }
}
