import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * 브리더 인증 신청 요청 DTO
 * 브리더가 플랫폼에서 인증을 받기 위해 신청할 때 사용됩니다.
 */
export class VerificationSubmitRequestDto {
    /**
     * 사업자 등록번호
     * @example "123-45-67890"
     */
    @ApiProperty({
        description: '사업자 등록번호',
        example: '123-45-67890',
    })
    @IsString()
    @IsNotEmpty()
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
    @IsNotEmpty()
    businessName: string;

    /**
     * 구독 플랜
     * @example "premium"
     */
    @ApiProperty({
        description: '구독 플랜',
        example: 'premium',
        enum: ['basic', 'premium', 'enterprise'],
    })
    @IsEnum(['basic', 'premium', 'enterprise'])
    plan: string;

    /**
     * 제출 서류 URL 배열
     * @example ["https://example.com/business_license.pdf", "https://example.com/facility_photo.jpg"]
     */
    @ApiProperty({
        description: '제출 서류 URL 배열',
        type: 'array',
        items: { type: 'string' },
        example: ['https://example.com/business_license.pdf', 'https://example.com/facility_photo.jpg'],
    })
    @IsArray()
    documents: string[];

    /**
     * 사업장 주소
     * @example "경기도 용인시 처인구 모현읍 능원리 123"
     */
    @ApiProperty({
        description: '사업장 주소',
        example: '경기도 용인시 처인구 모현읍 능원리 123',
    })
    @IsString()
    @IsNotEmpty()
    businessAddress: string;

    /**
     * 브리딩 경험 연수
     * @example "10년"
     */
    @ApiProperty({
        description: '브리딩 경험 연수',
        example: '10년',
    })
    @IsString()
    @IsNotEmpty()
    experienceYears: string;

    /**
     * 전문 품종
     * @example "골든리트리버, 래브라도, 푸들"
     */
    @ApiProperty({
        description: '전문 품종',
        example: '골든리트리버, 래브라도, 푸들',
    })
    @IsString()
    @IsNotEmpty()
    specialBreeds: string;

    /**
     * 시설 규모 및 환경 설명
     * @example "실내외 운동장 포함 200평 규모의 시설"
     */
    @ApiProperty({
        description: '시설 규모 및 환경 설명',
        example: '실내외 운동장 포함 200평 규모의 시설',
    })
    @IsString()
    @IsNotEmpty()
    facilityDescription: string;

    /**
     * 수의사 협력 정보
     * @example "용인 동물병원과 정기 건강검진 협약"
     */
    @ApiProperty({
        description: '수의사 협력 정보',
        example: '용인 동물병원과 정기 건강검진 협약',
        required: false,
    })
    @IsOptional()
    @IsString()
    veterinaryPartnership?: string;

    /**
     * 이메일로 신청서 제출 여부
     * @example false
     */
    @ApiProperty({
        description: '이메일로 신청서 제출 여부',
        example: false,
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => {
        if (typeof value === 'string') {
            return value === 'true';
        }
        return value;
    })
    submittedByEmail?: boolean;

    /**
     * 추가 메시지
     * @example "빠른 검토 부탁드립니다."
     */
    @ApiProperty({
        description: '추가 메시지',
        example: '빠른 검토 부탁드립니다.',
        required: false,
    })
    @IsOptional()
    @IsString()
    additionalMessage?: string;
}
