import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Instruction } from './instruction.entity';

@Injectable()
export class InstructionService {
  constructor(
    @InjectRepository(Instruction)
    private instructionRepository: Repository<Instruction>,
  ) {}

  async create(
    matchId: string,
    content: string,
    detectionData: any,
    imageWidth?: number,
    imageHeight?: number,
  ): Promise<Instruction> {
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

  async send(instructionId: string): Promise<Instruction> {
    const instruction = await this.instructionRepository.findOne({
      where: { id: instructionId },
    });

    if (!instruction) {
      throw new NotFoundException('안내문을 찾을 수 없습니다.');
    }

    instruction.sentToPassenger = true;
    return this.instructionRepository.save(instruction);
  }

  async cancel(instructionId: string): Promise<void> {
    await this.instructionRepository.delete(instructionId);
  }

  async getPending(matchId: string): Promise<Instruction | null> {
    return this.instructionRepository.findOne({
      where: {
        matchId,
        sentToPassenger: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async getLatest(matchId: string): Promise<Instruction | null> {
    return this.instructionRepository.findOne({
      where: { matchId },
      order: { createdAt: 'DESC' },
    });
  }

  async getUnsent(matchId: string): Promise<Instruction | null> {
    return this.instructionRepository.findOne({
      where: {
        matchId,
        sentToPassenger: false,
      },
      order: { createdAt: 'DESC' },
    });
  }
}
