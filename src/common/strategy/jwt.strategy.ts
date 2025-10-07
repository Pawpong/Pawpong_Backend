import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * JWT 전략 클래스
 * JWT 토큰 검증 및 사용자 인증을 담당합니다.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback-secret',
        });
    }

    /**
     * JWT 페이로드 검증
     * 토큰이 유효할 때 호출되어 사용자 정보를 반환합니다.
     */
    async validate(payload: any) {
        console.log('[JwtStrategy] validate 호출 - payload:', JSON.stringify(payload));
        const user = {
            userId: payload.sub,
            email: payload.email,
            role: payload.role,
        };
        console.log('[JwtStrategy] validate 반환 - user:', JSON.stringify(user));
        return user;
    }
}
