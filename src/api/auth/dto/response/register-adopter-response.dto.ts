import { ApiProperty } from '@nestjs/swagger';

/**
 * 입양자 회원가입 응답 DTO
 */
export class RegisterAdopterResponseDto {
    @ApiProperty({
        description: '입양자 고유 ID',
        example: '507f1f77bcf86cd799439011',
    })
    adopterId: string;

    @ApiProperty({
        description: '이메일',
        example: 'user@example.com',
    })
    email: string;

    @ApiProperty({
        description: '닉네임',
        example: '펫러버',
    })
    nickname: string;

    @ApiProperty({
        description: '전화번호',
        example: '010-1234-5678',
    })
    phoneNumber: string;

    @ApiProperty({
        description: '프로필 이미지 URL',
        example: 'https://cdn.pawpong.com/profiles/uuid.jpg',
    })
    profileImage: string;

    @ApiProperty({
        description: '사용자 역할',
        example: 'adopter',
    })
    userRole: string;

    @ApiProperty({
        description: '계정 상태',
        example: 'active',
    })
    accountStatus: string;

    @ApiProperty({
        description: '생성일시',
        example: '2025-10-23T01:00:00.000Z',
    })
    createdAt: string;

    @ApiProperty({
        description: 'Access 토큰',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    accessToken: string;

    @ApiProperty({
        description: 'Refresh 토큰',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    refreshToken: string;
}
