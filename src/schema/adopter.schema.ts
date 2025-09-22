import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AdopterDocument = Adopter & Document;

/**
 * 소셜 인증 정보 스키마 (스네이크케이스)
 * 사용자의 소셜 로그인 연동 정보를 저장합니다.
 */
@Schema({ _id: false })
export class SocialAuthInfo {
    /**
     * 인증 제공자 (local, google, kakao, apple)
     */
    @Prop({ required: true, enum: ['local', 'google', 'kakao', 'apple'] })
    auth_provider: string;

    /**
     * 제공자 고유 ID
     */
    @Prop()
    provider_user_id?: string;

    /**
     * 제공자에서 받은 이메일
     */
    @Prop()
    provider_email?: string;
}

/**
 * 입양 신청 정보 스키마 (스네이크케이스)
 * 입양자가 제출한 입양 신청 내역을 저장합니다.
 */
@Schema({ _id: false })
export class AdoptionApplicationInfo {
    /**
     * 신청 고유 ID
     */
    @Prop({ required: true })
    application_id: string;

    /**
     * 신청한 브리더 ID
     */
    @Prop({ required: true })
    target_breeder_id: string;

    /**
     * 신청한 브리더 이름
     */
    @Prop({ required: true })
    target_breeder_name: string;

    /**
     * 신청한 반려동물 ID
     */
    @Prop({ required: true })
    target_pet_id: string;

    /**
     * 신청한 반려동물 이름
     */
    @Prop({ required: true })
    target_pet_name: string;

    /**
     * 반려동물 종류 (dog, cat)
     */
    @Prop({ required: true, enum: ['dog', 'cat'] })
    pet_type: string;

    /**
     * 반려동물 품종
     */
    @Prop({ required: true })
    pet_breed_name: string;

    /**
     * 신청 폼 데이터 (JSON 형태)
     */
    @Prop({ required: true, type: Object })
    application_form_data: Record<string, any>;

    /**
     * 신청 상태 (consultation_pending, consultation_completed, adoption_approved, adoption_rejected)
     */
    @Prop({
        required: true,
        enum: ['consultation_pending', 'consultation_completed', 'adoption_approved', 'adoption_rejected'],
        default: 'consultation_pending',
    })
    application_status: string;

    /**
     * 신청 일시
     */
    @Prop({ required: true, default: Date.now })
    applied_at: Date;

    /**
     * 상태 업데이트 일시
     */
    @Prop({ default: Date.now })
    updated_at: Date;

    /**
     * 후기 작성 여부
     */
    @Prop({ default: false })
    is_review_written: boolean;
}

/**
 * 작성한 후기 정보 스키마 (스네이크케이스)
 * 입양자가 작성한 브리더 후기를 저장합니다.
 */
@Schema({ _id: false })
export class WrittenReviewInfo {
    /**
     * 후기 고유 ID
     */
    @Prop({ required: true })
    review_id: string;

    /**
     * 후기 대상 브리더 ID
     */
    @Prop({ required: true })
    target_breeder_id: string;

    /**
     * 후기 대상 브리더 이름
     */
    @Prop({ required: true })
    target_breeder_name: string;

    /**
     * 관련 입양 신청 ID
     */
    @Prop({ required: true })
    related_application_id: string;

    /**
     * 후기 종류 (adoption_completed, experience_sharing)
     */
    @Prop({ required: true, enum: ['adoption_completed', 'experience_sharing'], default: 'adoption_completed' })
    review_type: string;

    /**
     * 전체 평점 (1-5)
     */
    @Prop({ required: true, min: 1, max: 5 })
    overall_rating: number;

    /**
     * 반려동물 건강 상태 평점 (1-5)
     */
    @Prop({ required: true, min: 1, max: 5 })
    pet_health_rating: number;

    /**
     * 소통 능력 평점 (1-5)
     */
    @Prop({ required: true, min: 1, max: 5 })
    communication_rating: number;

    /**
     * 시설 환경 평점 (1-5)
     */
    @Prop({ min: 1, max: 5 })
    facility_rating?: number;

    /**
     * 후기 내용
     */
    @Prop({ required: true, maxlength: 1000 })
    review_content: string;

    /**
     * 후기 사진 URL 배열
     */
    @Prop({ type: [String], default: [] })
    review_photo_urls: string[];

    /**
     * 후기 작성 일시
     */
    @Prop({ required: true, default: Date.now })
    created_at: Date;

    /**
     * 후기 공개 여부
     */
    @Prop({ default: true })
    is_visible: boolean;
}

/**
 * 즐겨찾기 브리더 정보 스키마 (스네이크케이스)
 * 입양자가 즐겨찾기한 브리더 정보를 저장합니다.
 */
@Schema({ _id: false })
export class FavoriteBreederInfo {
    /**
     * 즐겨찾기한 브리더 ID
     */
    @Prop({ required: true })
    favorite_breeder_id: string;

    /**
     * 브리더 이름
     */
    @Prop({ required: true })
    breeder_name: string;

    /**
     * 브리더 프로필 이미지 URL
     */
    @Prop()
    breeder_profile_image_url?: string;

    /**
     * 브리더 위치 (시/구)
     */
    @Prop()
    breeder_location: string;

    /**
     * 즐겨찾기 추가 일시
     */
    @Prop({ required: true, default: Date.now })
    added_at: Date;
}

/**
 * 신고 정보 스키마 (스네이크케이스)
 * 입양자가 제출한 신고 내역을 저장합니다.
 */
@Schema({ _id: false })
export class SubmittedReportInfo {
    /**
     * 신고 고유 ID
     */
    @Prop({ required: true })
    report_id: string;

    /**
     * 신고 대상 브리더 ID
     */
    @Prop({ required: true })
    reported_breeder_id: string;

    /**
     * 신고 사유 (no_contract, false_info, inappropriate_content, poor_conditions, fraud, other)
     */
    @Prop({
        required: true,
        enum: ['no_contract', 'false_info', 'inappropriate_content', 'poor_conditions', 'fraud', 'other'],
    })
    report_reason: string;

    /**
     * 신고 상세 내용
     */
    @Prop({ required: true, maxlength: 500 })
    report_description: string;

    /**
     * 증거 자료 URL 배열
     */
    @Prop({ type: [String], default: [] })
    evidence_urls: string[];

    /**
     * 신고 상태 (pending, reviewing, resolved, dismissed)
     */
    @Prop({ required: true, enum: ['pending', 'reviewing', 'resolved', 'dismissed'], default: 'pending' })
    report_status: string;

    /**
     * 신고 일시
     */
    @Prop({ required: true, default: Date.now })
    reported_at: Date;

    /**
     * 관리자 조치 내용
     */
    @Prop()
    admin_action?: string;

    /**
     * 처리 완료 일시
     */
    @Prop()
    resolved_at?: Date;
}

/**
 * 입양자 메인 스키마 (스네이크케이스)
 * 반려동물을 입양하려는 사용자의 정보와 활동 내역을 저장합니다.
 */
@Schema({
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'adopters',
})
export class Adopter {
    /**
     * 이메일 주소 (로그인 ID)
     */
    @Prop({ required: true, lowercase: true })
    email_address: string;

    /**
     * 해시된 비밀번호
     */
    @Prop({ required: true })
    password_hash: string;

    /**
     * 리프레시 토큰 (JWT 재발급용)
     */
    @Prop()
    refresh_token?: string;

    /**
     * 사용자 실명
     */
    @Prop({ required: true })
    full_name: string;

    /**
     * 연락처 전화번호
     */
    @Prop()
    phone_number?: string;

    /**
     * 프로필 이미지 URL
     */
    @Prop()
    profile_image_url?: string;

    /**
     * 관심 반려동물 타입 (강아지/고양이)
     */
    @Prop({ enum: ['dog', 'cat'] })
    interested_pet_type?: string;

    /**
     * 사용자 역할 (고정값: adopter)
     */
    @Prop({ required: true, enum: ['adopter'], default: 'adopter' })
    user_role: string;

    /**
     * 계정 상태 (active, suspended, deactivated)
     */
    @Prop({ required: true, enum: ['active', 'suspended', 'deactivated'], default: 'active' })
    account_status: string;

    /**
     * 소셜 인증 정보
     */
    @Prop({ type: SocialAuthInfo })
    social_auth_info?: SocialAuthInfo;

    /**
     * 입양 신청 내역 배열 (임베딩)
     */
    @Prop({ type: [AdoptionApplicationInfo], default: [] })
    adoption_application_list: AdoptionApplicationInfo[];

    /**
     * 작성한 후기 배열 (임베딩)
     */
    @Prop({ type: [WrittenReviewInfo], default: [] })
    written_review_list: WrittenReviewInfo[];

    /**
     * 즐겨찾기 브리더 배열 (임베딩)
     */
    @Prop({ type: [FavoriteBreederInfo], default: [] })
    favorite_breeder_list: FavoriteBreederInfo[];

    /**
     * 제출한 신고 배열 (임베딩)
     */
    @Prop({ type: [SubmittedReportInfo], default: [] })
    submitted_report_list: SubmittedReportInfo[];

    /**
     * 최근 활동 일시
     */
    @Prop({ default: Date.now })
    last_activity_at: Date;

    /**
     * 알림 설정 정보
     */
    @Prop({
        type: Object,
        default: {
            email_notifications: true,
            sms_notifications: false,
            marketing_notifications: false,
        },
    })
    notification_settings: {
        email_notifications: boolean;
        sms_notifications: boolean;
        marketing_notifications: boolean;
    };
}

export const AdopterSchema = SchemaFactory.createForClass(Adopter);

// MongoDB 모범사례에 따른 효율적인 인덱스 설정
// 1. 이메일 주소 - 유니크 인덱스 (로그인 및 사용자 조회용)
AdopterSchema.index({ email_address: 1 }, { unique: true });

// 2. 계정 상태별 조회 - 관리자 대시보드용
AdopterSchema.index({ account_status: 1, created_at: -1 });

// 3. 활성 사용자 최근 활동 조회 - 사용자 분석용
AdopterSchema.index({ account_status: 1, last_activity_at: -1 });

// 4. 입양 신청 관련 복합 인덱스 - 신청 내역 조회 최적화
AdopterSchema.index({
    'adoption_application_list.target_breeder_id': 1,
    'adoption_application_list.application_status': 1,
    'adoption_application_list.applied_at': -1,
});

// 5. 즐겨찾기 브리더 조회 최적화
AdopterSchema.index({ 'favorite_breeder_list.favorite_breeder_id': 1 });

// 6. 후기 작성자별 조회 - 브리더가 받은 후기 조회용
AdopterSchema.index({
    'written_review_list.target_breeder_id': 1,
    'written_review_list.is_visible': 1,
    'written_review_list.created_at': -1,
});
