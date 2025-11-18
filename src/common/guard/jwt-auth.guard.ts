import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT 인증 가드
 * JWT 토큰 검증 실패 시 상세한 에러 로깅을 제공합니다.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    canActivate(context: ExecutionContext) {
        // JWT 검증 시작
        console.log('[JwtAuthGuard] canActivate - JWT 검증 시작');
        return super.canActivate(context);
    }

    handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
        console.log('[JwtAuthGuard] handleRequest 호출');
        console.log('[JwtAuthGuard] err:', err);
        console.log('[JwtAuthGuard] user:', user);
        console.log('[JwtAuthGuard] info:', info);

        // 에러가 있거나 user가 없으면 인증 실패
        if (err || !user) {
            console.error('[JwtAuthGuard] 인증 실패!');

            if (info) {
                console.error('[JwtAuthGuard] 실패 이유:', info.message || info.name);

                // 상세 에러 메시지
                if (info.name === 'TokenExpiredError') {
                    console.error('[JwtAuthGuard] 토큰 만료! expiredAt:', info.expiredAt);
                    throw new UnauthorizedException('토큰이 만료되었습니다. 다시 로그인해주세요.');
                } else if (info.name === 'JsonWebTokenError') {
                    console.error('[JwtAuthGuard] JWT 검증 실패! 메시지:', info.message);
                    throw new UnauthorizedException('유효하지 않은 토큰입니다.');
                } else if (info.name === 'NotBeforeError') {
                    console.error('[JwtAuthGuard] 토큰이 아직 유효하지 않습니다.');
                    throw new UnauthorizedException('토큰이 아직 유효하지 않습니다.');
                } else if (info.message === 'No auth token') {
                    console.error('[JwtAuthGuard] 토큰이 제공되지 않았습니다.');
                    throw new UnauthorizedException('인증 토큰이 필요합니다.');
                } else {
                    console.error('[JwtAuthGuard] 알 수 없는 인증 실패:', info);
                }
            }

            if (err) {
                console.error('[JwtAuthGuard] 에러 객체:', err);
                throw err;
            }

            throw new UnauthorizedException('인증에 실패했습니다.');
        }

        console.log('[JwtAuthGuard] 인증 성공! user:', JSON.stringify(user));
        return user;
    }
}
