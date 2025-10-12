import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';

/**
 * 소셜 로그인 사용자 존재 여부 확인 요청 DTO
 */
export class CheckSocialUserRequestDto {
    /**
     * 소셜 로그인 제공자
     */
    @ApiProperty({
        description: '소셜 로그인 제공자',
        enum: ['google', 'kakao', 'naver'],
        example: 'kakao',
    })
    @IsEnum(['google', 'kakao', 'naver'])
    @IsNotEmpty()
    provider: string;

    /**
     * 소셜 로그인 제공자의 사용자 ID
     */
    @ApiProperty({
        description: '소셜 로그인 제공자의 사용자 ID',
        example: '1234567890',
    })
    @IsString()
    @IsNotEmpty()
    providerId: string;

    /**
     * 이메일 (선택사항, 추가 검증용)
     */
    @ApiProperty({
        description: '이메일 주소 (선택사항)',
        example: 'user@example.com',
        required: false,
    })
    @IsEmail()
    email?: string;
}
