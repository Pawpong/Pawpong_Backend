import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 입양자 회원가입 요청 DTO
 * 입양자가 플랫폼에 가입할 때 사용됩니다.
 */
export class RegisterAdopterRequestDto {
    /**
     * 입양자 이메일 주소 (로그인 ID로 사용)
     * @example "adopter@example.com"
     */
    @ApiProperty({
        description: '입양자 이메일 주소 (로그인 ID로 사용)',
        example: 'adopter@example.com',
        format: 'email',
    })
    @IsEmail()
    email: string;

    /**
     * 계정 비밀번호 (최소 6자 이상)
     * @example "securepassword123"
     */
    @ApiProperty({
        description: '계정 비밀번호 (최소 6자 이상)',
        example: 'securepassword123',
        minLength: 6,
    })
    @IsString()
    @MinLength(6)
    password: string;

    /**
     * 입양자 실명
     * @example "김철수"
     */
    @ApiProperty({
        description: '입양자 실명',
        example: '김철수',
    })
    @IsString()
    name: string;

    /**
     * 연락처 전화번호 (선택사항)
     * @example "010-1234-5678"
     */
    @ApiProperty({
        description: '연락처 전화번호 (선택사항)',
        example: '010-1234-5678',
        required: false,
    })
    @IsOptional()
    @IsString()
    phone?: string;
}
