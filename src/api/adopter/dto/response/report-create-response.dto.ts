import { ApiProperty } from '@nestjs/swagger';

/**
 * 신고 제출 응답 DTO
 * 브리더 신고가 성공적으로 제출되었을 때 반환되는 데이터 구조입니다.
 */
export class ReportCreateResponseDto {
    /**
     * 생성된 신고 ID
     * @example "507f1f77bcf86cd799439055"
     */
    @ApiProperty({
        description: '생성된 신고 ID',
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
     * 신고 사유
     * @example "허위 정보 제공"
     */
    @ApiProperty({
        description: '신고 사유',
        example: '허위 정보 제공',
        enum: ['fake_info', 'inappropriate_behavior', 'animal_abuse', 'scam', 'other'],
    })
    reason: string;

    /**
     * 신고 상태
     * @example "pending"
     */
    @ApiProperty({
        description: '신고 상태',
        example: 'pending',
        enum: ['pending', 'reviewing', 'resolved', 'dismissed'],
    })
    status: string;

    /**
     * 신고 제출 일시
     * @example "2024-01-15T10:30:00.000Z"
     */
    @ApiProperty({
        description: '신고 제출 일시',
        example: '2024-01-15T10:30:00.000Z',
        format: 'date-time',
    })
    reportedAt: string;

    /**
     * 예상 처리 기간 (일 단위)
     * @example 3
     */
    @ApiProperty({
        description: '예상 처리 기간 (일 단위)',
        example: 3,
    })
    expectedProcessingDays: number;

    /**
     * 신고 접수 확인 메시지
     * @example "신고가 성공적으로 접수되었습니다. 관리자가 검토 후 조치하겠습니다."
     */
    @ApiProperty({
        description: '신고 접수 확인 메시지',
        example: '신고가 성공적으로 접수되었습니다. 관리자가 검토 후 조치하겠습니다.',
    })
    confirmationMessage: string;
}
