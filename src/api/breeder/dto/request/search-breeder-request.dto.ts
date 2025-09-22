import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsNumber, Min, Max, IsString } from 'class-validator';
import { PetType, PetSize, FurLength, BreederLevel } from '../../../../common/enum/user.enum';

/**
 * 브리더 검색 정렬 기준
 */
export enum BreederSortBy {
    LATEST = 'latest',              // 최신 등록순
    FAVORITE = 'favorite',          // 찜 많은순
    REVIEW = 'review',              // 리뷰 많은순
    PRICE_ASC = 'price_asc',        // 가격 오름차순
    PRICE_DESC = 'price_desc',      // 가격 내림차순
}

export class SearchBreederRequestDto {
    /**
     * 반려동물 타입 (강아지/고양이)
     * @example "dog"
     */
    @ApiProperty({
        description: '반려동물 타입',
        enum: PetType,
        example: 'dog',
    })
    @IsEnum(PetType)
    petType: string;

    /**
     * 강아지 크기 필터 (소형/중형/대형)
     * @example "small"
     */
    @ApiPropertyOptional({
        description: '강아지 크기 (dog 타입일 때만)',
        enum: PetSize,
        example: 'small',
    })
    @IsOptional()
    @IsEnum(PetSize)
    dogSize?: string;

    /**
     * 고양이 털 길이 필터 (장모/단모)
     * @example "short"
     */
    @ApiPropertyOptional({
        description: '고양이 털 길이 (cat 타입일 때만)',
        enum: FurLength,
        example: 'short',
    })
    @IsOptional()
    @IsEnum(FurLength)
    catFurLength?: string;

    /**
     * 지역 필터 (광역시/도)
     * @example "경기도"
     */
    @ApiPropertyOptional({
        description: '지역 (광역시/도)',
        example: '경기도',
    })
    @IsOptional()
    @IsString()
    province?: string;

    /**
     * 지역 필터 (시/군/구)
     * @example "파주시"
     */
    @ApiPropertyOptional({
        description: '지역 (시/군/구)',
        example: '파주시',
    })
    @IsOptional()
    @IsString()
    city?: string;

    /**
     * 입양 가능 여부 필터
     * @example true
     */
    @ApiPropertyOptional({
        description: '입양 가능 여부',
        example: true,
    })
    @IsOptional()
    @Type(() => Boolean)
    isAdoptionAvailable?: boolean;

    /**
     * 브리더 레벨 필터
     * @example "new"
     */
    @ApiPropertyOptional({
        description: '브리더 레벨',
        enum: BreederLevel,
        example: 'new',
    })
    @IsOptional()
    @IsEnum(BreederLevel)
    breederLevel?: string;

    /**
     * 정렬 기준
     * @example "latest"
     */
    @ApiPropertyOptional({
        description: '정렬 기준',
        enum: BreederSortBy,
        default: 'latest',
        example: 'latest',
    })
    @IsOptional()
    @IsEnum(BreederSortBy)
    sortBy?: string = 'latest';

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
     * @example 20
     */
    @ApiPropertyOptional({
        description: '페이지당 항목 수',
        minimum: 1,
        maximum: 100,
        default: 20,
        example: 20,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(100)
    take?: number = 20;
}