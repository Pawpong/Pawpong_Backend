import { PaginationResponseDto } from './pagination-response.dto';

/**
 * 페이지네이션 빌더 클래스
 * 페이지네이션 응답을 생성하기 위한 빌더 패턴을 제공합니다.
 */
export class PaginationBuilder<T> {
    _data: T[];
    _page: number;
    _take: number;
    _totalCount: number;

    /**
     * 페이징 처리된 데이터를 설정합니다.
     * @param data 페이징 처리된 데이터 배열
     */
    setData(data: T[]): this {
        this._data = data;
        return this;
    }

    /**
     * 현재 페이지 번호를 설정합니다.
     * @param page 페이지 번호 (1부터 시작)
     */
    setPage(page: number): this {
        this._page = page;
        return this;
    }

    /**
     * 페이지 크기를 설정합니다.
     * @param take 한 페이지에 표시할 데이터 수
     */
    setTake(take: number): this {
        this._take = take;
        return this;
    }

    /**
     * 전체 데이터 개수를 설정합니다.
     * @param totalCount 전체 데이터 개수
     */
    setTotalCount(totalCount: number): this {
        this._totalCount = totalCount;
        return this;
    }

    /**
     * 페이지네이션 응답 객체를 생성합니다.
     * @returns 페이지네이션 응답 DTO
     */
    build(): PaginationResponseDto<T> {
        return new PaginationResponseDto(this);
    }
}