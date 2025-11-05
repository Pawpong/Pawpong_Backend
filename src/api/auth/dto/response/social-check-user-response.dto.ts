import { ApiProperty } from '@nestjs/swagger';

/**
 * 소셜 로그인 사용자 존재 여부 확인 응답 DTO
 */
export class SocialCheckUserResponseDto {
    /**
     * 사용자 존재 여부
     * @example true
     */
    @ApiProperty({
        description: '사용자 존재 여부',
        example: true,
    })
    exists: boolean;

    /**
     * 사용자 역할 (존재하는 경우)
     * @example "adopter"
     */
    @ApiProperty({
        description: '사용자 역할 (adopter, breeder)',
        example: 'adopter',
        required: false,
    })
    userRole?: string;

    /**
     * 사용자 ID (존재하는 경우)
     * @example "507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '사용자 고유 ID',
        example: '507f1f77bcf86cd799439011',
        required: false,
    })
    userId?: string;

    /**
     * 이메일 (존재하는 경우)
     * @example "user@example.com"
     */
    @ApiProperty({
        description: '사용자 이메일',
        example: 'user@example.com',
        required: false,
    })
    email?: string;

    /**
     * 닉네임 (존재하는 경우)
     * @example "멍멍이집사"
     */
    @ApiProperty({
        description: '사용자 닉네임',
        example: '멍멍이집사',
        required: false,
    })
    nickname?: string;

    /**
     * 프로필 이미지 파일명 (존재하는 경우)
     * @example "profile_123456789.jpg"
     */
    @ApiProperty({
        description: '프로필 이미지 파일명',
        example: 'profile_123456789.jpg',
        required: false,
    })
    profileImageFileName?: string;
}
