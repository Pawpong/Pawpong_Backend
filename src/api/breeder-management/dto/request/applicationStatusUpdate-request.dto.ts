import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 입양 신청 상태 업데이트 요청 DTO
 * 브리더가 받은 입양 신청의 상태를 변경할 때 사용됩니다.
 */
export class ApplicationStatusUpdateRequestDto {
    /**
     * 입양 신청 ID
     * @example "app_507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '입양 신청 ID',
        example: 'app_507f1f77bcf86cd799439011',
    })
    @IsString()
    @IsNotEmpty()
    applicationId: string;

    /**
     * 변경할 상태
     * @example "consultation_completed"
     */
    @ApiProperty({
        description: '변경할 상태',
        example: 'consultation_completed',
        enum: ['consultation_pending', 'consultation_completed', 'adoption_approved', 'adoption_rejected'],
    })
    @IsEnum(['consultation_pending', 'consultation_completed', 'adoption_approved', 'adoption_rejected'])
    status: string;

    /**
     * 상태 변경 사유 또는 메모
     * @example "상담을 통해 입양 조건이 충족되어 승인합니다."
     */
    @ApiProperty({
        description: '상태 변경 사유 또는 메모',
        example: '상담을 통해 입양 조건이 충족되어 승인합니다.',
        required: false,
    })
    @IsOptional()
    @IsString()
    notes?: string;

    /**
     * 브리더가 취한 구체적인 조치
     * @example "전화 상담 완료, 견학 예약"
     */
    @ApiProperty({
        description: '브리더가 취한 구체적인 조치',
        example: '전화 상담 완료, 견학 예약',
        required: false,
    })
    @IsOptional()
    @IsString()
    actionTaken?: string;

    /**
     * 다음 단계 안내
     * @example "이번 주말에 직접 방문 부탁드립니다."
     */
    @ApiProperty({
        description: '다음 단계 안내',
        example: '이번 주말에 직접 방문 부탁드립니다.',
        required: false,
    })
    @IsOptional()
    @IsString()
    nextSteps?: string;
}
