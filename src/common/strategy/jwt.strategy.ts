import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * JWT 전략 클래스
 * JWT 토큰 검증 및 사용자 인증을 담당합니다.
 * 쿠키와 Authorization 헤더 둘 다에서 토큰을 추출합니다.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        const jwtSecret = configService.get<string>('JWT_SECRET') || 'fallback-secret';
        console.log('[JwtStrategy] Constructor - JWT_SECRET 길이:', jwtSecret.length);
        console.log('[JwtStrategy] Constructor - JWT_SECRET 앞 10자:', jwtSecret.substring(0, 10));

        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                // 1순위: 쿠키에서 토큰 추출
                (request: Request) => {
                    console.log('[JwtStrategy] 쿠키 추출 시도');
                    console.log('[JwtStrategy] request.cookies:', request.cookies);

                    let token: string | null = null;
                    if (request && request.cookies) {
                        token = request.cookies['accessToken'];
                        if (token) {
                            console.log('[JwtStrategy] 쿠키에서 토큰 추출 성공:', token.substring(0, 20) + '...');
                        } else {
                            console.log('[JwtStrategy] 쿠키에 accessToken 없음');
                        }
                    } else {
                        console.log('[JwtStrategy] request.cookies가 undefined');
                    }
                    return token;
                },
                // 2순위: Authorization 헤더에서 토큰 추출 (fallback)
                ExtractJwt.fromAuthHeaderAsBearerToken(),
            ]),
            ignoreExpiration: false,
            secretOrKey: jwtSecret,
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
