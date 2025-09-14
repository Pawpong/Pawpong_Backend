import { ApiProperty } from '@nestjs/swagger';

/**
 * 브리더 인증 정보 DTO
 */
export class BreederVerificationInfoDto {
    /**
     * 인증 상태
     * @example "approved"
     */
    @ApiProperty({
        description: '인증 상태',
        example: 'approved',
        enum: ['pending', 'approved', 'rejected']
    })
    verificationStatus: string;

    /**
     * 구독 플랜
     * @example "premium"
     */
    @ApiProperty({
        description: '구독 플랜',
        example: 'premium',
        enum: ['basic', 'premium', 'enterprise']
    })
    subscriptionPlan: string;

    /**
     * 인증 신청 일시
     * @example "2024-01-10T10:30:00.000Z"
     */
    @ApiProperty({
        description: '인증 신청 일시',
        example: '2024-01-10T10:30:00.000Z',
        format: 'date-time',
        required: false
    })
    submittedAt?: Date;

    /**
     * 인증 검토 일시
     * @example "2024-01-12T14:20:00.000Z"
     */
    @ApiProperty({
        description: '인증 검토 일시',
        example: '2024-01-12T14:20:00.000Z',
        format: 'date-time',
        required: false
    })
    reviewedAt?: Date;

    /**
     * 거부 사유 (거부 시)
     * @example "서류가 불완전합니다."
     */
    @ApiProperty({
        description: '거부 사유',
        example: '서류가 불완전합니다.',
        required: false
    })
    rejectionReason?: string;
}

/**
 * 브리더 통계 정보 DTO
 */
export class BreederDashboardStatsDto {
    /**
     * 총 받은 입양 신청 수
     * @example 148
     */
    @ApiProperty({
        description: '총 받은 입양 신청 수',
        example: 148
    })
    totalApplicationCount: number;

    /**
     * 처리 대기 신청 수
     * @example 12
     */
    @ApiProperty({
        description: '처리 대기 신청 수',
        example: 12
    })
    pendingApplicationCount: number;

    /**
     * 완료된 입양 수
     * @example 95
     */
    @ApiProperty({
        description: '완료된 입양 수',
        example: 95
    })
    completedAdoptionCount: number;

    /**
     * 평균 평점
     * @example 4.6
     */
    @ApiProperty({
        description: '평균 평점',
        example: 4.6
    })
    averageRating: number;

    /**
     * 총 후기 수
     * @example 78
     */
    @ApiProperty({
        description: '총 후기 수',
        example: 78
    })
    totalReviewCount: number;

    /**
     * 프로필 조회 수
     * @example 2340
     */
    @ApiProperty({
        description: '프로필 조회 수',
        example: 2340
    })
    profileViewCount: number;
}

/**
 * 브리더 대시보드 응답 DTO
 * 브리더가 자신의 대시보드 정보를 조회할 때 사용됩니다.
 */
export class BreederDashboardResponseDto {
    /**
     * 브리더 프로필 정보
     */
    @ApiProperty({
        description: '브리더 프로필 정보'
    })
    profileInfo: {
        /**
         * 인증 정보
         */
        verificationInfo: BreederVerificationInfoDto;
    };

    /**
     * 브리더 통계 정보
     */
    @ApiProperty({
        description: '브리더 통계 정보',
        type: BreederDashboardStatsDto
    })
    statisticsInfo: BreederDashboardStatsDto;

    /**
     * 최근 입양 신청 목록 (최근 5개)
     */
    @ApiProperty({
        description: '최근 입양 신청 목록',
        type: Array
    })
    recentApplicationList: Array<{
        /**
         * 신청 ID
         */
        applicationId: string;
        /**
         * 입양자 이름
         */
        adopterName: string;
        /**
         * 반려동물 이름
         */
        petName: string;
        /**
         * 신청 상태
         */
        applicationStatus: string;
        /**
         * 신청 일시
         */
        appliedAt: Date;
    }>;

    /**
     * 분양 가능한 반려동물 수
     * @example 8
     */
    @ApiProperty({
        description: '분양 가능한 반려동물 수',
        example: 8
    })
    availablePetCount: number;
}