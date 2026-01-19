import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DetectionModule } from './detection/detection.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { MatchModule } from './match/match.module';
import { InstructionModule } from './instruction/instruction.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '3306'),
      username: process.env.DATABASE_USER || 'airport',
      password: process.env.DATABASE_PASSWORD || 'airport123',
      database: process.env.DATABASE_NAME || 'airport_guidance',
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
      charset: 'utf8mb4',
    }),
    DetectionModule,
    UserModule,
    AuthModule,
    MatchModule,
    InstructionModule,
  ],
})
export class AppModule {}
