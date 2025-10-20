import { ApiProperty } from '@nestjs/swagger';

/**
 * 신고 처리 응답 DTO
 * 신고 처리 결과를 반환합니다.
 */
export class ReportActionResponseDto {
    /**
     * 신고 ID
     * @example "507f1f77bcf86cd799439055"
     */
    @ApiProperty({
        description: '신고 ID',
        example: '507f1f77bcf86cd799439055',
    })
    reportId: string;

    /**
     * 신고 대상 브리더 ID
     * @example "507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '신고 대상 브리더 ID',
        example: '507f1f77bcf86cd799439011',
    })
    targetBreederId: string;

    /**
     * 이전 상태
     * @example "pending"
     */
    @ApiProperty({
        description: '이전 상태',
        example: 'pending',
        enum: ['pending', 'reviewing', 'resolved', 'dismissed'],
    })
    previousStatus: string;

    /**
     * 새로운 상태
     * @example "resolved"
     */
    @ApiProperty({
        description: '새로운 상태',
        example: 'resolved',
        enum: ['pending', 'reviewing', 'resolved', 'dismissed'],
    })
    newStatus: string;

    /**
     * 관리자 조치 내용
     * @example "해당 브리더에게 경고 조치를 취했습니다."
     */
    @ApiProperty({
        description: '관리자 조치 내용',
        example: '해당 브리더에게 경고 조치를 취했습니다.',
    })
    adminAction: string;

    /**
     * 처리 일시
     * @example "2024-01-15T10:30:00.000Z"
     */
    @ApiProperty({
        description: '처리 일시',
        example: '2024-01-15T10:30:00.000Z',
        format: 'date-time',
    })
    processedAt: string;

    /**
     * 처리 완료 메시지
     * @example "신고가 성공적으로 처리되었습니다."
     */
    @ApiProperty({
        description: '처리 완료 메시지',
        example: '신고가 성공적으로 처리되었습니다.',
    })
    message: string;
}
