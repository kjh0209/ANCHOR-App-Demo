import { IsIn, IsString, IsUUID } from 'class-validator';

export class RequestMatchDto {
  @IsUUID()
  userId: string;

  @IsString()
  username: string;

  @IsIn(['driver', 'passenger'])
  role: 'driver' | 'passenger';

  @IsString()
  targetUsername: string;
}