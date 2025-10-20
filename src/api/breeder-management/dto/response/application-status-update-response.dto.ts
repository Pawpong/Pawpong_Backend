import { ApiProperty } from '@nestjs/swagger';

/**
 * 입양 신청 상태 업데이트 응답 DTO
 * 입양 신청 상태가 성공적으로 변경되었을 때 반환되는 데이터 구조입니다.
 */
export class ApplicationStatusUpdateResponseDto {
    /**
     * 입양 신청 ID
     * @example "507f1f77bcf86cd799439033"
     */
    @ApiProperty({
        description: '입양 신청 ID',
        example: '507f1f77bcf86cd799439033',
    })
    applicationId: string;

    /**
     * 입양자 ID
     * @example "507f1f77bcf86cd799439099"
     */
    @ApiProperty({
        description: '입양자 ID',
        example: '507f1f77bcf86cd799439099',
    })
    adopterId: string;

    /**
     * 입양자 이름
     * @example "홍길동"
     */
    @ApiProperty({
        description: '입양자 이름',
        example: '홍길동',
    })
    adopterName: string;

    /**
     * 반려동물 ID
     * @example "507f1f77bcf86cd799439022"
     */
    @ApiProperty({
        description: '반려동물 ID',
        example: '507f1f77bcf86cd799439022',
    })
    petId: string;

    /**
     * 반려동물 이름
     * @example "해피"
     */
    @ApiProperty({
        description: '반려동물 이름',
        example: '해피',
    })
    petName: string;

    /**
     * 이전 상태
     * @example "pending"
     */
    @ApiProperty({
        description: '이전 상태',
        example: 'pending',
        enum: ['pending', 'reviewed', 'approved', 'rejected', 'completed'],
    })
    previousStatus: string;

    /**
     * 새로운 상태
     * @example "approved"
     */
    @ApiProperty({
        description: '새로운 상태',
        example: 'approved',
        enum: ['pending', 'reviewed', 'approved', 'rejected', 'completed'],
    })
    newStatus: string;

    /**
     * 브리더 메모
     * @example "입양 조건을 모두 충족하여 승인합니다."
     */
    @ApiProperty({
        description: '브리더 메모',
        example: '입양 조건을 모두 충족하여 승인합니다.',
        required: false,
    })
    breederNote?: string;

    /**
     * 상태 변경 일시
     * @example "2024-01-15T10:30:00.000Z"
     */
    @ApiProperty({
        description: '상태 변경 일시',
        example: '2024-01-15T10:30:00.000Z',
        format: 'date-time',
    })
    updatedAt: string;

    /**
     * 상태 변경 완료 메시지
     * @example "입양 신청이 승인되었습니다."
     */
    @ApiProperty({
        description: '상태 변경 완료 메시지',
        example: '입양 신청이 승인되었습니다.',
    })
    message: string;
}
