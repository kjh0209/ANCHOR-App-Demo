import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { IsString, IsIn } from 'class-validator';
import { AuthService } from './auth.service';

class RegisterDto {
  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsIn(['driver', 'passenger'])
  role: 'driver' | 'passenger';
}

class LoginDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.username, dto.password, dto.role);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  @Get('user/:id')
  async getUser(@Param('id') id: string) {
    const user = await this.authService.findById(id);
    if (!user) {
      return { error: '사용자를 찾을 수 없습니다.' };
    }
    return {
      id: user.id,
      username: user.username,
      role: user.role,
    };
  }

  @Get('user/by-username/:username')
  async getUserByUsername(@Param('username') username: string) {
    const user = await this.authService.findByUsername(username);
    if (!user) {
      return { error: '사용자를 찾을 수 없습니다.' };
    }
    return {
      id: user.id,
      username: user.username,
      role: user.role,
    };
  }
}
