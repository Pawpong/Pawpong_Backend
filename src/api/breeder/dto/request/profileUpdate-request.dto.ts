import { IsString, IsOptional, IsNumber, IsArray, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * 브리더 프로필 업데이트 요청 DTO
 * 브리더가 자신의 프로필 정보를 수정할 때 사용됩니다.
 */
export class ProfileUpdateRequestDto {
    /**
     * 브리더 소개 설명
     * @example "10년 경력의 전문 브리더로 건강한 강아지들을 분양하고 있습니다."
     */
    @ApiProperty({
        description: '브리더 소개 설명',
        example: '10년 경력의 전문 브리더로 건강한 강아지들을 분양하고 있습니다.',
        required: false,
    })
    @IsOptional()
    @IsString()
    description?: string;

    /**
     * 브리더 위치 (시/구)
     * @example "서울시 강남구"
     */
    @ApiProperty({
        description: '브리더 위치 (시/구)',
        example: '서울시 강남구',
        required: false,
    })
    @IsOptional()
    @IsString()
    location?: string;

    /**
     * 프로필 사진 URL 배열
     * @example ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"]
     */
    @ApiProperty({
        description: '프로필 사진 URL 배열',
        type: 'array',
        items: { type: 'string' },
        example: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
        required: false,
    })
    @IsOptional()
    @IsArray()
    profilePhotos?: string[];

    /**
     * 전문 분야 (특화 품종)
     * @example "골든리트리버, 래브라도"
     */
    @ApiProperty({
        description: '전문 분야 (특화 품종)',
        example: '골든리트리버, 래브라도',
        required: false,
    })
    @IsOptional()
    @IsString()
    specialization?: string;

    /**
     * 브리딩 경험 연수
     * @example 10
     */
    @ApiProperty({
        description: '브리딩 경험 연수',
        example: 10,
        minimum: 0,
        maximum: 50,
        required: false,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @Max(50)
    experienceYears?: number;

    /**
     * 연락처 전화번호
     * @example "010-1234-5678"
     */
    @ApiProperty({
        description: '연락처 전화번호',
        example: '010-1234-5678',
        required: false,
    })
    @IsOptional()
    @IsString()
    phoneNumber?: string;

    /**
     * 웹사이트 URL
     * @example "https://mybreeding.com"
     */
    @ApiProperty({
        description: '웹사이트 URL',
        example: 'https://mybreeding.com',
        required: false,
    })
    @IsOptional()
    @IsString()
    websiteUrl?: string;

    /**
     * 소셜 미디어 계정
     * @example { "instagram": "@mybreeding", "facebook": "MyBreedingFarm" }
     */
    @ApiProperty({
        description: '소셜 미디어 계정',
        type: 'object',
        additionalProperties: true,
        example: { instagram: '@mybreeding', facebook: 'MyBreedingFarm' },
    })
    @IsOptional()
    socialMediaAccounts?: Record<string, string>;
}
