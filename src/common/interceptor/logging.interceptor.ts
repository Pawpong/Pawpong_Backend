import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';

import { CustomLoggerService } from '../logger/custom-logger.service';

/**
 * HTTP 요청 로깅 인터셉터
 * Winston 로거를 사용하여 모든 HTTP 요청 정보를 로그로 기록합니다.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    constructor(private readonly logger: CustomLoggerService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        if (context.getType() !== 'http') {
            return next.handle();
        }

        const ctx = context.switchToHttp();
        const request = ctx.getRequest<Request>();

        const { method, url, ip, headers, cookies, body } = request;

        // 요청 정보 로깅
        this.logger.log(
            `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        );
        this.logger.log(`→ Request: ${method} ${url}`);
        this.logger.log(
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        );
        this.logger.log(`  IP: ${ip}`);

        // Bearer 토큰 로깅
        if (headers.authorization) {
            if (headers.authorization.startsWith('Bearer ')) {
                const token = headers.authorization.substring(7);
                this.logger.log(`  Bearer Token: ${token.substring(0, 20)}...`);
            } else {
                this.logger.log(`  Authorization: ${headers.authorization.substring(0, 30)}...`);
            }
        }

        // 쿠키 로깅
        if (cookies) {
            const cookieKeys = Object.keys(cookies);
            if (cookieKeys.length > 0) {
                this.logger.log(`  Cookies: ${cookieKeys.join(', ')}`);
                if (cookies.accessToken) {
                    this.logger.log(`  AccessToken (Cookie): ${cookies.accessToken.substring(0, 20)}...`);
                }
                if (cookies.refreshToken) {
                    this.logger.log(`  RefreshToken (Cookie): ${cookies.refreshToken.substring(0, 20)}...`);
                }
                if (cookies.userRole) {
                    this.logger.log(`  UserRole (Cookie): ${cookies.userRole}`);
                }
            } else {
                this.logger.log(`  Cookies: (none)`);
            }
        }

        // Body 로깅 (multipart 제외)
        if (body && Object.keys(body).length > 0) {
            this.logger.log(`  Body: ${JSON.stringify(body)}`);
        }

        // Content-Type 로깅
        if (headers['content-type']) {
            this.logger.log(`  Content-Type: ${headers['content-type']}`);
        }

        this.logger.log(
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`,
        );

        // 응답은 로깅하지 않음 (사용자 요청)
        return next.handle();
    }
}
