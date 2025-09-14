import { ApiProperty } from '@nestjs/swagger';

/**
 * 브리더 인증 정보 응답 DTO
 * 인증 대기 중인 브리더의 정보를 제공합니다.
 */
export class BreederVerificationResponseDto {
    /**
     * 브리더 고유 ID
     * @example "507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '브리더 고유 ID',
        example: '507f1f77bcf86cd799439011',
    })
    breederId: string;

    /**
     * 브리더 실명
     * @example "김철수"
     */
    @ApiProperty({
        description: '브리더 실명',
        example: '김철수',
    })
    breederName: string;

    /**
     * 브리더 이메일
     * @example "breeder@example.com"
     */
    @ApiProperty({
        description: '브리더 이메일',
        example: 'breeder@example.com',
    })
    emailAddress: string;

    /**
     * 인증 정보
     */
    @ApiProperty({
        description: '인증 정보',
    })
    verificationInfo: {
        /**
         * 인증 상태
         * @example "pending"
         */
        verificationStatus: string;

        /**
         * 요금제 계획
         * @example "premium"
         */
        subscriptionPlan: string;

        /**
         * 신청 일시
         * @example "2024-01-15T10:30:00.000Z"
         */
        submittedAt?: Date;

        /**
         * 제출된 서류 URL 배열
         * @example ["https://example.com/doc1.pdf", "https://example.com/doc2.pdf"]
         */
        documentUrls: string[];

        /**
         * 이메일 제출 여부
         * @example false
         */
        isSubmittedByEmail?: boolean;
    };

    /**
     * 브리더 프로필 정보 (선택사항)
     */
    @ApiProperty({
        description: '브리더 프로필 정보',
        required: false,
    })
    profileInfo?: any;

    /**
     * 계정 생성 일시
     * @example "2024-01-10T08:15:00.000Z"
     */
    @ApiProperty({
        description: '계정 생성 일시',
        example: '2024-01-10T08:15:00.000Z',
        format: 'date-time',
    })
    createdAt: Date;
}
