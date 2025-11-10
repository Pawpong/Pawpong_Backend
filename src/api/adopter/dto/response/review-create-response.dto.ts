import { ApiProperty } from '@nestjs/swagger';

/**
 * 후기 작성 응답 DTO
 * 후기가 성공적으로 작성되었을 때 반환되는 데이터 구조입니다.
 */
export class ReviewCreateResponseDto {
    /**
     * 생성된 후기 ID
     * @example "507f1f77bcf86cd799439044"
     */
    @ApiProperty({
        description: '생성된 후기 ID',
        example: '507f1f77bcf86cd799439044',
    })
    reviewId: string;

    /**
     * 입양 신청 ID
     * @example "507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '입양 신청 ID',
        example: '507f1f77bcf86cd799439011',
    })
    applicationId: string;

    /**
     * 후기 대상 브리더 ID
     * @example "507f1f77bcf86cd799439012"
     */
    @ApiProperty({
        description: '후기 대상 브리더 ID',
        example: '507f1f77bcf86cd799439012',
    })
    breederId: string;

    /**
     * 후기 유형
     * @example "adoption"
     */
    @ApiProperty({
        description: '후기 유형 (consultation | adoption)',
        example: 'adoption',
    })
    reviewType: string;

    /**
     * 후기 작성 일시
     * @example "2024-01-15T10:30:00.000Z"
     */
    @ApiProperty({
        description: '후기 작성 일시',
        example: '2024-01-15T10:30:00.000Z',
        format: 'date-time',
    })
    writtenAt: string;
}
