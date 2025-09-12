import { IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * 페이지네이션 요청 DTO
 * 페이징 처리가 필요한 API 요청에서 사용됩니다.
 */
export class PaginationRequestDto {
    /**
     * 요청할 페이지 번호 (1부터 시작, 기본값: 1)
     * @example 1
     */
    @ApiProperty({ description: '페이지 번호(기본값: 1)', example: 1, required: false })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Transform(({ value }) => parseInt(value))
    page: number = 1;

    /**
     * 한 페이지에 표시할 데이터 수 (기본값: 10, 최대: 100)
     * @example 10
     */
    @ApiProperty({ description: '한 페이지에 보여질 데이터 수(기본값: 10)', example: 10, required: false })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Transform(({ value }) => Math.min(parseInt(value), 100)) // 최대 100개로 제한
    take: number = 10;

    /**
     * MongoDB skip 값을 계산합니다.
     * @returns 건너뛸 문서 수
     */
    getSkip(): number {
        return (this.page - 1) * this.take;
    }

    /**
     * take 값을 반환합니다.
     * @returns 가져올 문서 수
     */
    getTake(): number {
        return this.take;
    }
}