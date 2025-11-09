import { ApiProperty } from '@nestjs/swagger';

/**
 * 관리자 권한 응답 DTO
 */
export class AdminPermissionsDto {
    @ApiProperty({ description: '사용자 관리 권한' })
    canManageUsers: boolean;

    @ApiProperty({ description: '브리더 관리 권한' })
    canManageBreeders: boolean;

    @ApiProperty({ description: '신고 처리 권한' })
    canManageReports: boolean;

    @ApiProperty({ description: '통계 조회 권한' })
    canViewStatistics: boolean;

    @ApiProperty({ description: '관리자 관리 권한' })
    canManageAdmins: boolean;
}

/**
 * 관리자 로그인 응답 DTO
 */
export class AdminLoginResponseDto {
    /**
     * 관리자 고유 ID
     * @example "507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '관리자 고유 ID',
        example: '507f1f77bcf86cd799439011',
    })
    adminId: string;

    /**
     * 관리자 이메일 주소
     * @example "admin@pawpong.com"
     */
    @ApiProperty({
        description: '관리자 이메일 주소',
        example: 'admin@pawpong.com',
    })
    email: string;

    /**
     * 관리자 이름
     * @example "김관리자"
     */
    @ApiProperty({
        description: '관리자 이름',
        example: '김관리자',
    })
    name: string;

    /**
     * 관리자 등급
     * @example "super_admin"
     */
    @ApiProperty({
        description: '관리자 등급',
        example: 'super_admin',
        enum: ['super_admin', 'breeder_admin', 'report_admin', 'stats_admin'],
    })
    adminLevel: string;

    /**
     * 관리자 권한
     */
    @ApiProperty({
        description: '관리자 권한',
        type: AdminPermissionsDto,
    })
    permissions: AdminPermissionsDto;

    /**
     * JWT Access Token
     * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     */
    @ApiProperty({
        description: 'JWT Access Token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    accessToken: string;

    /**
     * JWT Refresh Token
     * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     */
    @ApiProperty({
        description: 'JWT Refresh Token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    refreshToken: string;
}
