import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstructionController } from './instruction.controller';
import { InstructionService } from './instruction.service';
import { Instruction } from './instruction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Instruction])],
  controllers: [InstructionController],
  providers: [InstructionService],
  exports: [InstructionService],
})
export class InstructionModule {}
