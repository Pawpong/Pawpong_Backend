import { ApiProperty } from '@nestjs/swagger';

/**
 * 즐겨찾기 추가 응답 DTO
 * 브리더가 즐겨찾기에 성공적으로 추가되었을 때 반환되는 데이터 구조입니다.
 */
export class FavoriteAddResponseDto {
    /**
     * 추가된 브리더 ID
     * @example "507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '추가된 브리더 ID',
        example: '507f1f77bcf86cd799439011',
    })
    breederId: string;

    /**
     * 브리더 이름
     * @example "행복한 강아지 농장"
     */
    @ApiProperty({
        description: '브리더 이름',
        example: '행복한 강아지 농장',
    })
    breederName: string;

    /**
     * 추가 완료 메시지
     * @example "즐겨찾기에 성공적으로 추가되었습니다."
     */
    @ApiProperty({
        description: '추가 완료 메시지',
        example: '즐겨찾기에 성공적으로 추가되었습니다.',
    })
    message: string;

    /**
     * 전체 즐겨찾기 수
     * @example 6
     */
    @ApiProperty({
        description: '전체 즐겨찾기 수',
        example: 6,
    })
    totalCount: number;

    /**
     * 즐겨찾기 추가 일시
     * @example "2024-01-15T10:30:00.000Z"
     */
    @ApiProperty({
        description: '즐겨찾기 추가 일시',
        example: '2024-01-15T10:30:00.000Z',
        format: 'date-time',
    })
    addedAt: string;
}
