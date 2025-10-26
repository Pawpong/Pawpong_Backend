import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';

import { JwtStrategy } from '../../common/strategy/jwt.strategy';
import { winstonConfig } from '../../common/config/winston.config';
import { GoogleStrategy } from '../../common/strategy/google.strategy';
import { NaverStrategy } from '../../common/strategy/naver.strategy';
import { KakaoStrategy } from '../../common/strategy/kakao.strategy';

import { AuthController } from './auth.controller';

import { CustomLoggerService } from '../../common/logger/custom-logger.service';
import { AuthService } from './auth.service';
import { SmsService } from './sms.service';

import { AuthAdopterRepository } from './repository/auth-adopter.repository';
import { AuthBreederRepository } from './repository/auth-breeder.repository';

import { StorageModule } from '../../common/storage/storage.module';
import { AuthDatabaseModule } from '../../common/database/database.module';

@Module({
    imports: [
        AuthDatabaseModule,
        StorageModule,
        PassportModule,
        WinstonModule.forRoot(winstonConfig),
        JwtModule.registerAsync({
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: {
                    expiresIn: configService.get<string>('JWT_EXPIRATION'),
                },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        SmsService,
        AuthAdopterRepository,
        AuthBreederRepository,
        JwtStrategy,
        GoogleStrategy,
        NaverStrategy,
        KakaoStrategy,
        CustomLoggerService,
    ],
    exports: [AuthService, SmsService],
})
export class AuthModule {}
