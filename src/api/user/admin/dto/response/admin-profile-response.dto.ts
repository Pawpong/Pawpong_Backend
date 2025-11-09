import { ApiProperty } from '@nestjs/swagger';

/**
 * 관리자 프로필 조회 응답 DTO
 * 관리자의 프로필 정보를 반환합니다.
 */
export class AdminProfileResponseDto {
    /**
     * 관리자 사용자 ID
     * @example "507f1f77bcf86cd799439111"
     */
    @ApiProperty({
        description: '관리자 사용자 ID',
        example: '507f1f77bcf86cd799439111',
    })
    userId: string;

    /**
     * 이메일
     * @example "admin@pawpong.com"
     */
    @ApiProperty({
        description: '이메일',
        example: 'admin@pawpong.com',
    })
    email: string;

    /**
     * 이름
     * @example "관리자"
     */
    @ApiProperty({
        description: '이름',
        example: '관리자',
    })
    name: string;

    /**
     * 권한
     * @example "admin"
     */
    @ApiProperty({
        description: '권한',
        example: 'admin',
        enum: ['admin', 'super_admin'],
    })
    role: string;

    /**
     * 계정 상태
     * @example "active"
     */
    @ApiProperty({
        description: '계정 상태',
        example: 'active',
        enum: ['active', 'inactive', 'suspended'],
    })
    status: string;

    /**
     * 계정 생성일
     * @example "2024-01-01T00:00:00.000Z"
     */
    @ApiProperty({
        description: '계정 생성일',
        example: '2024-01-01T00:00:00.000Z',
        format: 'date-time',
    })
    createdAt: string;

    /**
     * 마지막 로그인 일시
     * @example "2024-01-15T10:30:00.000Z"
     */
    @ApiProperty({
        description: '마지막 로그인 일시',
        example: '2024-01-15T10:30:00.000Z',
        format: 'date-time',
        required: false,
    })
    lastLoginAt?: string;
}
