import {
    IsEmail,
    IsString,
    MinLength,
    IsOptional,
    IsArray,
    IsEnum,
    IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 브리더 일반 회원가입 요청 DTO (이메일/비밀번호)
 */
export class RegisterBreederRequestDto {
    @ApiProperty({
        description: '이메일',
        example: 'breeder@example.com',
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        description: '비밀번호 (최소 6자)',
        example: 'password123!',
        minLength: 6,
    })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({
        description: '전화번호',
        example: '010-6545-6502',
    })
    @IsString()
    phone: string;

    @ApiProperty({
        description: '동물 종류',
        example: 'dog',
        enum: ['dog', 'cat'],
    })
    @IsEnum(['dog', 'cat'])
    petType: string;

    @ApiProperty({
        description: '요금제',
        example: 'basic',
        enum: ['basic', 'pro'],
    })
    @IsEnum(['basic', 'pro'])
    plan: string;

    @ApiProperty({
        description: '서비스 이용약관 동의 (필수)',
        example: true,
    })
    @IsBoolean()
    agreeTerms: boolean;

    @ApiProperty({
        description: '개인정보 처리방침 동의 (필수)',
        example: true,
    })
    @IsBoolean()
    agreePrivacy: boolean;

    @ApiProperty({
        description: '마케팅 정보 수신 동의 (선택)',
        example: true,
    })
    @IsBoolean()
    agreeMarketing: boolean;

    @ApiProperty({
        description: '브리더명(상호명)',
        example: '테스트 브리더',
    })
    @IsString()
    breederName: string;

    @ApiPropertyOptional({
        description: '소개',
        example: '안녕하세요',
    })
    @IsOptional()
    @IsString()
    introduction?: string;

    @ApiPropertyOptional({
        description: '시/도',
        example: '서울특별시',
    })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiPropertyOptional({
        description: '시/군/구',
        example: '강남구',
    })
    @IsOptional()
    @IsString()
    district?: string;

    @ApiPropertyOptional({
        description: '지역 (시/도 + 시/군/구 조합 형식)',
        example: '서울특별시 강남구',
    })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiProperty({
        description: '품종 목록 (최대 5개)',
        example: ['비숑프리제', '말티즈'],
        type: [String],
    })
    @IsArray()
    @IsString({ each: true })
    breeds: string[];

    @ApiProperty({
        description: '브리더 레벨',
        example: 'new',
        enum: ['new', 'elite'],
    })
    @IsEnum(['new', 'elite'])
    breederLevel: string;
}
