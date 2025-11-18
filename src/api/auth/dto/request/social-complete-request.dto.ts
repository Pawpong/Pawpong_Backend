import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty, IsEnum, IsOptional, IsBoolean, IsArray } from 'class-validator';

/**
 * 소셜 로그인 회원가입 완료 요청 DTO
 *
 * 프론트엔드에서 역할(role)에 따라 입양자 또는 브리더 회원가입을 처리합니다.
 */
export class SocialCompleteRequestDto {
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
     * 소셜 로그인 제공자 (소셜 로그인용)
     * @example "naver"
     */
    @ApiProperty({
        description: '소셜 로그인 제공자',
        enum: ['kakao', 'naver', 'google'],
        example: 'naver',
        required: false,
    })
    @IsEnum(['kakao', 'naver', 'google'])
    @IsOptional()
    provider?: string;

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
     * 이름
     * @example "홍길동"
     */
    @ApiProperty({
        description: '이름',
        example: '홍길동',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    /**
     * 사용자 역할
     * @example "adopter"
     */
    @ApiProperty({
        description: '사용자 역할 (입양자 또는 브리더)',
        enum: ['adopter', 'breeder'],
        example: 'adopter',
    })
    @IsEnum(['adopter', 'breeder'])
    @IsNotEmpty()
    role: 'adopter' | 'breeder';

    /**
     * 전화번호
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
     * 마케팅 수신 동의
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

    // ===== 입양자 전용 필드 =====

    /**
     * 닉네임 (입양자 전용)
     * @example "펫러버"
     */
    @ApiProperty({
        description: '닉네임 (입양자 전용)',
        example: '펫러버',
        required: false,
    })
    @IsString()
    @IsOptional()
    nickname?: string;

    // ===== 브리더 전용 필드 =====

    /**
     * 브리딩 동물 종류 (브리더 전용)
     * @example "cat"
     */
    @ApiProperty({
        description: '브리딩 동물 종류 (브리더 전용)',
        enum: ['cat', 'dog'],
        example: 'cat',
        required: false,
    })
    @IsEnum(['cat', 'dog'])
    @IsOptional()
    petType?: string;

    /**
     * 플랜 유형 (브리더 전용)
     * @example "basic"
     */
    @ApiProperty({
        description: '플랜 유형 (브리더 전용)',
        enum: ['basic', 'pro'],
        example: 'basic',
        required: false,
    })
    @IsEnum(['basic', 'pro'])
    @IsOptional()
    plan?: string;

    /**
     * 브리더명 (브리더 전용)
     * @example "포포 캐터리"
     */
    @ApiProperty({
        description: '브리더명 (브리더 전용)',
        example: '포포 캐터리',
        required: false,
    })
    @IsString()
    @IsOptional()
    breederName?: string;

    /**
     * 소개글 (브리더 전용)
     * @example "건강한 고양이를 분양합니다."
     */
    @ApiProperty({
        description: '소개글 (브리더 전용)',
        example: '건강한 고양이를 분양합니다.',
        required: false,
    })
    @IsString()
    @IsOptional()
    introduction?: string;

    /**
     * 시/도 (브리더 전용)
     * @example "서울특별시"
     */
    @ApiProperty({
        description: '시/도 (브리더 전용)',
        example: '서울특별시',
        required: false,
    })
    @IsString()
    @IsOptional()
    city?: string;

    /**
     * 시/군/구 (브리더 전용)
     * @example "강남구"
     */
    @ApiProperty({
        description: '시/군/구 (브리더 전용)',
        example: '강남구',
        required: false,
    })
    @IsString()
    @IsOptional()
    district?: string;

    /**
     * 브리딩 품종 목록 (브리더 전용)
     * @example ["페르시안", "샴"]
     */
    @ApiProperty({
        description: '브리딩 품종 목록 (브리더 전용)',
        example: ['페르시안', '샴'],
        type: [String],
        required: false,
    })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    breeds?: string[];

    /**
     * 브리더 레벨 (브리더 전용)
     * @example "new"
     */
    @ApiProperty({
        description: '브리더 레벨 (브리더 전용)',
        enum: ['elite', 'new'],
        example: 'new',
        required: false,
    })
    @IsEnum(['elite', 'new'])
    @IsOptional()
    level?: string;
}
