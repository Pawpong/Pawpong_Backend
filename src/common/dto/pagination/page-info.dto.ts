import { ApiProperty } from '@nestjs/swagger';

/**
 * 페이지네이션 정보 DTO
 * 페이징 처리된 데이터의 메타 정보를 제공합니다.
 */
export class PageInfoDto {
    /**
     * 현재 페이지 번호 (1부터 시작)
     * @example 1
     */
    @ApiProperty({ description: '페이지 번호(기본값: 1)', example: 1 })
    currentPage: number;

    /**
     * 한 페이지에 표시되는 데이터 수
     * @example 10
     */
    @ApiProperty({ description: '한 페이지에 보여질 데이터 수(기본값: 10)', example: 10 })
    pageSize: number;

    /**
     * 전체 데이터 개수
     * @example 100
     */
    @ApiProperty({ description: '총 데이터의 갯수', example: 100 })
    totalItems: number;

    /**
     * 전체 페이지 수
     * @example 10
     */
    @ApiProperty({ description: '총 페이지의 수', example: 10 })
    totalPages: number;

    /**
     * 다음 페이지 존재 여부
     * @example true
     */
    @ApiProperty({ description: '다음 페이지 존재 유무(다음페이지가 존재하면 true)', example: true })
    hasNextPage: boolean;

    /**
     * 이전 페이지 존재 여부
     * @example false
     */
    @ApiProperty({ description: '이전 페이지 존재 유무(이전페이지가 존재하면 true)', example: false })
    hasPrevPage: boolean;
}
