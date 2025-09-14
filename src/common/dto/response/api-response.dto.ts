import { ApiProperty } from '@nestjs/swagger';

/**
 * 전역 API 응답 표준 DTO
 * 모든 API 응답은 이 형식을 따릅니다.
 */
export class ApiResponseDto<T = any> {
    /**
     * 요청 성공 여부
     * @example true
     */
    @ApiProperty({ description: '요청 성공 여부', example: true })
    success: boolean;

    /**
     * 응답 코드
     * HTTP 상태 코드와 동일하거나 비즈니스 로직별 커스텀 코드
     * @example 200
     */
    @ApiProperty({ description: '응답 코드', example: 200 })
    code: number;

    /**
     * 응답 데이터 (성공 시)
     */
    @ApiProperty({ description: '응답 데이터', required: false })
    item?: T;

    /**
     * 성공 메시지 (선택사항)
     * @example "데이터 조회가 완료되었습니다."
     */
    @ApiProperty({ description: '성공 메시지', required: false, example: '데이터 조회가 완료되었습니다.' })
    message?: string;

    /**
     * 에러 메시지 (실패 시)
     * @example "잘못된 요청입니다."
     */
    @ApiProperty({ description: '에러 메시지', required: false, example: '잘못된 요청입니다.' })
    error?: string;

    /**
     * 요청 처리 타임스탬프
     * @example "2024-01-15T10:30:00.000Z"
     */
    @ApiProperty({ description: '응답 타임스탬프', example: '2024-01-15T10:30:00.000Z' })
    timestamp: string;

    constructor(success: boolean, code: number, item?: T, message?: string, error?: string) {
        this.success = success;
        this.code = code;
        this.item = item;
        this.message = message;
        this.error = error;
        this.timestamp = new Date().toISOString();
    }

    /**
     * 성공 응답 생성 헬퍼 메서드
     */
    static success<T>(item?: T, message?: string, code: number = 200): ApiResponseDto<T> {
        return new ApiResponseDto(true, code, item, message);
    }

    /**
     * 실패 응답 생성 헬퍼 메서드
     */
    static error(error: string, code: number = 400): ApiResponseDto {
        return new ApiResponseDto(false, code, undefined, undefined, error);
    }
}
