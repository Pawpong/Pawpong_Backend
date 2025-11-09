import { IsEnum, IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

import { UserStatus } from '../../../../../common/enum/user.enum';

/**
 * 관리자용 사용자 검색 요청 DTO
 * 관리자가 사용자 목록을 검색하고 필터링할 때 사용됩니다.
 */
export class UserSearchRequestDto {
    /**
     * 사용자 역할 필터
     * @example "adopter"
     */
    @ApiProperty({
        description: '사용자 역할 필터',
        example: 'adopter',
        enum: ['adopter', 'breeder'],
        required: false,
    })
    @IsEnum(['adopter', 'breeder'])
    @IsOptional()
    userRole?: string;

    /**
     * 계정 상태 필터
     * @example "active"
     */
    @ApiProperty({
        description: '계정 상태 필터',
        example: 'active',
        enum: UserStatus,
        required: false,
    })
    @IsEnum(UserStatus)
    @IsOptional()
    accountStatus?: UserStatus;

    /**
     * 검색어 (이름 또는 이메일)
     * @example "김사용자"
     */
    @ApiProperty({
        description: '검색어 (이름 또는 이메일)',
        example: '김사용자',
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
