import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponseDto } from '../dto/response/api-response.dto';

/**
 * HTTP 예외 필터
 * 모든 HTTP 예외를 ApiResponseDto 형식으로 변환하여 반환합니다.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus();

        // 예외 응답 가져오기
        const exceptionResponse = exception.getResponse();
        let errorMessage: string;

        // 에러 메시지 추출
        if (typeof exceptionResponse === 'string') {
            errorMessage = exceptionResponse;
        } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
            const responseObj = exceptionResponse as any;
            errorMessage = responseObj.message || responseObj.error || 'Unknown error';

            // message가 배열인 경우 (ValidationPipe 에러)
            if (Array.isArray(errorMessage)) {
                errorMessage = errorMessage.join(', ');
            }
        } else {
            errorMessage = 'Unknown error';
        }

        // 에러 로깅
        this.logger.error(
            `[${request.method}] ${request.url} - ${status} - ${errorMessage}`,
        );

        // ApiResponseDto 형식으로 응답
        const errorResponse = ApiResponseDto.error(errorMessage, status);

        response.status(status).json(errorResponse);
    }
}

/**
 * 모든 예외 필터 (500 에러 등)
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message =
            exception instanceof Error
                ? exception.message
                : 'Internal server error';

        // 에러 로깅
        this.logger.error(
            `[${request.method}] ${request.url} - ${status} - ${message}`,
            exception.stack,
        );

        // ApiResponseDto 형식으로 응답
        const errorResponse = ApiResponseDto.error(message, status);

        response.status(status).json(errorResponse);
    }
}
