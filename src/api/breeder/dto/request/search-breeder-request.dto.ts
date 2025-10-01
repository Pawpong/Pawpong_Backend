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
     * 강아지 크기 필터 (소형/중형/대형) - 중복 선택 가능
     * @example ["small", "medium"]
     */
    @ApiPropertyOptional({
        description: '강아지 크기 필터 (dog 타입일 때만)',
        enum: PetSize,
        isArray: true,
        example: ['large'],
    })
    @IsOptional()
    @IsEnum(PetSize, { each: true })
    @Type(() => String)
    dogSize?: string[];

    /**
     * 고양이 털 길이 필터 (장모/단모) - 중복 선택 가능
     * @example ["short", "long"]
     */
    @ApiPropertyOptional({
        description: '고양이 털길이 필터 (cat 타입일 때만)',
        enum: FurLength,
        isArray: true,
        example: ['long'],
    })
    @IsOptional()
    @IsEnum(FurLength, { each: true })
    @Type(() => String)
    catFurLength?: string[];

    /**
     * 지역 필터 (광역시/도) - 중복 선택 가능
     * @example ["경기도", "서울특별시"]
     */
    @ApiPropertyOptional({
        description: '지역 필터 (광역시/도)',
        isArray: true,
        example: ['경상북도'],
    })
    @IsOptional()
    @IsString({ each: true })
    @Type(() => String)
    province?: string[];

    /**
     * 지역 필터 (시/군/구) - 중복 선택 가능
     * @example ["파주시", "강남구"]
     */
    @ApiPropertyOptional({
        description: '지역 필터 (시/군/구)',
        isArray: true,
        example: ['포항시'],
    })
    @IsOptional()
    @IsString({ each: true })
    @Type(() => String)
    city?: string[];

    /**
     * 입양 가능 여부 필터
     * @example true
     */
    @ApiPropertyOptional({
        description: '입양 가능 여부 필터',
        example: true,
    })
    @IsOptional()
    @Type(() => Boolean)
    isAdoptionAvailable?: boolean;

    /**
     * 브리더 레벨 필터 - 중복 선택 가능
     * @example ["new", "elite"]
     */
    @ApiPropertyOptional({
        description: '브리더 레벨 필터',
        enum: BreederLevel,
        isArray: true,
        example: ['new'],
    })
    @IsOptional()
    @IsEnum(BreederLevel, { each: true })
    @Type(() => String)
    breederLevel?: string[];

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