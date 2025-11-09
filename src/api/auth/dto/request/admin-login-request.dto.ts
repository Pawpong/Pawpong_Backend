import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 관리자 로그인 요청 DTO
 */
export class AdminLoginRequestDto {
    /**
     * 관리자 이메일 주소
     * @example "admin@pawpong.com"
     */
    @ApiProperty({
        description: '관리자 이메일 주소',
        example: 'admin@pawpong.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    /**
     * 관리자 비밀번호
     * @example "admin1234"
     */
    @ApiProperty({
        description: '관리자 비밀번호',
        example: 'admin1234',
    })
    @IsString()
    @IsNotEmpty()
    password: string;
}
