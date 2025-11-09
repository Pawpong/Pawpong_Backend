import { ApiProperty } from '@nestjs/swagger';

/**
 * 브리더 신고 목록 아이템 DTO
 *
 * GET /api/breeder-admin/reports
 * 브리더에 대한 신고 목록의 개별 아이템 정보를 담는 DTO입니다.
 */
export class BreederReportItemDto {
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
     * 브리더 고유 ID
     * @example "507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '브리더 고유 ID',
        example: '507f1f77bcf86cd799439011',
    })
    breederId: string;

    /**
     * 신고 정보 객체
     */
    @ApiProperty({
        description: '신고 정보 객체',
        type: 'object',
        properties: {
            reportId: {
                type: 'string',
                description: '신고 고유 ID',
                example: '507f1f77bcf86cd799439012',
            },
            reporterId: {
                type: 'string',
                description: '신고자 고유 ID',
                example: '507f1f77bcf86cd799439013',
            },
            reason: {
                type: 'string',
                description: '신고 사유',
                example: 'fraud',
            },
            description: {
                type: 'string',
                description: '신고 상세 설명',
                example: '사기 의심 브리더입니다.',
            },
            status: {
                type: 'string',
                description: '신고 처리 상태',
                example: 'pending',
            },
            reportedAt: {
                type: 'string',
                format: 'date-time',
                description: '신고 일시',
                example: '2025-01-15T10:30:00.000Z',
            },
            adminAction: {
                type: 'string',
                description: '관리자 조치 내용',
                example: '',
                nullable: true,
            },
        },
    })
    report: {
        reportId: string;
        reporterId: string;
        reason: string;
        description: string;
        status: string;
        reportedAt: Date;
        adminAction?: string;
    };
}
