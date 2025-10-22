import { ApiProperty } from '@nestjs/swagger';

/**
 * 입양 신청 생성 응답 DTO
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
    targetBreederId: string;

    /**
     * 신청한 반려동물 ID
     * @example "507f1f77bcf86cd799439022"
     */
    @ApiProperty({
        description: '신청한 반려동물 ID',
        example: '507f1f77bcf86cd799439022',
    })
    targetPetId: string;

    /**
     * 신청 상태
     * @example "pending"
     */
    @ApiProperty({
        description: '신청 상태',
        example: 'pending',
        enum: ['pending', 'reviewed', 'approved', 'rejected'],
    })
    applicationStatus: string;

    /**
     * 신청 일시
     * @example "2024-01-15T10:30:00.000Z"
     */
    @ApiProperty({
        description: '신청 일시',
        example: '2024-01-15T10:30:00.000Z',
        format: 'date-time',
    })
    submittedAt: string;

    /**
     * 브리더 응답 예상 시간 (시간 단위)
     * @example 24
     */
    @ApiProperty({
        description: '브리더 응답 예상 시간 (시간 단위)',
        example: 24,
    })
    expectedResponseHours: number;

    /**
     * 신청 완료 메시지
     * @example "입양 신청이 성공적으로 접수되었습니다. 브리더의 응답을 기다려주세요."
     */
    @ApiProperty({
        description: '신청 완료 메시지',
        example: '입양 신청이 성공적으로 접수되었습니다. 브리더의 응답을 기다려주세요.',
    })
    confirmationMessage: string;
}
