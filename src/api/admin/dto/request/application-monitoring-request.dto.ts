import { IsString, IsOptional, IsNumber, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 관리자용 입양 신청 모니터링 요청 DTO
 * 관리자가 입양 신청 현황을 모니터링할 때 사용됩니다.
 */
export class ApplicationMonitoringRequestDto {
    /**
     * 브리더 ID 필터 (특정 브리더의 신청만 조회)
     * @example "507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '브리더 ID 필터',
        example: '507f1f77bcf86cd799439011',
        required: false,
    })
    @IsString()
    @IsOptional()
    targetBreederId?: string;

    /**
     * 검색 시작 날짜
     * @example "2024-01-01"
     */
    @ApiProperty({
        description: '검색 시작 날짜',
        example: '2024-01-01',
        format: 'date',
        required: false,
    })
    @IsDateString()
    @IsOptional()
    startDate?: string;

    /**
     * 검색 종료 날짜
     * @example "2024-01-31"
     */
    @ApiProperty({
        description: '검색 종료 날짜',
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
        maximum: 50,
        required: false,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(50)
    itemsPerPage?: number = 10;
}
