import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User } from './user.schema';

export type AdopterDocument = Adopter & Document;

/**
 * ❌ 제거됨: AdoptionApplicationInfo
 * 이유: AdoptionApplication 별도 컬렉션에서 참조 방식으로 관리
 * 조회: AdoptionApplication.find({ adopterId })
 */

/**
 * ❌ 제거됨: WrittenReviewInfo
 * 이유: BreederReview 별도 컬렉션에서 참조 방식으로 관리
 * 조회: BreederReview.find({ adopterId })
 */

/**
 * 즐겨찾기 브리더 정보 스키마 (camelCase)
 * 입양자가 즐겨찾기한 브리더 정보를 저장합니다.
 */
@Schema({ _id: false })
export class FavoriteBreederInfo {
    /**
     * 즐겨찾기한 브리더 ID
     */
    @Prop({ required: true })
    favoriteBreederId: string;

    /**
     * 브리더 이름
     */
    @Prop({ required: true })
    breederName: string;

    /**
     * 브리더 프로필 이미지 URL
     */
    @Prop()
    breederProfileImageUrl?: string;

    /**
     * 브리더 위치 (시/구)
     */
    @Prop()
    breederLocation: string;

    /**
     * 즐겨찾기 추가 일시
     */
    @Prop({ required: true, default: Date.now })
    addedAt: Date;
}

/**
 * 신고 정보 스키마 (camelCase)
 * 입양자가 제출한 신고 내역을 저장합니다.
 */
@Schema({ _id: false })
export class SubmittedReportInfo {
    /**
     * 신고 고유 ID
     */
    @Prop({ required: true })
    reportId: string;

    /**
     * 신고 대상 브리더 ID
     */
    @Prop({ required: true })
    reportedBreederId: string;

    /**
     * 신고 사유 (no_contract, false_info, inappropriate_content, poor_conditions, fraud, other)
     */
    @Prop({
        required: true,
        enum: ['no_contract', 'false_info', 'inappropriate_content', 'poor_conditions', 'fraud', 'other'],
    })
    reportReason: string;

    /**
     * 신고 상세 내용
     */
    @Prop({ required: true, maxlength: 500 })
    reportDescription: string;

    /**
     * 증거 자료 URL 배열
     */
    @Prop({ type: [String], default: [] })
    evidenceUrls: string[];

    /**
     * 신고 상태 (pending, reviewing, resolved, dismissed)
     */
    @Prop({ required: true, enum: ['pending', 'reviewing', 'resolved', 'dismissed'], default: 'pending' })
    reportStatus: string;

    /**
     * 신고 일시
     */
    @Prop({ required: true, default: Date.now })
    reportedAt: Date;

    /**
     * 관리자 조치 내용
     */
    @Prop()
    adminAction?: string;

    /**
     * 처리 완료 일시
     */
    @Prop()
    resolvedAt?: Date;
}

/**
 * 알림 설정 스키마 (camelCase)
 */
@Schema({ _id: false })
export class NotificationSettings {
    /**
     * 이메일 알림 수신 여부
     */
    @Prop({ default: true })
    emailNotifications: boolean;

    /**
     * 푸시 알림 수신 여부
     */
    @Prop({ default: true })
    pushNotifications: boolean;

    /**
     * 입양 신청 상태 변경 알림
     */
    @Prop({ default: true })
    applicationStatusNotifications: boolean;

    /**
     * 즐겨찾기 브리더 업데이트 알림
     */
    @Prop({ default: true })
    favoriteBreederNotifications: boolean;
}

/**
 * 입양자 메인 스키마 (참조 방식으로 재설계)
 *
 * User 스키마를 extends하여 공통 필드를 상속받고,
 * 입양자 전용 필드만 추가합니다.
 *
 * 설계 원칙:
 * - 자주 변경되는 데이터는 별도 컬렉션에서 참조 (신청, 후기)
 * - 조회 성능이 중요한 데이터만 임베디드 (즐겨찾기)
 * - 단일 진실 공급원(Single Source of Truth) 원칙
 */
@Schema({
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    collection: 'adopters',
})
export class Adopter extends User {
    /**
     * 관심 반려동물 타입 (강아지/고양이)
     */
    @Prop({ enum: ['dog', 'cat'] })
    interestedPetType?: string;

    /**
     * 관심 품종 목록
     */
    @Prop({ type: [String], default: [] })
    interestedBreeds: string[];

    /**
     * 희망 입양 지역
     */
    @Prop()
    preferredLocation?: string;

    /**
     * ❌ 제거: adoptionApplicationList
     * 대체: AdoptionApplication 컬렉션에서 참조
     * 조회: AdoptionApplication.find({ adopterId })
     */

    /**
     * ❌ 제거: writtenReviewList
     * 대체: BreederReview 컬렉션에서 참조
     * 조회: BreederReview.find({ adopterId })
     */

    /**
     * 즐겨찾기 브리더 목록 (임베디드 유지)
     * 이유: 조회 빈도가 높고, 브리더 기본 정보 캐싱으로 성능 최적화
     */
    @Prop({ type: [FavoriteBreederInfo], default: [] })
    favoriteBreederList: FavoriteBreederInfo[];

    /**
     * 제출한 신고 목록 (임베디드 유지)
     * 이유: 입양자별 신고 내역 조회 빈도가 높고, 관리 편의성
     */
    @Prop({ type: [SubmittedReportInfo], default: [] })
    submittedReportList: SubmittedReportInfo[];

    /**
     * 알림 설정
     */
    @Prop({ type: NotificationSettings, default: () => ({}) })
    notificationSettings: NotificationSettings;
}

export const AdopterSchema = SchemaFactory.createForClass(Adopter);

// MongoDB 모범사례에 따른 효율적인 인덱스 설정
// 1. 이메일 주소 - 유니크 인덱스 (로그인 및 사용자 조회용)
AdopterSchema.index({ emailAddress: 1 }, { unique: true });

// 2. 닉네임 - 유니크 인덱스 (중복 방지)
AdopterSchema.index({ nickname: 1 }, { unique: true });

// 3. 계정 상태 - 일반 인덱스 (활성/정지 계정 필터링용)
AdopterSchema.index({ accountStatus: 1 });

// 4. 소셜 인증 정보 - 복합 인덱스 (소셜 로그인 사용자 조회용)
AdopterSchema.index({ 'socialAuthInfo.authProvider': 1, 'socialAuthInfo.providerUserId': 1 });

// 5. 생성일 - 일반 인덱스 (최신 가입자 조회용)
AdopterSchema.index({ createdAt: -1 });
