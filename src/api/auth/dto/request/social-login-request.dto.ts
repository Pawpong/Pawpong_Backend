import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, MinLength, MaxLength, Matches } from 'class-validator';

import { UserRole } from '../../../../common/enum/user.enum';

export class CompleteSocialRegistrationDto {
    @ApiProperty({
        description: '임시 사용자 ID (소셜 로그인 콜백에서 받은 tempId)',
        example: 'temp_kakao_4479198661_1759826027884',
    })
    @IsString()
    tempId: string;

    @ApiProperty({
        description: '이메일 (프론트엔드 URL 파라미터에서 전달받은 값)',
        example: 'sc4cafe@naver.com',
    })
    @IsString()
    email: string;

    @ApiProperty({
        description: '이름 (프론트엔드 URL 파라미터에서 전달받은 값)',
        example: '김승찬',
    })
    @IsString()
    name: string;

    @ApiProperty({
        description: '사용자 역할 (입양자/브리더)',
        enum: UserRole,
        example: UserRole.ADOPTER,
    })
    @IsEnum(UserRole)
    role: UserRole;

    @ApiPropertyOptional({
        description: '닉네임 (2-10자, 한글/영문/숫자) - 입양자만 필수',
        example: '행복한입양자',
        minLength: 2,
        maxLength: 10,
    })
    @IsOptional()
    @IsString()
    @MinLength(2, { message: '닉네임은 최소 2자 이상이어야 합니다.' })
    @MaxLength(10, { message: '닉네임은 최대 10자까지 가능합니다.' })
    @Matches(/^[a-zA-Z0-9가-힣]+$/, {
        message: '닉네임은 한글, 영문, 숫자만 사용 가능합니다.',
    })
    nickname?: string;

    @ApiPropertyOptional({
        description: '전화번호 (선택)',
        example: '010-1234-5678',
    })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({
        description: '반려동물 타입 (브리더만)',
        enum: ['dog', 'cat'],
        example: 'dog',
    })
    @IsOptional()
    @IsString()
    petType?: string;

    @ApiPropertyOptional({
        description: '브리더 플랜 (브리더만)',
        enum: ['basic', 'premium'],
        example: 'basic',
    })
    @IsOptional()
    @IsString()
    plan?: string;

    // 브리더 추가 정보
    @ApiPropertyOptional({
        description: '브리더명(상호명)',
        example: '행복한 브리더',
    })
    @IsOptional()
    @IsString()
    breederName?: string;

    @ApiPropertyOptional({
        description: '브리더 소개',
        example: '건강한 반려동물을 분양하는 브리더입니다.',
    })
    @IsOptional()
    @IsString()
    introduction?: string;

    @ApiPropertyOptional({
        description: '지역 (시/군/구)',
        example: '강남구',
    })
    @IsOptional()
    @IsString()
    district?: string;

    @ApiPropertyOptional({
        description: '전문 품종 배열 (최대 5개)',
        type: [String],
        example: ['골든리트리버', '래브라도리트리버'],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    breeds?: string[];

    @ApiPropertyOptional({
        description: '브리더 레벨',
        enum: ['new', 'elite'],
        example: 'new',
    })
    @IsOptional()
    @IsString()
    level?: string;

    @ApiPropertyOptional({
        description: '마케팅 정보 수신 동의 여부',
        example: true,
    })
    @IsOptional()
    marketingAgreed?: boolean;
}
