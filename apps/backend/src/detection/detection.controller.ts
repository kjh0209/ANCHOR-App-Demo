import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  Query,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DetectionService } from './detection.service';
import { DetectImageDto } from './detection.dto';

@Controller('api/detection')
export class DetectionController {
  constructor(private readonly detectionService: DetectionService) {}

  @Post('detect')
  @UseInterceptors(FileInterceptor('image'))
  async detectObjects(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: DetectImageDto,
  ) {
    return this.detectionService.detectObjects(file, dto);
  }

  @Get('history')
  async getHistory(@Query('limit') limit?: number) {
    return this.detectionService.getHistory(limit || 10);
  }

  @Get(':id')
  async getDetection(@Param('id') id: string) {
    return this.detectionService.getDetectionById(id);
  }
}
