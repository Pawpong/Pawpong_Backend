import { ApiProperty } from '@nestjs/swagger';
import { PageInfoDto } from './page-info.dto';
import { PaginationBuilder } from './pagination-builder.dto';

/**
 * 페이지네이션 응답 DTO
 * 페이징 처리된 데이터와 페이지 정보를 함께 반환합니다.
 * data: { items: [], pageInfo: {} } 구조
 */
export class PaginationResponseDto<T> {
    /**
     * 페이징 처리된 실제 데이터
     */
    @ApiProperty({ description: '페이징 처리된 데이터 목록' })
    items: T[];

    /**
     * 페이지네이션 메타 정보
     */
    @ApiProperty({ description: '페이지네이션 정보', type: PageInfoDto })
    pageInfo: PageInfoDto;

    constructor(paginationBuilder: PaginationBuilder<T>) {
        this.items = paginationBuilder._items;
        this.pageInfo = {
            currentPage: paginationBuilder._page,
            pageSize: paginationBuilder._take,
            totalItems: paginationBuilder._totalCount,
            totalPages: this.getTotalPages(paginationBuilder._totalCount, paginationBuilder._take),
            hasNextPage: this.getHasNextPage(
                paginationBuilder._page,
                this.getTotalPages(paginationBuilder._totalCount, paginationBuilder._take),
            ),
            hasPrevPage: paginationBuilder._page > 1,
        };
    }

    /**
     * 전체 페이지 수를 계산합니다.
     */
    private getTotalPages(totalItems: number, pageSize: number): number {
        return Math.ceil(totalItems / pageSize);
    }

    /**
     * 다음 페이지 존재 여부를 확인합니다.
     */
    private getHasNextPage(currentPage: number, totalPages: number): boolean {
        return currentPage < totalPages;
    }
}
