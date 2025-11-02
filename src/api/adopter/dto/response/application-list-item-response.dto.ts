import { ApiProperty } from '@nestjs/swagger';

/**
 * 입양 신청 목록 아이템 응답 DTO
 *
 * 입양자가 자신이 보낸 입양 신청 목록을 조회할 때 사용됩니다.
 */
export class ApplicationListItemResponseDto {
    /**
     * 입양 신청 고유 ID
     * @example "507f1f77bcf86cd799439088"
     */
    @ApiProperty({
        description: '입양 신청 고유 ID',
        example: '507f1f77bcf86cd799439088',
    })
    applicationId: string;

    /**
     * 신청한 브리더 ID
     * @example "507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '신청한 브리더 ID',
        example: '507f1f77bcf86cd799439011',
    })
    breederId: string;

    /**
     * 브리더 이름
     * @example "행복한 브리더"
     */
    @ApiProperty({
        description: '브리더 이름',
        example: '행복한 브리더',
    })
    breederName: string;

    /**
     * 신청한 반려동물 ID (있는 경우)
     * @example "507f1f77bcf86cd799439099"
     */
    @ApiProperty({
        description: '신청한 반려동물 ID',
        example: '507f1f77bcf86cd799439099',
        required: false,
    })
    petId?: string;

    /**
     * 신청한 반려동물 이름 (있는 경우)
     * @example "루이"
     */
    @ApiProperty({
        description: '신청한 반려동물 이름',
        example: '루이',
        required: false,
    })
    petName?: string;

    /**
     * 신청 처리 상태
     * @example "consultation_pending"
     */
    @ApiProperty({
        description: '신청 처리 상태',
        example: 'consultation_pending',
        enum: ['consultation_pending', 'consultation_completed', 'adoption_approved', 'adoption_rejected'],
    })
    status: string;

    /**
     * 신청 접수 일시
     * @example "2024-01-15T10:30:00.000Z"
     */
    @ApiProperty({
        description: '신청 접수 일시',
        example: '2024-01-15T10:30:00.000Z',
        format: 'date-time',
    })
    appliedAt: string;

    /**
     * 신청 처리 일시 (처리 완료 시)
     * @example "2024-01-16T15:45:00.000Z"
     */
    @ApiProperty({
        description: '신청 처리 일시',
        example: '2024-01-16T15:45:00.000Z',
        format: 'date-time',
        required: false,
    })
    processedAt?: string;
}