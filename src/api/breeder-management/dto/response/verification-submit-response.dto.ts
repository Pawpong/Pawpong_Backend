import { ApiProperty } from '@nestjs/swagger';

/**
 * 브리더 인증 신청 응답 DTO
 * 인증 신청이 성공적으로 제출되었을 때 반환되는 데이터 구조입니다.
 */
export class VerificationSubmitResponseDto {
    /**
     * 브리더 ID
     * @example "507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '브리더 ID',
        example: '507f1f77bcf86cd799439011',
    })
    breederId: string;

    /**
     * 인증 상태
     * @example "pending"
     */
    @ApiProperty({
        description: '인증 상태',
        example: 'pending',
        enum: ['pending', 'approved', 'rejected'],
    })
    verificationStatus: string;

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
     * 제출한 서류 개수
     * @example 3
     */
    @ApiProperty({
        description: '제출한 서류 개수',
        example: 3,
    })
    documentCount: number;

    /**
     * 예상 심사 기간 (일 단위)
     * @example 7
     */
    @ApiProperty({
        description: '예상 심사 기간 (일 단위)',
        example: 7,
    })
    expectedReviewDays: number;

    /**
     * 신청 완료 메시지
     * @example "인증 신청이 성공적으로 접수되었습니다. 심사에는 약 7일이 소요됩니다."
     */
    @ApiProperty({
        description: '신청 완료 메시지',
        example: '인증 신청이 성공적으로 접수되었습니다. 심사에는 약 7일이 소요됩니다.',
    })
    confirmationMessage: string;
}
