import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

/**
 * 입양자 회원가입 요청 DTO
 */
export class RegisterAdopterRequestDto {
    /**
     * 임시 사용자 ID (소셜 로그인용)
     * @example "temp_kakao_4479198661_1759826027884"
     */
    @ApiProperty({
        description: '임시 사용자 ID (소셜 로그인 인증 후 발급)',
        example: 'temp_kakao_4479198661_1759826027884',
    })
    @IsString()
    @IsNotEmpty()
    tempId: string;

    /**
     * 이메일 주소
     * @example "user@example.com"
     */
    @ApiProperty({
        description: '이메일 주소',
        example: 'user@example.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    /**
     * 닉네임
     * @example "펫러버"
     */
    @ApiProperty({
        description: '닉네임',
        example: '펫러버',
    })
    @IsString()
    @IsNotEmpty()
    nickname: string;

    /**
     * 전화번호 (선택)
     * @example "010-1234-5678"
     */
    @ApiProperty({
        description: '전화번호',
        example: '010-1234-5678',
        required: false,
    })
    @IsString()
    @IsOptional()
    phone?: string;

    /**
     * 프로필 이미지 URL (선택)
     * @example "https://cdn.pawpong.com/profiles/uuid.jpg"
     */
    @ApiProperty({
        description: '프로필 이미지 URL',
        example: 'https://cdn.pawpong.com/profiles/uuid.jpg',
        required: false,
    })
    @IsString()
    @IsOptional()
    profileImage?: string;

    /**
     * 마케팅 수신 동의 (선택)
     * @example true
     */
    @ApiProperty({
        description: '마케팅 수신 동의 여부',
        example: true,
        required: false,
    })
    @IsBoolean()
    @IsOptional()
    marketingAgreed?: boolean;
}
