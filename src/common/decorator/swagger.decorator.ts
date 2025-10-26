import { applyDecorators, Type } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth, ApiTags, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';

import { ApiResponseDto } from '../dto/response/api-response.dto';

/**
 * API 엔드포인트 스웨거 데코레이터
 * 공통 스웨거 설정을 한번에 적용하고, ApiResponseDto<T> 형식의 응답을 올바르게 표시합니다.
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
    ];

    // responseType이 있을 경우 ApiResponseDto<T> 형식으로 Swagger 스키마 생성
    if (options.responseType) {
        decorators.push(ApiExtraModels(ApiResponseDto, options.responseType));
        decorators.push(
            ApiResponse({
                status: 200,
                description: '성공',
                schema: {
                    allOf: [
                        { $ref: getSchemaPath(ApiResponseDto) },
                        {
                            properties: {
                                data: {
                                    $ref: getSchemaPath(options.responseType),
                                },
                            },
                        },
                    ],
                },
            }),
        );
    } else {
        decorators.push(
            ApiResponse({
                status: 200,
                description: '성공',
                type: ApiResponseDto,
            }),
        );
    }

    decorators.push(ApiResponse({ status: 400, description: '잘못된 요청' }));

    if (!options.isPublic) {
        decorators.push(ApiBearerAuth('JWT-Auth'));
        decorators.push(ApiResponse({ status: 401, description: '인증 실패' }));
    }

    return applyDecorators(...decorators);
}

/**
 * 페이지네이션 API 스웨거 데코레이터
 * ApiResponseDto<PaginationResponseDto<T>> 형식의 응답을 올바르게 표시합니다.
 */
export function ApiPaginatedEndpoint(options: {
    summary: string;
    description?: string;
    responseType: Type<any>;
    itemType?: Type<any>;
    isPublic?: boolean;
}) {
    const decorators = [
        ApiOperation({
            summary: options.summary,
            description: options.description || options.summary,
        }),
    ];

    // responseType이 있을 경우 ApiResponseDto<PaginationResponseDto<T>> 형식으로 Swagger 스키마 생성
    if (options.responseType) {
        decorators.push(ApiExtraModels(ApiResponseDto, options.responseType));
        decorators.push(
            ApiResponse({
                status: 200,
                description: '성공 (페이지네이션)',
                schema: {
                    allOf: [
                        { $ref: getSchemaPath(ApiResponseDto) },
                        {
                            properties: {
                                data: {
                                    type: 'object',
                                    properties: {
                                        items: {
                                            type: 'array',
                                            items: options.itemType
                                                ? { $ref: getSchemaPath(options.itemType) }
                                                : { type: 'object' },
                                        },
                                        pagination: {
                                            type: 'object',
                                            properties: {
                                                currentPage: { type: 'number', example: 1 },
                                                pageSize: { type: 'number', example: 10 },
                                                totalItems: { type: 'number', example: 100 },
                                                totalPages: { type: 'number', example: 10 },
                                                hasNextPage: { type: 'boolean', example: true },
                                                hasPrevPage: { type: 'boolean', example: false },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    ],
                },
            }),
        );
    }

    decorators.push(ApiResponse({ status: 400, description: '잘못된 요청' }));

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
