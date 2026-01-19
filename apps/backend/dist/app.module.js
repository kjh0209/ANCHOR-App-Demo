"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const detection_module_1 = require("./detection/detection.module");
const user_module_1 = require("./user/user.module");
const auth_module_1 = require("./auth/auth.module");
const match_module_1 = require("./match/match.module");
const instruction_module_1 = require("./instruction/instruction.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            typeorm_1.TypeOrmModule.forRoot({
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
            detection_module_1.DetectionModule,
            user_module_1.UserModule,
            auth_module_1.AuthModule,
            match_module_1.MatchModule,
            instruction_module_1.InstructionModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map