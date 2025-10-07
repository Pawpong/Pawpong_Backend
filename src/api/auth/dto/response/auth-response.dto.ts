import { ApiProperty } from '@nestjs/swagger';

/**
 * 인증된 사용자 정보 DTO
 */
export class AuthenticatedUserDto {
    /**
     * 사용자 고유 ID
     * @example "507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '사용자 고유 ID',
        example: '507f1f77bcf86cd799439011'
    })
    userId: string;

    /**
     * 사용자 이메일 주소
     * @example "user@example.com"
     */
    @ApiProperty({
        description: '사용자 이메일 주소',
        example: 'user@example.com'
    })
    emailAddress: string;

    /**
     * 사용자 닉네임
     * @example "행복한입양자"
     */
    @ApiProperty({
        description: '사용자 닉네임',
        example: '행복한입양자'
    })
    nickname: string;

    /**
     * 사용자 역할
     * @example "adopter"
     */
    @ApiProperty({
        description: '사용자 역할',
        example: 'adopter',
        enum: ['adopter', 'breeder', 'admin']
    })
    userRole: string;

    /**
     * 계정 상태
     * @example "active"
     */
    @ApiProperty({
        description: '계정 상태',
        example: 'active',
        enum: ['active', 'suspended', 'deactivated', 'pending']
    })
    accountStatus: string;

    /**
     * 프로필 이미지 URL (선택사항)
     * @example "https://example.com/profile.jpg"
     */
    @ApiProperty({
        description: '프로필 이미지 URL',
        example: 'https://example.com/profile.jpg',
        required: false
    })
    profileImageUrl?: string;
}

/**
 * 인증 응답 DTO
 * 로그인과 회원가입에서 공통으로 사용되는 응답 형식입니다.
 */
export class AuthResponseDto {
    /**
     * JWT 액세스 토큰
     * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     */
    @ApiProperty({
        description: 'JWT 액세스 토큰',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    })
    accessToken: string;

    /**
     * JWT 리프레시 토큰
     * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     */
    @ApiProperty({
        description: 'JWT 리프레시 토큰',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    })
    refreshToken: string;

    /**
     * 액세스 토큰 만료 시간 (초 단위)
     * @example 3600
     */
    @ApiProperty({
        description: '액세스 토큰 만료 시간 (초 단위)',
        example: 3600
    })
    accessTokenExpiresIn: number;

    /**
     * 리프레시 토큰 만료 시간 (초 단위)
     * @example 604800
     */
    @ApiProperty({
        description: '리프레시 토큰 만료 시간 (초 단위)',
        example: 604800
    })
    refreshTokenExpiresIn: number;

    /**
     * 인증된 사용자 정보
     */
    @ApiProperty({
        description: '인증된 사용자 정보',
        type: AuthenticatedUserDto
    })
    userInfo: AuthenticatedUserDto;

    /**
     * 인증 완료 메시지
     * @example "로그인이 완료되었습니다."
     */
    @ApiProperty({
        description: '인증 완료 메시지',
        example: '로그인이 완료되었습니다.'
    })
    message: string;
}