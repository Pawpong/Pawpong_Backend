import { ApiProperty } from '@nestjs/swagger';

/**
 * 후기 삭제 응답 DTO
 * 부적절한 후기 삭제 결과를 반환합니다.
 */
export class ReviewDeleteResponseDto {
    /**
     * 삭제된 후기 ID
     * @example "507f1f77bcf86cd799439044"
     */
    @ApiProperty({
        description: '삭제된 후기 ID',
        example: '507f1f77bcf86cd799439044',
    })
    reviewId: string;

    /**
     * 브리더 ID
     * @example "507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '브리더 ID',
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
     * 삭제 사유
     * @example "부적절한 내용 포함"
     */
    @ApiProperty({
        description: '삭제 사유',
        example: '부적절한 내용 포함',
    })
    deleteReason: string;

    /**
     * 삭제 일시
     * @example "2024-01-15T10:30:00.000Z"
     */
    @ApiProperty({
        description: '삭제 일시',
        example: '2024-01-15T10:30:00.000Z',
        format: 'date-time',
    })
    deletedAt: string;

    /**
     * 처리 완료 메시지
     * @example "부적절한 후기가 성공적으로 삭제되었습니다."
     */
    @ApiProperty({
        description: '처리 완료 메시지',
        example: '부적절한 후기가 성공적으로 삭제되었습니다.',
    })
    message: string;
}
