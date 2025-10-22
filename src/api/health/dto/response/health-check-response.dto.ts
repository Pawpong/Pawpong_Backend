import { ApiProperty } from '@nestjs/swagger';

/**
 * 시스템 헬스체크 응답 DTO
 * 시스템 상태 정보를 반환합니다.
 */
export class HealthCheckResponseDto {
    /**
     * 시스템 상태
     * @example "healthy"
     */
    @ApiProperty({
        description: '시스템 상태',
        example: 'healthy',
        enum: ['healthy', 'degraded', 'unhealthy'],
    })
    status: string;

    /**
     * 응답 시간
     * @example "2025-01-15T10:30:00.000Z"
     */
    @ApiProperty({
        description: '응답 시간',
        example: '2025-01-15T10:30:00.000Z',
        format: 'date-time',
    })
    timestamp: string;

    /**
     * 서비스 이름
     * @example "Pawpong Backend"
     */
    @ApiProperty({
        description: '서비스 이름',
        example: 'Pawpong Backend',
    })
    service: string;

    /**
     * 서비스 버전
     * @example "1.0.0-MVP"
     */
    @ApiProperty({
        description: '서비스 버전',
        example: '1.0.0-MVP',
    })
    version: string;

    /**
     * 실행 환경
     * @example "production"
     */
    @ApiProperty({
        description: '실행 환경',
        example: 'production',
        enum: ['development', 'staging', 'production'],
    })
    environment: string;

    /**
     * 서버 가동 시간 (초)
     * @example 3600
     */
    @ApiProperty({
        description: '서버 가동 시간 (초)',
        example: 3600,
    })
    uptime: number;
}
