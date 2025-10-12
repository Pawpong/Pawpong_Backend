import { ApiProperty } from '@nestjs/swagger';

/**
 * 소셜 로그인 사용자 존재 여부 확인 응답 DTO
 */
export class CheckSocialUserResponseDto {
    /**
     * 사용자 존재 여부
     */
    @ApiProperty({
        description: '해당 소셜 계정으로 가입된 사용자 존재 여부',
        example: true,
    })
    exists: boolean;

    /**
     * 사용자 역할 (존재하는 경우)
     */
    @ApiProperty({
        description: '사용자 역할 (adopter 또는 breeder)',
        example: 'adopter',
        required: false,
        enum: ['adopter', 'breeder'],
    })
    userRole?: string;

    /**
     * 사용자 ID (존재하는 경우)
     */
    @ApiProperty({
        description: '사용자 고유 ID',
        example: '507f1f77bcf86cd799439011',
        required: false,
    })
    userId?: string;

    /**
     * 이메일 주소 (존재하는 경우)
     */
    @ApiProperty({
        description: '사용자 이메일 주소',
        example: 'user@example.com',
        required: false,
    })
    email?: string;

    /**
     * 닉네임 (존재하는 경우)
     */
    @ApiProperty({
        description: '사용자 닉네임',
        example: '행복한입양자',
        required: false,
    })
    nickname?: string;

    /**
     * 프로필 이미지 URL (존재하는 경우)
     */
    @ApiProperty({
        description: '프로필 이미지 URL',
        example: 'https://example.com/profile.jpg',
        required: false,
    })
    profileImageUrl?: string;
}
