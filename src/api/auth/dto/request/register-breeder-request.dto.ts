import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 브리더 회원가입 요청 DTO
 * 브리더가 플랫폼에 가입할 때 사용됩니다.
 */
export class RegisterBreederRequestDto {
    /**
     * 브리더 이메일 주소 (로그인 ID로 사용)
     * @example "breeder@example.com"
     */
    @ApiProperty({
        description: '브리더 이메일 주소 (로그인 ID로 사용)',
        example: 'breeder@example.com',
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
     * 브리더 실명 또는 대표자명
     * @example "김브리더"
     */
    @ApiProperty({
        description: '브리더 실명 또는 대표자명',
        example: '김브리더',
    })
    @IsString()
    name: string;

    /**
     * 연락처 전화번호 (선택사항)
     * @example "010-9876-5432"
     */
    @ApiProperty({
        description: '연락처 전화번호 (선택사항)',
        example: '010-9876-5432',
        required: false,
    })
    @IsOptional()
    @IsString()
    phone?: string;

    /**
     * 사업자 등록번호 (선택사항)
     * @example "123-45-67890"
     */
    @ApiProperty({
        description: '사업자 등록번호 (선택사항)',
        example: '123-45-67890',
        required: false,
    })
    @IsOptional()
    @IsString()
    businessNumber?: string;

    /**
     * 사업체명 (선택사항)
     * @example "행복한 반려동물 농장"
     */
    @ApiProperty({
        description: '사업체명 (선택사항)',
        example: '행복한 반려동물 농장',
        required: false,
    })
    @IsOptional()
    @IsString()
    businessName?: string;
}
