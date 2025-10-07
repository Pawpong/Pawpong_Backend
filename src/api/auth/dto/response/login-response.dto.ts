import { ApiProperty } from '@nestjs/swagger';

/**
 * 로그인한 사용자 정보 DTO
 */
export class UserInfoDto {
    /**
     * 사용자 고유 ID
     * @example "507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '사용자 고유 ID',
        example: '507f1f77bcf86cd799439011',
    })
    userId: string;

    /**
     * 사용자 이메일 주소
     * @example "user@example.com"
     */
    @ApiProperty({
        description: '사용자 이메일 주소',
        example: 'user@example.com',
    })
    emailAddress: string;

    /**
     * 사용자 이름
     * @example "김철수"
     */
    @ApiProperty({
        description: '사용자 이름',
        example: '김철수',
    })
    nickname: string;

    /**
     * 사용자 역할 (adopter, breeder, admin)
     * @example "adopter"
     */
    @ApiProperty({
        description: '사용자 역할',
        example: 'adopter',
        enum: ['adopter', 'breeder', 'admin'],
    })
    userRole: string;

    /**
     * 계정 상태 (active, suspended, pending)
     * @example "active"
     */
    @ApiProperty({
        description: '계정 상태',
        example: 'active',
        enum: ['active', 'suspended', 'pending'],
        required: false,
    })
    accountStatus?: string;

    /**
     * 프로필 이미지 URL (선택사항)
     * @example "https://example.com/profile.jpg"
     */
    @ApiProperty({
        description: '프로필 이미지 URL',
        example: 'https://example.com/profile.jpg',
        required: false,
    })
    profileImageUrl?: string;
}

/**
 * 로그인 성공 응답 DTO
 * 성공적인 로그인 시 반환되는 데이터 구조입니다.
 */
export class LoginResponseDto {
    /**
     * JWT 액세스 토큰
     * API 인증에 사용됩니다.
     * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     */
    @ApiProperty({
        description: 'JWT 액세스 토큰',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    accessToken: string;

    /**
     * 로그인한 사용자 정보
     */
    @ApiProperty({
        description: '로그인한 사용자 정보',
        type: UserInfoDto,
    })
    userInfo: UserInfoDto;
}
