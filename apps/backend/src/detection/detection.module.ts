import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DetectionController } from './detection.controller';
import { DetectionService } from './detection.service';
import { Detection } from './detection.entity';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([Detection]),
    HttpModule,
  ],
  controllers: [DetectionController],
  providers: [DetectionService],
})
export class DetectionModule {}
