import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SmsService } from './sms.service';
import { JwtStrategy } from '../../common/strategy/jwt.strategy';
import { GoogleStrategy } from '../../common/strategy/google.strategy';
import { NaverStrategy } from '../../common/strategy/naver.strategy';
import { KakaoStrategy } from '../../common/strategy/kakao.strategy';
import { AuthDatabaseModule } from '../../common/database/database.module';

@Module({
    imports: [
        AuthDatabaseModule,
        PassportModule,
        JwtModule.registerAsync({
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET') || 'your-jwt-secret-pawpong',
                signOptions: {
                    expiresIn: configService.get<string>('JWT_EXPIRATION') || '24h',
                },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, SmsService, JwtStrategy, GoogleStrategy, NaverStrategy, KakaoStrategy],
    exports: [AuthService, SmsService],
})
export class AuthModule {}