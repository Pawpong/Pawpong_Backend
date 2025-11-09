import { ApiProperty } from '@nestjs/swagger';

/**
 * 사용자 통계 정보 DTO
 */
export class UserStatsDto {
    /**
     * 총 입양자 수
     * @example 1250
     */
    @ApiProperty({
        description: '총 입양자 수',
        example: 1250,
    })
    totalAdopterCount: number;

    /**
     * 신규 입양자 수 (이번 달)
     * @example 85
     */
    @ApiProperty({
        description: '신규 입양자 수 (이번 달)',
        example: 85,
    })
    newAdopterCount: number;

    /**
     * 활성 입양자 수
     * @example 1180
     */
    @ApiProperty({
        description: '활성 입양자 수',
        example: 1180,
    })
    activeAdopterCount: number;

    /**
     * 총 브리더 수
     * @example 340
     */
    @ApiProperty({
        description: '총 브리더 수',
        example: 340,
    })
    totalBreederCount: number;

    /**
     * 신규 브리더 수 (이번 달)
     * @example 28
     */
    @ApiProperty({
        description: '신규 브리더 수 (이번 달)',
        example: 28,
    })
    newBreederCount: number;

    /**
     * 승인된 브리더 수
     * @example 285
     */
    @ApiProperty({
        description: '승인된 브리더 수',
        example: 285,
    })
    approvedBreederCount: number;

    /**
     * 승인 대기 브리더 수
     * @example 45
     */
    @ApiProperty({
        description: '승인 대기 브리더 수',
        example: 45,
    })
    pendingBreederCount: number;
}

/**
 * 입양 통계 정보 DTO
 */
export class AdoptionStatsDto {
    /**
     * 총 입양 신청 수
     * @example 2480
     */
    @ApiProperty({
        description: '총 입양 신청 수',
        example: 2480,
    })
    totalApplicationCount: number;

    /**
     * 신규 입양 신청 수 (이번 달)
     * @example 156
     */
    @ApiProperty({
        description: '신규 입양 신청 수 (이번 달)',
        example: 156,
    })
    newApplicationCount: number;

    /**
     * 완료된 입양 수
     * @example 1870
     */
    @ApiProperty({
        description: '완료된 입양 수',
        example: 1870,
    })
    completedAdoptionCount: number;

    /**
     * 처리 대기 신청 수
     * @example 235
     */
    @ApiProperty({
        description: '처리 대기 신청 수',
        example: 235,
    })
    pendingApplicationCount: number;

    /**
     * 거절된 신청 수
     * @example 375
     */
    @ApiProperty({
        description: '거절된 신청 수',
        example: 375,
    })
    rejectedApplicationCount: number;
}

/**
 * 인기 품종 정보 DTO
 */
export class PopularBreedDto {
    /**
     * 품종명
     * @example "골든 리트리버"
     */
    @ApiProperty({
        description: '품종명',
        example: '골든 리트리버',
    })
    breedName: string;

    /**
     * 반려동물 종류
     * @example "dog"
     */
    @ApiProperty({
        description: '반려동물 종류',
        example: 'dog',
    })
    petType: string;

    /**
     * 입양 신청 수
     * @example 450
     */
    @ApiProperty({
        description: '입양 신청 수',
        example: 450,
    })
    applicationCount: number;

    /**
     * 완료된 입양 수
     * @example 320
     */
    @ApiProperty({
        description: '완료된 입양 수',
        example: 320,
    })
    completedAdoptionCount: number;

    /**
     * 평균 분양 가격 (원)
     * @example 1500000
     */
    @ApiProperty({
        description: '평균 분양 가격 (원)',
        example: 1500000,
    })
    averagePrice: number;
}

/**
 * 지역별 통계 정보 DTO
 */
export class RegionalStatsDto {
    /**
     * 도시명
     * @example "서울"
     */
    @ApiProperty({
        description: '도시명',
        example: '서울',
    })
    cityName: string;

    /**
     * 구/군명
     * @example "강남구"
     */
    @ApiProperty({
        description: '구/군명',
        example: '강남구',
    })
    districtName: string;

    /**
     * 지역 브리더 수
     * @example 45
     */
    @ApiProperty({
        description: '지역 브리더 수',
        example: 45,
    })
    breederCount: number;

    /**
     * 지역 입양 신청 수
     * @example 380
     */
    @ApiProperty({
        description: '지역 입양 신청 수',
        example: 380,
    })
    applicationCount: number;

    /**
     * 지역 완료된 입양 수
     * @example 285
     */
    @ApiProperty({
        description: '지역 완료된 입양 수',
        example: 285,
    })
    completedAdoptionCount: number;
}

/**
 * 브리더 성과 통계 DTO
 */
export class BreederPerformanceDto {
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
     * @example "김브리더"
     */
    @ApiProperty({
        description: '브리더 이름',
        example: '김브리더',
    })
    breederName: string;

    /**
     * 지역 (도시)
     * @example "서울"
     */
    @ApiProperty({
        description: '지역 (도시)',
        example: '서울',
    })
    cityName: string;

    /**
     * 받은 입양 신청 수
     * @example 95
     */
    @ApiProperty({
        description: '받은 입양 신청 수',
        example: 95,
    })
    applicationCount: number;

    /**
     * 완료된 입양 수
     * @example 72
     */
    @ApiProperty({
        description: '완료된 입양 수',
        example: 72,
    })
    completedAdoptionCount: number;

    /**
     * 평균 평점
     * @example 4.7
     */
    @ApiProperty({
        description: '평균 평점',
        example: 4.7,
    })
    averageRating: number;

    /**
     * 총 후기 수
     * @example 68
     */
    @ApiProperty({
        description: '총 후기 수',
        example: 68,
    })
    totalReviewCount: number;

    /**
     * 프로필 조회 수
     * @example 2450
     */
    @ApiProperty({
        description: '프로필 조회 수',
        example: 2450,
    })
    profileViewCount: number;
}

/**
 * 신고 통계 정보 DTO
 */
export class ReportStatsDto {
    /**
     * 총 신고 수
     * @example 125
     */
    @ApiProperty({
        description: '총 신고 수',
        example: 125,
    })
    totalReportCount: number;

    /**
     * 신규 신고 수 (이번 달)
     * @example 18
     */
    @ApiProperty({
        description: '신규 신고 수 (이번 달)',
        example: 18,
    })
    newReportCount: number;

    /**
     * 처리된 신고 수
     * @example 98
     */
    @ApiProperty({
        description: '처리된 신고 수',
        example: 98,
    })
    resolvedReportCount: number;

    /**
     * 처리 대기 신고 수
     * @example 15
     */
    @ApiProperty({
        description: '처리 대기 신고 수',
        example: 15,
    })
    pendingReportCount: number;

    /**
     * 기각된 신고 수
     * @example 12
     */
    @ApiProperty({
        description: '기각된 신고 수',
        example: 12,
    })
    dismissedReportCount: number;
}

/**
 * 관리자 통계 종합 응답 DTO
 * 관리자 대시보드에서 사용되는 종합적인 통계 정보를 제공합니다.
 */
export class AdminStatsResponseDto {
    /**
     * 사용자 통계 정보
     */
    @ApiProperty({
        description: '사용자 통계 정보',
        type: UserStatsDto,
    })
    userStatistics: UserStatsDto;

    /**
     * 입양 통계 정보
     */
    @ApiProperty({
        description: '입양 통계 정보',
        type: AdoptionStatsDto,
    })
    adoptionStatistics: AdoptionStatsDto;

    /**
     * 인기 품종 통계 (상위 10개)
     */
    @ApiProperty({
        description: '인기 품종 통계',
        type: [PopularBreedDto],
    })
    popularBreeds: PopularBreedDto[];

    /**
     * 지역별 통계 (상위 20개)
     */
    @ApiProperty({
        description: '지역별 통계',
        type: [RegionalStatsDto],
    })
    regionalStatistics: RegionalStatsDto[];

    /**
     * 브리더 성과 순위 (상위 50개)
     */
    @ApiProperty({
        description: '브리더 성과 순위',
        type: [BreederPerformanceDto],
    })
    breederPerformanceRanking: BreederPerformanceDto[];

    /**
     * 신고 통계 정보
     */
    @ApiProperty({
        description: '신고 통계 정보',
        type: ReportStatsDto,
    })
    reportStatistics: ReportStatsDto;
}
