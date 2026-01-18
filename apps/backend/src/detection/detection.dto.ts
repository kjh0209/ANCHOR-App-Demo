import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class BoundingBoxDto {
  @IsNumber()
  x1: number;

  @IsNumber()
  y1: number;

  @IsNumber()
  x2: number;

  @IsNumber()
  y2: number;

  @IsNumber()
  confidence: number;

  @IsString()
  class_name: string;

  @IsNumber()
  class_id: number;

  @IsOptional()
  @IsString()
  ocr_text?: string;
}

export class DetectImageDto {
  @IsOptional()
  @IsString()
  user_mode?: string;

  @IsOptional()
  @IsNumber()
  driver_latitude?: number;

  @IsOptional()
  @IsNumber()
  driver_longitude?: number;

  @IsOptional()
  @IsNumber()
  passenger_latitude?: number;

  @IsOptional()
  @IsNumber()
  passenger_longitude?: number;
}

export class DetectionResponseDto {
  @IsNotEmpty()
  detections: BoundingBoxDto[];

  @IsString()
  instruction: string;

  @IsNumber()
  image_width: number;

  @IsNumber()
  image_height: number;

  @IsOptional()
  @IsNumber()
  driver_latitude?: number;

  @IsOptional()
  @IsNumber()
  driver_longitude?: number;

  @IsOptional()
  @IsNumber()
  passenger_latitude?: number;

  @IsOptional()
  @IsNumber()
  passenger_longitude?: number;

  @IsOptional()
  @IsNumber()
  distance_meters?: number;

  @IsOptional()
  @IsString()
  direction?: string;
}
