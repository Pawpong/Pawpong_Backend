import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT 인증 가드
 * 토큰이 있으면 검증하고, 없으면 통과시킵니다.
 * @CurrentUser() 데코레이터로 user 정보를 받을 수 있으며, 토큰이 없으면 undefined입니다.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
    handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
        // 토큰이 없거나 유효하지 않아도 에러를 던지지 않음
        // user가 undefined이면 비로그인 사용자로 처리
        return user;
    }
}
