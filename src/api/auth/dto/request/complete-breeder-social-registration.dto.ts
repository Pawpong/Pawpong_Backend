import { IsString, IsEnum, IsArray, IsBoolean, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 브리더 소셜 로그인 회원가입 완성 요청 DTO
 * tempId를 받아서 브리더 전용 정보와 함께 회원가입을 완료합니다.
 */
export class CompleteBreederSocialRegistrationDto {
    /**
     * 임시 사용자 ID (소셜 로그인 콜백에서 발급)
     */
    @ApiProperty({
        description: '임시 사용자 ID',
        example: 'temp_kakao_123456789_1234567890',
    })
    @IsString()
    tempId: string;

    /**
     * 이메일 (소셜 로그인에서 받지 못한 경우 입력)
     */
    @ApiPropertyOptional({
        description: '이메일 주소',
        example: 'breeder@example.com',
    })
    @IsOptional()
    @IsString()
    email?: string;

    /**
     * 닉네임
     */
    @ApiProperty({
        description: '닉네임 (2-20자)',
        example: '테스트브리더',
        minLength: 2,
        maxLength: 20,
    })
    @IsString()
    @MinLength(2)
    nickname: string;

    /**
     * 전화번호
     */
    @ApiProperty({
        description: '전화번호',
        example: '010-1234-5678',
    })
    @IsString()
    phone: string;

    /**
     * 브리더명 (업체명 또는 상호명)
     */
    @ApiProperty({
        description: '브리더명 (업체명 또는 상호명)',
        example: '행복한 강아지 농장',
    })
    @IsString()
    breederName: string;

    /**
     * 사업자등록번호 (선택사항)
     */
    @ApiPropertyOptional({
        description: '사업자등록번호 (하이픈 포함 가능)',
        example: '123-45-67890',
    })
    @IsOptional()
    @IsString()
    businessNumber?: string;

    /**
     * 반려동물 타입 (강아지/고양이)
     */
    @ApiProperty({
        description: '반려동물 타입',
        example: 'dog',
        enum: ['dog', 'cat'],
    })
    @IsEnum(['dog', 'cat'])
    petType: string;

    /**
     * 세부 품종 목록 (최대 5개)
     */
    @ApiProperty({
        description: '세부 품종 목록 (최대 5개)',
        example: ['골든 리트리버', '래브라도'],
        type: [String],
    })
    @IsArray()
    @IsString({ each: true })
    breeds: string[];

    /**
     * 지역 정보 (시/도)
     */
    @ApiProperty({
        description: '지역 (시/도)',
        example: '서울특별시',
    })
    @IsString()
    city: string;

    /**
     * 지역 정보 (시/군/구)
     */
    @ApiProperty({
        description: '지역 (시/군/구)',
        example: '강남구',
    })
    @IsString()
    district: string;

    /**
     * 간단한 소개 (선택사항)
     */
    @ApiPropertyOptional({
        description: '간단한 소개',
        example: '20년 경력의 전문 브리더입니다.',
    })
    @IsOptional()
    @IsString()
    introduction?: string;

    /**
     * 브리더 플랜 선택
     */
    @ApiProperty({
        description: '브리더 플랜',
        example: 'basic',
        enum: ['basic', 'pro'],
    })
    @IsEnum(['basic', 'pro'])
    plan: string;

    /**
     * 브리더 레벨
     */
    @ApiProperty({
        description: '브리더 레벨',
        example: 'new',
        enum: ['new', 'elite'],
    })
    @IsEnum(['new', 'elite'])
    breederLevel: string;

    /**
     * 서비스 이용약관 동의 (필수)
     */
    @ApiProperty({
        description: '서비스 이용약관 동의',
        example: true,
    })
    @IsBoolean()
    agreeTerms: boolean;

    /**
     * 개인정보 처리방침 동의 (필수)
     */
    @ApiProperty({
        description: '개인정보 처리방침 동의',
        example: true,
    })
    @IsBoolean()
    agreePrivacy: boolean;

    /**
     * 마케팅 정보 수신 동의 (선택)
     */
    @ApiProperty({
        description: '마케팅 정보 수신 동의',
        example: false,
    })
    @IsBoolean()
    agreeMarketing: boolean;
}
