import { IsOptional, IsString, IsEnum, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PetType } from '../../../../common/enum/user.enum';
import { PaginationRequestDto } from '../../../../common/dto/pagination/pagination-request.dto';

/**
 * 브리더 검색 요청 DTO
 * 공통 페이지네이션 모듈을 활용한 브리더 검색 요청입니다.
 * PaginationRequestDto를 상속받아 표준 페이지네이션 기능을 제공합니다.
 */
export class BreederSearchRequestDto extends PaginationRequestDto {
    /**
     * 반려동물 종류 (강아지/고양이)
     * @example "dog"
     */
    @ApiProperty({
        description: '반려동물 종류',
        example: 'dog',
        enum: PetType,
        required: false,
    })
    @IsOptional()
    @IsEnum(PetType)
    petType?: PetType;

    /**
     * 반려동물 품종
     * @example "골든 리트리버"
     */
    @ApiProperty({
        description: '반려동물 품종',
        example: '골든 리트리버',
        required: false,
    })
    @IsOptional()
    @IsString()
    breedName?: string;

    /**
     * 도시명
     * @example "서울"
     */
    @ApiProperty({
        description: '도시명',
        example: '서울',
        required: false,
    })
    @IsOptional()
    @IsString()
    cityName?: string;

    /**
     * 구/군명
     * @example "강남구"
     */
    @ApiProperty({
        description: '구/군명',
        example: '강남구',
        required: false,
    })
    @IsOptional()
    @IsString()
    districtName?: string;

    /**
     * 즉시 분양 가능 여부
     * @example true
     */
    @ApiProperty({
        description: '즉시 분양 가능 여부',
        example: true,
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
    isImmediatelyAvailable?: boolean;

    /**
     * 최소 가격 (원)
     * @example 500000
     */
    @ApiProperty({
        description: '최소 가격 (원)',
        example: 500000,
        minimum: 0,
        required: false,
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
    @ApiProperty({
        description: '최대 가격 (원)',
        example: 2000000,
        maximum: 10000000,
        required: false,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Max(10000000)
    maxPrice?: number;

    /**
     * 정렬 기준
     * @example "rating"
     */
    @ApiProperty({
        description: '정렬 기준',
        example: 'rating',
        enum: ['rating', 'experience', 'recent', 'applications'],
        required: false,
    })
    @IsOptional()
    @IsEnum(['rating', 'experience', 'recent', 'applications'])
    sortCriteria?: 'rating' | 'experience' | 'recent' | 'applications' = 'rating';
}
