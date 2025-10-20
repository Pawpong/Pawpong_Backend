import { ApiProperty } from '@nestjs/swagger';

/**
 * 브리더 인증 승인/거절 응답 DTO
 * 브리더 인증 처리 결과를 반환합니다.
 */
export class BreederVerificationActionResponseDto {
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
     * 브리더 이름
     * @example "행복한 강아지 농장"
     */
    @ApiProperty({
        description: '브리더 이름',
        example: '행복한 강아지 농장',
    })
    breederName: string;

    /**
     * 처리 결과 (승인/거절)
     * @example "approved"
     */
    @ApiProperty({
        description: '처리 결과 (승인/거절)',
        example: 'approved',
        enum: ['approved', 'rejected'],
    })
    verificationStatus: string;

    /**
     * 처리 일시
     * @example "2024-01-15T10:30:00.000Z"
     */
    @ApiProperty({
        description: '처리 일시',
        example: '2024-01-15T10:30:00.000Z',
        format: 'date-time',
    })
    processedAt: string;

    /**
     * 관리자 메모
     * @example "서류 검토 완료. 정상 승인."
     */
    @ApiProperty({
        description: '관리자 메모',
        example: '서류 검토 완료. 정상 승인.',
        required: false,
    })
    adminNote?: string;

    /**
     * 거절 사유 (거절인 경우)
     * @example "서류 미비"
     */
    @ApiProperty({
        description: '거절 사유 (거절인 경우)',
        example: '서류 미비',
        required: false,
    })
    rejectionReason?: string;

    /**
     * 처리 완료 메시지
     * @example "브리더 인증이 승인되었습니다."
     */
    @ApiProperty({
        description: '처리 완료 메시지',
        example: '브리더 인증이 승인되었습니다.',
    })
    message: string;
}
