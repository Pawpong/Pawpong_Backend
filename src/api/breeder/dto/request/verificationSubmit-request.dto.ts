import { IsEnum, IsArray, IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { BreederPlan } from '../../../../common/enum/user.enum';

/**
 * 브리더 인증 신청 요청 DTO
 * 브리더가 자신의 인증을 신청할 때 사용됩니다.
 */
export class VerificationSubmitRequestDto {
    /**
     * 사업자등록번호
     * @example "123-45-67890"
     */
    @ApiProperty({
        description: '사업자등록번호',
        example: '123-45-67890',
    })
    @IsString()
    businessNumber: string;

    /**
     * 사업체명
     * @example "행복한 강아지 농장"
     */
    @ApiProperty({
        description: '사업체명',
        example: '행복한 강아지 농장',
    })
    @IsString()
    businessName: string;

    /**
     * 구독할 플랜 유형
     * @example "premium"
     */
    @ApiProperty({
        description: '구독할 플랜 유형',
        example: 'premium',
        enum: BreederPlan,
    })
    @IsEnum(BreederPlan)
    plan: BreederPlan;

    /**
     * 제출 서류 URL 배열
     * @example ["https://example.com/business_license.pdf", "https://example.com/facility_photo.jpg"]
     */
    @ApiProperty({
        description: '제출 서류 URL 배열',
        example: ['https://example.com/business_license.pdf', 'https://example.com/facility_photo.jpg'],
        type: [String],
        required: false,
    })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    documents?: string[];

    /**
     * 이메일로 추가 서류 제출 여부 (선택사항)
     * @example false
     */
    @ApiProperty({
        description: '이메일로 추가 서류 제출 여부',
        example: false,
        required: false,
    })
    @IsBoolean()
    @IsOptional()
    submittedByEmail?: boolean;
}
