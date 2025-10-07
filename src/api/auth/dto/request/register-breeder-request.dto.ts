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
 * 브리더 회원가입 요청 DTO
 */
export class RegisterBreederRequestDto {
    @ApiProperty({
        description: 'OAuth 임시 ID (소셜 로그인 시)',
        example: 'temp_kakao_4479198661_1759597226564',
    })
    @IsString()
    tempId: string;

    @ApiProperty({
        description: 'OAuth 제공자',
        example: 'kakao',
        enum: ['kakao', 'naver', 'google'],
    })
    @IsEnum(['kakao', 'naver', 'google'])
    provider: string;

    @ApiProperty({
        description: '이메일',
        example: 'kakao_4479198661@temp.pawpong.com',
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        description: '이름',
        example: '비만쯔+거북이',
    })
    @IsString()
    name: string;

    @ApiPropertyOptional({
        description: '프로필 이미지 URL',
        example: 'https://storage.googleapis.com/pawpong-bucket/profiles/...',
    })
    @IsOptional()
    @IsString()
    profileImage?: string;

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
        enum: ['basic', 'standard', 'premium'],
    })
    @IsEnum(['basic', 'standard', 'premium'])
    plan: string;

    @ApiProperty({
        description: '마케팅 수신 동의',
        example: true,
    })
    @IsBoolean()
    marketingAgreed: boolean;

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

    @ApiProperty({
        description: '시/도',
        example: '서울특별시',
    })
    @IsString()
    city: string;

    @ApiProperty({
        description: '시/군/구',
        example: '강남구',
    })
    @IsString()
    district: string;

    @ApiProperty({
        description: '품종 목록 (최대 5개)',
        example: ['비숑프리제', '말티즈'],
        type: [String],
    })
    @IsArray()
    @IsString({ each: true })
    breeds: string[];

    @ApiPropertyOptional({
        description: '브리더 프로필 사진 URL',
        example: 'https://storage.googleapis.com/pawpong-bucket/profiles/...',
    })
    @IsOptional()
    @IsString()
    breederProfilePhoto?: string;

    @ApiProperty({
        description: '브리더 레벨',
        example: 'level1',
        enum: ['level1', 'level2', 'level3'],
    })
    @IsEnum(['level1', 'level2', 'level3'])
    breederLevel: string;
}
