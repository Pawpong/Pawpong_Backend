import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 로그인 요청 DTO
 * 입양자와 브리더 공통 로그인 요청에 사용됩니다.
 */
export class LoginRequestDto {
    /**
     * 사용자 이메일 주소
     * @example "user@example.com"
     */
    @ApiProperty({
        description: '사용자 이메일 주소',
        example: 'user@example.com',
        format: 'email',
    })
    @IsEmail()
    email: string;

    /**
     * 사용자 비밀번호
     * @example "password123"
     */
    @ApiProperty({
        description: '사용자 비밀번호',
        example: 'password123',
        minLength: 6,
    })
    @IsString()
    password: string;
}
