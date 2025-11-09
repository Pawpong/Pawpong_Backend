import { IsEnum, IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

import { VerificationStatus } from '../../../../../common/enum/user.enum';

/**
 * 관리자용 브리더 검색 요청 DTO
 * 관리자가 브리더 목록을 검색하고 필터링할 때 사용됩니다.
 */
export class BreederSearchRequestDto {
    /**
     * 인증 상태 필터
     * @example "pending"
     */
    @ApiProperty({
        description: '인증 상태 필터',
        example: 'pending',
        enum: VerificationStatus,
        required: false,
    })
    @IsEnum(VerificationStatus)
    @IsOptional()
    verificationStatus?: VerificationStatus;

    /**
     * 도시명 필터
     * @example "서울"
     */
    @ApiProperty({
        description: '도시명 필터',
        example: '서울',
        required: false,
    })
    @IsString()
    @IsOptional()
    cityName?: string;

    /**
     * 검색어 (이름 또는 이메일)
     * @example "김브리더"
     */
    @ApiProperty({
        description: '검색어 (이름 또는 이메일)',
        example: '김브리더',
        required: false,
    })
    @IsString()
    @IsOptional()
    searchKeyword?: string;

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
