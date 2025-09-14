import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SystemStatsDocument = SystemStats & Document;

/**
 * 사용자 통계 스키마
 * 입양자와 브리더의 가입, 활동, 인증 등 전반적인 사용자 통계를 관리합니다.
 */
@Schema({ _id: false })
export class UserStats {
    /**
     * 총 입양자 수
     */
    @Prop({ default: 0 })
    totalAdopters: number;

    /**
     * 신규 입양자 수 (해당 기간 내)
     */
    @Prop({ default: 0 })
    newAdopters: number;

    /**
     * 활성 입양자 수 (최근 활동 기준)
     */
    @Prop({ default: 0 })
    activeAdopters: number;

    /**
     * 총 브리더 수
     */
    @Prop({ default: 0 })
    totalBreeders: number;

    /**
     * 신규 브리더 수 (해당 기간 내)
     */
    @Prop({ default: 0 })
    newBreeders: number;

    /**
     * 인증 완료 브리더 수
     */
    @Prop({ default: 0 })
    approvedBreeders: number;

    /**
     * 인증 대기 브리더 수
     */
    @Prop({ default: 0 })
    pendingBreeders: number;
}

/**
 * 입양 신청 및 완료 통계 스키마
 * 입양 신청 및 처리 현황을 종합적으로 추적합니다.
 */
@Schema({ _id: false })
export class AdoptionStats {
    /**
     * 총 입양 신청 수 (누적)
     */
    @Prop({ default: 0 })
    totalApplications: number;

    /**
     * 신규 입양 신청 수 (해당 기간 내)
     */
    @Prop({ default: 0 })
    newApplications: number;

    /**
     * 완료된 입양 건수
     */
    @Prop({ default: 0 })
    completedAdoptions: number;

    /**
     * 처리 대기 중인 신청 수
     */
    @Prop({ default: 0 })
    pendingApplications: number;

    /**
     * 거절된 신청 수
     */
    @Prop({ default: 0 })
    rejectedApplications: number;
}

/**
 * 인기 품종 통계 스키마
 * 반려동물 품종별 입양 수요와 가격 동향을 추적합니다.
 */
@Schema({ _id: false })
export class PopularBreed {
    /**
     * 품종명
     */
    @Prop({ required: true })
    breed: string;

    /**
     * 반려동물 종류 (dog: 강아지, cat: 고양이)
     */
    @Prop({ required: true, enum: ['dog', 'cat'] })
    type: string;

    /**
     * 해당 품종 입양 신청 수
     */
    @Prop({ default: 0 })
    applicationCount: number;

    /**
     * 해당 품종 입양 완료 수
     */
    @Prop({ default: 0 })
    completedAdoptionCount: number;

    /**
     * 해당 품종 평균 분양 가격 (원)
     */
    @Prop({ default: 0 })
    averagePrice: number;
}

/**
 * 지역별 통계 스키마
 * 지역별 브리더 및 입양 활동 현황을 추적합니다.
 */
@Schema({ _id: false })
export class RegionalStats {
    /**
     * 시/도
     */
    @Prop({ required: true })
    city: string;

    /**
     * 구/군
     */
    @Prop({ required: true })
    district: string;

    /**
     * 해당 지역 브리더 수
     */
    @Prop({ default: 0 })
    breederCount: number;

    /**
     * 해당 지역 입양 신청 수
     */
    @Prop({ default: 0 })
    applicationCount: number;

    /**
     * 해당 지역 입양 완료 수
     */
    @Prop({ default: 0 })
    completedAdoptionCount: number;
}

/**
 * 브리더 성과 통계 스키마
 * 개별 브리더의 성과 지표와 활동 통계를 추적합니다.
 */
@Schema({ _id: false })
export class BreederPerformance {
    /**
     * 브리더 고유 ID
     */
    @Prop({ required: true })
    breederId: string;

    /**
     * 브리더 이름/업체명
     */
    @Prop({ required: true })
    breederName: string;

    /**
     * 브리더 위치 (시/도)
     */
    @Prop({ required: true })
    city: string;

    /**
     * 받은 입양 신청 수
     */
    @Prop({ default: 0 })
    applicationCount: number;

    /**
     * 완료된 입양 건수
     */
    @Prop({ default: 0 })
    completedAdoptionCount: number;

    /**
     * 평균 후기 평점
     */
    @Prop({ default: 0 })
    averageRating: number;

    /**
     * 총 후기 수
     */
    @Prop({ default: 0 })
    totalReviews: number;

    /**
     * 프로필 조회 수
     */
    @Prop({ default: 0 })
    profileViews: number;
}

/**
 * 신고 처리 통계 스키마
 * 신고 접수, 처리, 해결 등 전반적인 신고 관리 현황을 추적합니다.
 */
@Schema({ _id: false })
export class ReportStats {
    /**
     * 총 신고 수 (누적)
     */
    @Prop({ default: 0 })
    totalReports: number;

    /**
     * 신규 신고 수 (해당 기간 내)
     */
    @Prop({ default: 0 })
    newReports: number;

    /**
     * 해결된 신고 수
     */
    @Prop({ default: 0 })
    resolvedReports: number;

    /**
     * 처리 대기 중인 신고 수
     */
    @Prop({ default: 0 })
    pendingReports: number;

    /**
     * 기각된 신고 수
     */
    @Prop({ default: 0 })
    dismissedReports: number;
}

/**
 * 시스템 전체 통계 메인 스키마
 * 사용자, 입양, 브리더, 신고 등 모든 도메인의 통계 데이터를 통합 관리합니다.
 */
@Schema({
    timestamps: true,
    collection: 'system_stats',
})
export class SystemStats {
    /**
     * 통계 기준 날짜 (YYYY-MM-DD 또는 YYYY-MM 또는 YYYY-WW 형식)
     */
    @Prop({ required: true })
    date: string;

    /**
     * 통계 유형 (daily: 일별, weekly: 주별, monthly: 월별)
     */
    @Prop({ required: true, enum: ['daily', 'weekly', 'monthly'], default: 'daily' })
    type: string;

    /**
     * 사용자 통계 (입양자 및 브리더)
     */
    @Prop({ type: UserStats, default: () => new UserStats() })
    userStats: UserStats;

    /**
     * 입양 신청 및 완료 통계
     */
    @Prop({ type: AdoptionStats, default: () => new AdoptionStats() })
    adoptionStats: AdoptionStats;

    /**
     * 인기 품종 통계 목록
     */
    @Prop([PopularBreed])
    popularBreeds: PopularBreed[];

    /**
     * 지역별 통계 목록
     */
    @Prop([RegionalStats])
    regionalStats: RegionalStats[];

    /**
     * 브리더 성과 랭킹 목록
     */
    @Prop([BreederPerformance])
    breederPerformance: BreederPerformance[];

    /**
     * 신고 처리 통계
     */
    @Prop({ type: ReportStats, default: () => new ReportStats() })
    reportStats: ReportStats;

    /**
     * 통계 계산 완료 일시
     */
    @Prop({ default: Date.now })
    calculatedAt: Date;
}

export const SystemStatsSchema = SchemaFactory.createForClass(SystemStats);

// MongoDB 인덱스 설정 - 통계 데이터 조회 및 최신 데이터 업데이트 성능 최적화

// 1. 날짜와 타입 복합 인덱스 - 유니크 제약으로 중복 방지
SystemStatsSchema.index({ date: 1, type: 1 }, { unique: true });

// 2. 타입별 최신 데이터 조회 - 대시보드 데이터 로드 최적화
SystemStatsSchema.index({ type: 1, createdAt: -1 });

// 3. 전체 최신 통계 조회 - 배치 작업 및 문제 해결용
SystemStatsSchema.index({ calculatedAt: -1 });
