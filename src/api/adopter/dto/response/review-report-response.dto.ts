import { ApiProperty } from '@nestjs/swagger';

/**
 * 후기 신고 응답 DTO
 */
export class ReviewReportResponseDto {
    @ApiProperty({
        description: '성공 메시지',
        example: '후기가 신고되었습니다. 관리자가 검토 후 처리합니다.',
    })
    message: string;
}
