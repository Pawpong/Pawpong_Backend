import { ApiProperty } from '@nestjs/swagger';

/**
 * 입양 신청 생성 응답 DTO (Figma 디자인 기반)
 *
 * 입양 신청이 성공적으로 생성되었을 때 반환되는 데이터 구조입니다.
 */
export class ApplicationCreateResponseDto {
    /**
     * 생성된 입양 신청 ID
     * @example "507f1f77bcf86cd799439033"
     */
    @ApiProperty({
        description: '생성된 입양 신청 ID',
        example: '507f1f77bcf86cd799439033',
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
     * @example "507f1f77bcf86cd799439022"
     */
    @ApiProperty({
        description: '신청한 반려동물 ID',
        example: '507f1f77bcf86cd799439022',
        required: false,
    })
    petId?: string;

    /**
     * 반려동물 이름 (있는 경우)
     * @example "루이"
     */
    @ApiProperty({
        description: '반려동물 이름',
        example: '루이',
        required: false,
    })
    petName?: string;

    /**
     * 신청 상태
     * @example "consultation_pending"
     */
    @ApiProperty({
        description: '신청 상태',
        example: 'consultation_pending',
        enum: ['consultation_pending', 'consultation_completed', 'adoption_approved', 'adoption_rejected'],
    })
    status: string;

    /**
     * 신청 일시
     * @example "2024-01-15T10:30:00.000Z"
     */
    @ApiProperty({
        description: '신청 일시',
        example: '2024-01-15T10:30:00.000Z',
        format: 'date-time',
    })
    appliedAt: string;

    /**
     * 신청 완료 안내 메시지
     * @example "입양 상담 신청이 성공적으로 접수되었습니다. 브리더의 응답을 기다려주세요."
     */
    @ApiProperty({
        description: '신청 완료 안내 메시지',
        example: '입양 상담 신청이 성공적으로 접수되었습니다. 브리더의 응답을 기다려주세요.',
    })
    message: string;
}
