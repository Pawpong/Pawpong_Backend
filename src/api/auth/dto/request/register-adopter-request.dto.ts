import { IsEmail, IsString, MinLength, IsOptional, IsBoolean, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
     * 닉네임 (2-10자, 한글/영문/숫자)
     * @example "행복한입양자"
     */
    @ApiProperty({
        description: '닉네임 (2-10자, 한글/영문/숫자)',
        example: '행복한입양자',
        minLength: 2,
        maxLength: 10,
    })
    @IsString()
    @MinLength(2, { message: '닉네임은 최소 2자 이상이어야 합니다.' })
    @MaxLength(10, { message: '닉네임은 최대 10자까지 가능합니다.' })
    @Matches(/^[a-zA-Z0-9가-힣]+$/, {
        message: '닉네임은 한글, 영문, 숫자만 사용 가능합니다.',
    })
    nickname: string;

    /**
     * 연락처 전화번호 (선택사항)
     * @example "01012345678"
     */
    @ApiPropertyOptional({
        description: '연락처 전화번호 (선택사항)',
        example: '01012345678',
    })
    @IsOptional()
    @IsString()
    phone?: string;

    /**
     * 마케팅 정보 수신 동의 (선택)
     * @example true
     */
    @ApiPropertyOptional({
        description: '마케팅 정보 수신 동의 (선택)',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    agreeMarketing?: boolean;
}
