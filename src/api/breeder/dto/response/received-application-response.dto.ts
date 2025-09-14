import { ApiProperty } from '@nestjs/swagger';

/**
 * 받은 입양 신청 응답 DTO
 * 브리더가 받은 입양 신청 목록을 조회할 때 사용됩니다.
 */
export class ReceivedApplicationResponseDto {
    /**
     * 입양 신청 고유 ID
     * @example "507f1f77bcf86cd799439088"
     */
    @ApiProperty({
        description: '입양 신청 고유 ID',
        example: '507f1f77bcf86cd799439088'
    })
    applicationId: string;

    /**
     * 입양자 고유 ID
     * @example "507f1f77bcf86cd799439044"
     */
    @ApiProperty({
        description: '입양자 고유 ID',
        example: '507f1f77bcf86cd799439044'
    })
    adopterId: string;

    /**
     * 입양자 실명
     * @example "박입양자"
     */
    @ApiProperty({
        description: '입양자 실명',
        example: '박입양자'
    })
    adopterName: string;

    /**
     * 입양자 이메일
     * @example "adopter@example.com"
     */
    @ApiProperty({
        description: '입양자 이메일',
        example: 'adopter@example.com'
    })
    adopterEmail: string;

    /**
     * 신청한 반려동물 ID
     * @example "507f1f77bcf86cd799439099"
     */
    @ApiProperty({
        description: '신청한 반려동물 ID',
        example: '507f1f77bcf86cd799439099'
    })
    targetPetId: string;

    /**
     * 신청한 반려동물 이름
     * @example "골든베이비"
     */
    @ApiProperty({
        description: '신청한 반려동물 이름',
        example: '골든베이비'
    })
    targetPetName: string;

    /**
     * 신청 처리 상태
     * @example "consultation_pending"
     */
    @ApiProperty({
        description: '신청 처리 상태',
        example: 'consultation_pending',
        enum: ['consultation_pending', 'consultation_completed', 'adoption_approved', 'adoption_rejected']
    })
    applicationStatus: string;

    /**
     * 입양 신청서 데이터
     */
    @ApiProperty({
        description: '입양 신청서 데이터',
        type: Object
    })
    applicationFormData: Record<string, any>;

    /**
     * 신청 접수 일시
     * @example "2024-01-15T10:30:00.000Z"
     */
    @ApiProperty({
        description: '신청 접수 일시',
        example: '2024-01-15T10:30:00.000Z',
        format: 'date-time'
    })
    appliedAt: Date;

    /**
     * 신청 처리 일시 (처리 완료 시)
     * @example "2024-01-16T15:45:00.000Z"
     */
    @ApiProperty({
        description: '신청 처리 일시',
        example: '2024-01-16T15:45:00.000Z',
        format: 'date-time',
        required: false
    })
    processedAt?: Date;

    /**
     * 브리더 메모 (선택사항)
     * @example "면담 후 최종 결정 예정"
     */
    @ApiProperty({
        description: '브리더 메모',
        example: '면담 후 최종 결정 예정',
        required: false
    })
    breederNotes?: string;
}