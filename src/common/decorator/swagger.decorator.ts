import { applyDecorators, Type } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ApiResponseDto } from '../dto/response/api-response.dto';

/**
 * API 엔드포인트 스웨거 데코레이터
 * 공통 스웨거 설정을 한번에 적용합니다.
 */
export function ApiEndpoint(options: {
    summary: string;
    description?: string;
    responseType?: Type<any>;
    isPublic?: boolean;
}) {
    const decorators = [
        ApiOperation({
            summary: options.summary,
            description: options.description || options.summary,
        }),
        ApiResponse({
            status: 200,
            description: '성공',
            type: options.responseType ? ApiResponseDto : undefined,
        }),
        ApiResponse({ status: 400, description: '잘못된 요청' }),
    ];

    if (!options.isPublic) {
        decorators.push(ApiBearerAuth('JWT-Auth'));
        decorators.push(ApiResponse({ status: 401, description: '인증 실패' }));
    }

    return applyDecorators(...decorators);
}

/**
 * 페이지네이션 API 스웨거 데코레이터
 */
export function ApiPaginatedEndpoint(options: {
    summary: string;
    description?: string;
    responseType: Type<any>;
    isPublic?: boolean;
}) {
    const decorators = [
        ApiOperation({
            summary: options.summary,
            description: options.description || options.summary,
        }),
        ApiResponse({
            status: 200,
            description: '성공 (페이지네이션)',
            type: options.responseType,
        }),
        ApiResponse({ status: 400, description: '잘못된 요청' }),
    ];

    if (!options.isPublic) {
        decorators.push(ApiBearerAuth('JWT-Auth'));
        decorators.push(ApiResponse({ status: 401, description: '인증 실패' }));
    }

    return applyDecorators(...decorators);
}

/**
 * 컨트롤러 스웨거 데코레이터
 */
export function ApiController(tagName: string) {
    return applyDecorators(ApiTags(tagName), ApiBearerAuth('JWT-Auth'));
}
