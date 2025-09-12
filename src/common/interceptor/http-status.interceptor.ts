import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpStatus } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

/**
 * HTTP 상태 코드 통일 인터셉터
 * POST 요청의 성공 응답을 201에서 200으로 변경합니다.
 */
@Injectable()
export class HttpStatusInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const response = context.switchToHttp().getResponse<Response>();
        const request = context.switchToHttp().getRequest();

        return next.handle().pipe(
            map((data) => {
                // POST 요청 성공 시 201 → 200으로 변경
                if (request.method === 'POST' && response.statusCode === HttpStatus.CREATED) {
                    response.status(HttpStatus.OK);
                }

                // PUT, PATCH 요청도 200으로 통일
                if (
                    (request.method === 'PUT' || request.method === 'PATCH') &&
                    response.statusCode === HttpStatus.NO_CONTENT
                ) {
                    response.status(HttpStatus.OK);
                }

                return data;
            }),
        );
    }
}
