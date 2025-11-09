import { IsEnum, IsDateString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

import { StatsType } from '../../../../../common/enum/user.enum';

/**
 * 관리자용 통계 필터 요청 DTO
 * 관리자가 통계 데이터를 조회할 때 사용됩니다.
 */
export class StatsFilterRequestDto {
    /**
     * 통계 유형
     * @example "daily"
     */
    @ApiProperty({
        description: '통계 유형',
        example: 'daily',
        enum: StatsType,
        required: false,
    })
    @IsEnum(StatsType)
    @IsOptional()
    statsType?: StatsType = StatsType.DAILY;

    /**
     * 통계 시작 날짜
     * @example "2024-01-01"
     */
    @ApiProperty({
        description: '통계 시작 날짜',
        example: '2024-01-01',
        format: 'date',
        required: false,
    })
    @IsDateString()
    @IsOptional()
    startDate?: string;

    /**
     * 통계 종료 날짜
     * @example "2024-01-31"
     */
    @ApiProperty({
        description: '통계 종료 날짜',
        example: '2024-01-31',
        format: 'date',
        required: false,
    })
    @IsDateString()
    @IsOptional()
    endDate?: string;

    /**
     * 페이지 번호
     * @example 1
     */
    @ApiProperty({
        description: '페이지 번호',
        example: 1,
        minimum: 1,
        required: false,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    pageNumber?: number = 1;

    /**
     * 페이지당 항목 수
     * @example 10
     */
    @ApiProperty({
        description: '페이지당 항목 수',
        example: 10,
        minimum: 1,
        maximum: 100,
        required: false,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(100)
    itemsPerPage?: number = 10;
}
