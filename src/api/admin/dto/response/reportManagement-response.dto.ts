import { ApiProperty } from '@nestjs/swagger';

/**
 * 신고 관리 정보 응답 DTO
 * 관리자가 조회하는 신고 정보를 제공합니다.
 */
export class ReportManagementResponseDto {
    /**
     * 신고 고유 ID
     * @example "507f1f77bcf86cd799439033"
     */
    @ApiProperty({
        description: '신고 고유 ID',
        example: '507f1f77bcf86cd799439033',
    })
    reportId: string;

    /**
     * 신고자 ID
     * @example "507f1f77bcf86cd799439044"
     */
    @ApiProperty({
        description: '신고자 ID',
        example: '507f1f77bcf86cd799439044',
    })
    reporterId: string;

    /**
     * 신고자 이름
     * @example "홍신고자"
     */
    @ApiProperty({
        description: '신고자 이름',
        example: '홍신고자',
    })
    reporterName: string;

    /**
     * 신고 대상 유형 (브리더/게시물 등)
     * @example "breeder"
     */
    @ApiProperty({
        description: '신고 대상 유형',
        example: 'breeder',
        enum: ['breeder', 'post', 'review'],
    })
    reportTargetType: string;

    /**
     * 신고 대상 ID
     * @example "507f1f77bcf86cd799439055"
     */
    @ApiProperty({
        description: '신고 대상 ID',
        example: '507f1f77bcf86cd799439055',
    })
    reportTargetId: string;

    /**
     * 신고 대상 이름 (선택사항)
     * @example "김브리더"
     */
    @ApiProperty({
        description: '신고 대상 이름',
        example: '김브리더',
        required: false,
    })
    reportTargetName?: string;

    /**
     * 신고 유형
     * @example "inappropriate_content"
     */
    @ApiProperty({
        description: '신고 유형',
        example: 'inappropriate_content',
        enum: ['no_contract', 'false_info', 'inappropriate_content', 'poor_conditions', 'fraud', 'other'],
    })
    reportType: string;

    /**
     * 신고 상세 내용
     * @example "부적절한 내용이 포함된 게시물입니다."
     */
    @ApiProperty({
        description: '신고 상세 내용',
        example: '부적절한 내용이 포함된 게시물입니다.',
    })
    reportDescription: string;

    /**
     * 신고 처리 상태
     * @example "pending"
     */
    @ApiProperty({
        description: '신고 처리 상태',
        example: 'pending',
        enum: ['pending', 'reviewing', 'resolved', 'dismissed'],
    })
    reportStatus: string;

    /**
     * 신고 일시
     * @example "2024-01-15T16:45:00.000Z"
     */
    @ApiProperty({
        description: '신고 일시',
        example: '2024-01-15T16:45:00.000Z',
        format: 'date-time',
    })
    reportedAt: Date;

    /**
     * 관리자 처리 메모 (선택사항)
     * @example "검토 완료 후 기각 처리"
     */
    @ApiProperty({
        description: '관리자 처리 메모',
        example: '검토 완료 후 기각 처리',
        required: false,
    })
    adminNotes?: string;
}
