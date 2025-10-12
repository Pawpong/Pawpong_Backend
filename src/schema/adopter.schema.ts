import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User } from './user.schema';

export type AdopterDocument = Adopter & Document;

/**
 * 입양 신청 정보 스키마 (camelCase)
 * 입양자가 제출한 입양 신청 내역을 저장합니다.
 */
@Schema({ _id: false })
export class AdoptionApplicationInfo {
    /**
     * 신청 고유 ID
     */
    @Prop({ required: true })
    applicationId: string;

    /**
     * 신청한 브리더 ID
     */
    @Prop({ required: true })
    targetBreederId: string;

    /**
     * 신청한 브리더 이름
     */
    @Prop({ required: true })
    targetBreederName: string;

    /**
     * 신청한 반려동물 ID
     */
    @Prop({ required: true })
    targetPetId: string;

    /**
     * 신청한 반려동물 이름
     */
    @Prop({ required: true })
    targetPetName: string;

    /**
     * 반려동물 종류 (dog, cat)
     */
    @Prop({ required: true, enum: ['dog', 'cat'] })
    petType: string;

    /**
     * 반려동물 품종
     */
    @Prop({ required: true })
    petBreedName: string;

    /**
     * 신청 폼 데이터 (JSON 형태)
     */
    @Prop({ required: true, type: Object })
    applicationFormData: Record<string, any>;

    /**
     * 신청 상태 (consultation_pending, consultation_completed, adoption_approved, adoption_rejected)
     */
    @Prop({
        required: true,
        enum: ['consultation_pending', 'consultation_completed', 'adoption_approved', 'adoption_rejected'],
        default: 'consultation_pending',
    })
    applicationStatus: string;

    /**
     * 신청 일시
     */
    @Prop({ required: true, default: Date.now })
    appliedAt: Date;

    /**
     * 상태 업데이트 일시
     */
    @Prop({ default: Date.now })
    updatedAt: Date;

    /**
     * 후기 작성 여부
     */
    @Prop({ default: false })
    isReviewWritten: boolean;
}

/**
 * 작성한 후기 정보 스키마 (camelCase)
 * 입양자가 작성한 브리더 후기를 저장합니다.
 */
@Schema({ _id: false })
export class WrittenReviewInfo {
    /**
     * 후기 고유 ID
     */
    @Prop({ required: true })
    reviewId: string;

    /**
     * 후기 대상 브리더 ID
     */
    @Prop({ required: true })
    targetBreederId: string;

    /**
     * 후기 대상 브리더 이름
     */
    @Prop({ required: true })
    targetBreederName: string;

    /**
     * 관련 입양 신청 ID
     */
    @Prop({ required: true })
    relatedApplicationId: string;

    /**
     * 후기 종류 (adoption_completed, experience_sharing)
     */
    @Prop({ required: true, enum: ['adoption_completed', 'experience_sharing'], default: 'adoption_completed' })
    reviewType: string;

    /**
     * 전체 평점 (1-5)
     */
    @Prop({ required: true, min: 1, max: 5 })
    overallRating: number;

    /**
     * 반려동물 건강 상태 평점 (1-5)
     */
    @Prop({ required: true, min: 1, max: 5 })
    petHealthRating: number;

    /**
     * 소통 능력 평점 (1-5)
     */
    @Prop({ required: true, min: 1, max: 5 })
    communicationRating: number;

    /**
     * 시설 환경 평점 (1-5)
     */
    @Prop({ min: 1, max: 5 })
    facilityRating?: number;

    /**
     * 후기 내용
     */
    @Prop({ required: true, maxlength: 1000 })
    reviewContent: string;

    /**
     * 후기 사진 URL 배열
     */
    @Prop({ type: [String], default: [] })
    reviewPhotoUrls: string[];

    /**
     * 후기 작성 일시
     */
    @Prop({ required: true, default: Date.now })
    createdAt: Date;

    /**
     * 후기 공개 여부
     */
    @Prop({ default: true })
    isVisible: boolean;
}

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
 * 입양자 메인 스키마 (camelCase)
 * User 스키마를 extends하여 공통 필드를 상속받고,
 * 입양자 전용 필드만 추가합니다.
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
     * 입양 신청 목록
     */
    @Prop({ type: [AdoptionApplicationInfo], default: [] })
    adoptionApplicationList: AdoptionApplicationInfo[];

    /**
     * 작성한 후기 목록
     */
    @Prop({ type: [WrittenReviewInfo], default: [] })
    writtenReviewList: WrittenReviewInfo[];

    /**
     * 즐겨찾기 브리더 목록
     */
    @Prop({ type: [FavoriteBreederInfo], default: [] })
    favoriteBreederList: FavoriteBreederInfo[];

    /**
     * 제출한 신고 목록
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
