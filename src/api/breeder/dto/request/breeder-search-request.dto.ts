import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsNumber, Min, Max, IsString, IsBoolean } from 'class-validator';

import { PetType } from '../../../../common/enum/user.enum';

/**
 * 브리더 검색 정렬 기준 (레거시 API용)
 */
export enum SortCriteria {
    RATING = 'rating', // 평점순
    REVIEWS = 'reviews', // 리뷰 많은순
    LATEST = 'latest', // 최신 등록순
    PRICE_LOW = 'price_low', // 가격 낮은순
    PRICE_HIGH = 'price_high', // 가격 높은순
}

/**
 * 브리더 검색 요청 DTO (레거시 API용)
 * GET /api/breeder/search에서 사용됩니다.
 */
export class BreederSearchRequestDto {
    /**
     * 반려동물 타입 (강아지/고양이)
     * @example "dog"
     */
    @ApiPropertyOptional({
        description: '반려동물 타입',
        enum: PetType,
        example: 'dog',
    })
    @IsOptional()
    @IsEnum(PetType)
    petType?: string;

    /**
     * 품종 이름
     * @example "골든리트리버"
     */
    @ApiPropertyOptional({
        description: '품종 이름',
        example: '골든리트리버',
    })
    @IsOptional()
    @IsString()
    breedName?: string;

    /**
     * 도시명
     * @example "서울"
     */
    @ApiPropertyOptional({
        description: '도시명',
        example: '서울',
    })
    @IsOptional()
    @IsString()
    cityName?: string;

    /**
     * 구/군명
     * @example "강남구"
     */
    @ApiPropertyOptional({
        description: '구/군명',
        example: '강남구',
    })
    @IsOptional()
    @IsString()
    districtName?: string;

    /**
     * 즉시 분양 가능 여부
     * @example true
     */
    @ApiPropertyOptional({
        description: '즉시 분양 가능 여부',
        example: true,
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isImmediatelyAvailable?: boolean;

    /**
     * 최소 가격 (원)
     * @example 500000
     */
    @ApiPropertyOptional({
        description: '최소 가격 (원)',
        example: 500000,
        minimum: 0,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minPrice?: number;

    /**
     * 최대 가격 (원)
     * @example 2000000
     */
    @ApiPropertyOptional({
        description: '최대 가격 (원)',
        example: 2000000,
        minimum: 0,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxPrice?: number;

    /**
     * 페이지 번호
     * @example 1
     */
    @ApiPropertyOptional({
        description: '페이지 번호',
        minimum: 1,
        default: 1,
        example: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    /**
     * 페이지당 항목 수
     * @example 10
     */
    @ApiPropertyOptional({
        description: '페이지당 항목 수',
        minimum: 1,
        maximum: 50,
        default: 10,
        example: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(50)
    take?: number = 10;

    /**
     * 정렬 기준
     * @example "rating"
     */
    @ApiPropertyOptional({
        description: '정렬 기준',
        enum: SortCriteria,
        default: 'rating',
        example: 'rating',
    })
    @IsOptional()
    @IsEnum(SortCriteria)
    sortCriteria?: string = 'rating';
}
