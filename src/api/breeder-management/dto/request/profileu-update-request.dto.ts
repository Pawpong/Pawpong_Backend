import {
    IsString,
    IsArray,
    IsOptional,
    IsNumber,
    IsEnum,
    IsNotEmpty,
    MaxLength,
    ValidateNested,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PetType } from '../../../../common/enum/user.enum';

/**
 * 브리더 위치 정보 업데이트 DTO
 */
export class LocationUpdateDto {
    /**
     * 도시명
     * @example "서울"
     */
    @ApiProperty({
        description: '도시명',
        example: '서울',
    })
    @IsString()
    @IsNotEmpty()
    cityName: string;

    /**
     * 구/군명
     * @example "강남구"
     */
    @ApiProperty({
        description: '구/군명',
        example: '강남구',
    })
    @IsString()
    @IsNotEmpty()
    districtName: string;

    /**
     * 상세 주소 (선택사항)
     * @example "테헤란로 123번길"
     */
    @ApiProperty({
        description: '상세 주소',
        example: '테헤란로 123번길',
        required: false,
    })
    @IsString()
    @IsOptional()
    detailAddress?: string;
}

/**
 * 브리더 가격대 정보 업데이트 DTO
 */
export class PriceRangeUpdateDto {
    /**
     * 최소 가격 (원)
     * @example 500000
     */
    @ApiProperty({
        description: '최소 가격 (원)',
        example: 500000,
        minimum: 0,
    })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minimumPrice: number;

    /**
     * 최대 가격 (원)
     * @example 2000000
     */
    @ApiProperty({
        description: '최대 가격 (원)',
        example: 2000000,
        minimum: 0,
    })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maximumPrice: number;
}

/**
 * 브리더 프로필 수정 요청 DTO
 * 브리더가 자신의 프로필을 업데이트할 때 사용됩니다.
 */
export class ProfileUpdateRequestDto {
    /**
     * 브리더 소개 설명
     * @example "20년 경력의 전문 브리더입니다. 건강하고 성격 좋은 반려동물을 분양합니다."
     */
    @ApiProperty({
        description: '브리더 소개 설명',
        example: '20년 경력의 전문 브리더입니다. 건강하고 성격 좋은 반려동물을 분양합니다.',
        maxLength: 1000,
        required: false,
    })
    @IsString()
    @IsOptional()
    @MaxLength(1000)
    profileDescription?: string;

    /**
     * 위치 정보
     */
    @ApiProperty({
        description: '위치 정보',
        type: LocationUpdateDto,
        required: false,
    })
    @ValidateNested()
    @Type(() => LocationUpdateDto)
    @IsOptional()
    locationInfo?: LocationUpdateDto;

    /**
     * 브리더 사진 URL 배열
     * @example ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"]
     */
    @ApiProperty({
        description: '브리더 사진 URL 배열',
        example: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
        type: [String],
        required: false,
    })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    profilePhotos?: string[];

    /**
     * 분양 가격대 정보
     */
    @ApiProperty({
        description: '분양 가격대 정보',
        type: PriceRangeUpdateDto,
        required: false,
    })
    @ValidateNested()
    @Type(() => PriceRangeUpdateDto)
    @IsOptional()
    priceRangeInfo?: PriceRangeUpdateDto;

    /**
     * 전문 분야 (반려동물 종류)
     * @example ["dog", "cat"]
     */
    @ApiProperty({
        description: '전문 분야 (반려동물 종류)',
        example: ['dog', 'cat'],
        type: [String],
        enum: PetType,
        required: false,
    })
    @IsArray()
    @IsEnum(PetType, { each: true })
    @IsOptional()
    specializationTypes?: PetType[];

    /**
     * 경력 연수
     * @example 20
     */
    @ApiProperty({
        description: '경력 연수',
        example: 20,
        minimum: 0,
        required: false,
    })
    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    @Min(0)
    experienceYears?: number;
}
