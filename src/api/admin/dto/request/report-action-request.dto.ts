import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { ReportStatus, AdminAction } from '../../../../common/enum/user.enum';

/**
 * 관리자 신고 처리 요청 DTO
 * 관리자가 사용자 신고를 처리할 때 사용됩니다.
 */
export class ReportActionRequestDto {
    /**
     * 신고 처리 결과
     * @example "resolved"
     */
    @ApiProperty({
        description: '신고 처리 결과',
        example: 'resolved',
        enum: ReportStatus,
    })
    @IsEnum(ReportStatus)
    status: ReportStatus;

    /**
     * 관리자가 취한 조치
     * @example "warning"
     */
    @ApiProperty({
        description: '관리자가 취한 조치',
        example: 'warning',
        enum: AdminAction,
    })
    @IsEnum(AdminAction)
    action: AdminAction;

    /**
     * 관리자 처리 메시지 (필수)
     * 신고자와 신고 대상자에게 전달되는 메시지
     * @example "경고 조치 완료. 유사한 사례 재발 시 계정 정지 처리됩니다."
     */
    @ApiProperty({
        description: '관리자 처리 메시지',
        example: '경고 조치 완료. 유사한 사례 재발 시 계정 정지 처리됩니다.',
    })
    @IsString()
    adminMessage: string;

    /**
     * 내부 관리 메모 (선택사항)
     * @example "첫 번째 경고, 추가 모니터링 필요"
     */
    @ApiProperty({
        description: '내부 관리 메모',
        example: '첫 번째 경고, 추가 모니터링 필요',
        required: false,
    })
    @IsOptional()
    @IsString()
    internalNotes?: string;
}
