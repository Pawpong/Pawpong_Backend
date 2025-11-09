import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { ReportStatus } from '../../../../../common/enum/user.enum';

/**
 * 신고 처리 요청 DTO
 * 관리자가 신고를 처리할 때 사용됩니다.
 */
export class ReportActionRequestDto {
    /**
     * 신고 처리 상태 (처리완료/기각/검토중)
     * @example "resolved"
     */
    @ApiProperty({
        description: '신고 처리 상태',
        example: 'resolved',
        enum: ReportStatus,
    })
    @IsEnum(ReportStatus)
    reportStatus: ReportStatus;

    /**
     * 관리자 처리 메모
     * @example "허위 신고로 판단되어 기각 처리합니다."
     */
    @ApiProperty({
        description: '관리자 처리 메모',
        example: '허위 신고로 판단되어 기각 처리합니다.',
        required: false,
    })
    @IsString()
    @IsOptional()
    adminNotes?: string;
}
