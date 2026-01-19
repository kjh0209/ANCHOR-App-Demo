import { IsIn, IsNumber, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateGPSDto {
  @IsUUID()
  userId: string;

  @IsIn(['driver', 'passenger'])
  role: 'driver' | 'passenger';

  // JSON에서 숫자가 문자열로 들어오는 경우도 많아서 안전하게 변환 권장
  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @Type(() => Number)
  @IsNumber()
  longitude: number;
}
