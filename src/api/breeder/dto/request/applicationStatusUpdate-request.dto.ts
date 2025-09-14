import { IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 입양 신청 상태 업데이트 요청 DTO
 * 브리더가 받은 입양 신청의 상태를 변경할 때 사용됩니다.
 */
export class ApplicationStatusUpdateRequestDto {
    /**
     * 신청 처리 상태
     * @example "adoption_approved"
     */
    @ApiProperty({
        description: '신청 처리 상태',
        example: 'adoption_approved',
        enum: ['consultation_pending', 'consultation_completed', 'adoption_approved', 'adoption_rejected'],
    })
    @IsEnum(['consultation_pending', 'consultation_completed', 'adoption_approved', 'adoption_rejected'])
    status: string;

    /**
     * 브리더 메모 (선택사항)
     * @example "면담 후 승인 결정하였습니다."
     */
    @ApiProperty({
        description: '브리더 메모',
        example: '면담 후 승인 결정하였습니다.',
        maxLength: 500,
        required: false,
    })
    @IsString()
    @IsOptional()
    @MaxLength(500)
    breederNotes?: string;
}
