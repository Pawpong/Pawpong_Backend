import { ApiProperty } from '@nestjs/swagger';

/**
 * 사용자 관리 정보 응답 DTO
 * 관리자가 조회하는 사용자 정보를 제공합니다.
 */
export class UserManagementResponseDto {
    /**
     * 사용자 고유 ID
     * @example "507f1f77bcf86cd799439022"
     */
    @ApiProperty({
        description: '사용자 고유 ID',
        example: '507f1f77bcf86cd799439022',
    })
    userId: string;

    /**
     * 사용자 실명
     * @example "박입양자"
     */
    @ApiProperty({
        description: '사용자 실명',
        example: '박입양자',
    })
    userName: string;

    /**
     * 사용자 이메일
     * @example "adopter@example.com"
     */
    @ApiProperty({
        description: '사용자 이메일',
        example: 'adopter@example.com',
    })
    emailAddress: string;

    /**
     * 사용자 역할 (입양자/브리더)
     * @example "adopter"
     */
    @ApiProperty({
        description: '사용자 역할',
        example: 'adopter',
        enum: ['adopter', 'breeder'],
    })
    userRole: string;

    /**
     * 계정 상태
     * @example "active"
     */
    @ApiProperty({
        description: '계정 상태',
        example: 'active',
        enum: ['active', 'suspended', 'deactivated'],
    })
    accountStatus: string;

    /**
     * 최근 로그인 일시
     * @example "2024-01-15T14:20:00.000Z"
     */
    @ApiProperty({
        description: '최근 로그인 일시',
        example: '2024-01-15T14:20:00.000Z',
        format: 'date-time',
    })
    lastLoginAt: Date;

    /**
     * 계정 생성 일시
     * @example "2024-01-01T12:00:00.000Z"
     */
    @ApiProperty({
        description: '계정 생성 일시',
        example: '2024-01-01T12:00:00.000Z',
        format: 'date-time',
    })
    createdAt: Date;

    /**
     * 사용자 통계 정보 (선택사항)
     */
    @ApiProperty({
        description: '사용자 통계 정보',
        required: false,
    })
    statisticsInfo?: any;
}
