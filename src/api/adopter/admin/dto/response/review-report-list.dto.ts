import { ApiProperty } from '@nestjs/swagger';

/**
 * 후기 신고 목록 아이템 DTO
 *
 * GET /api/adopter-admin/reviews/reports
 * 신고된 후기 목록의 개별 아이템 정보를 담는 DTO입니다.
 */
export class ReviewReportItemDto {
    /**
     * 후기 고유 ID
     * @example "507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '후기 고유 ID',
        example: '507f1f77bcf86cd799439011',
    })
    reviewId: string;

    /**
     * 브리더 고유 ID
     * @example "507f1f77bcf86cd799439012"
     */
    @ApiProperty({
        description: '브리더 고유 ID',
        example: '507f1f77bcf86cd799439012',
    })
    breederId: string;

    /**
     * 브리더 이름
     * @example "김브리더"
     */
    @ApiProperty({
        description: '브리더 이름',
        example: '김브리더',
    })
    breederName: string;

    /**
     * 신고자 고유 ID
     * @example "507f1f77bcf86cd799439013"
     */
    @ApiProperty({
        description: '신고자 고유 ID',
        example: '507f1f77bcf86cd799439013',
    })
    reportedBy: string;

    /**
     * 신고자 닉네임
     * @example "입양자123"
     */
    @ApiProperty({
        description: '신고자 닉네임',
        example: '입양자123',
    })
    reporterName: string;

    /**
     * 신고 사유
     * @example "inappropriate_content"
     */
    @ApiProperty({
        description: '신고 사유',
        example: 'inappropriate_content',
    })
    reportReason: string;

    /**
     * 신고 상세 설명
     * @example "부적절한 언어가 포함된 후기입니다."
     */
    @ApiProperty({
        description: '신고 상세 설명',
        example: '부적절한 언어가 포함된 후기입니다.',
    })
    reportDescription: string;

    /**
     * 신고 일시
     * @example "2025-01-15T10:30:00.000Z"
     */
    @ApiProperty({
        description: '신고 일시 (ISO 8601 형식)',
        example: '2025-01-15T10:30:00.000Z',
    })
    reportedAt: Date;

    /**
     * 후기 내용
     * @example "좋은 경험이었습니다."
     */
    @ApiProperty({
        description: '후기 내용',
        example: '좋은 경험이었습니다.',
    })
    content: string;

    /**
     * 후기 작성 일시
     * @example "2025-01-10T10:30:00.000Z"
     */
    @ApiProperty({
        description: '후기 작성 일시 (ISO 8601 형식)',
        example: '2025-01-10T10:30:00.000Z',
    })
    writtenAt: Date;

    /**
     * 후기 공개 여부
     * @example true
     */
    @ApiProperty({
        description: '후기 공개 여부',
        example: true,
    })
    isVisible: boolean;
}
