import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User } from './user.schema';

export type BreederDocument = Breeder & Document;

// SocialAuth는 User 스키마의 SocialAuthInfo로 대체됨

/**
 * 브리더 인증 서류 스키마
 */
@Schema({ _id: false })
export class VerificationDocument {
    /**
     * 서류 타입
     * - id_card: 신분증 사본 (필수 - 모든 레벨)
     * - animal_production_license: 동물생산업 등록증 (필수 - 모든 레벨)
     * - adoption_contract_sample: 표준 입양계약서 샘플 (엘리트 필수)
     * - association_document: 최근 발급한 협회 서류 (엘리트 필수)
     * - breeder_certification: 고양이 브리더 인증 서류 (엘리트 필수)
     * - tica_cfa_document: TICA 또는 CFA 서류 (엘리트 선택)
     */
    @Prop({
        required: true,
        enum: [
            'id_card',
            'animal_production_license',
            'adoption_contract_sample',
            'association_document',
            'breeder_certification',
            'tica_cfa_document',
        ],
    })
    type: string;

    @Prop({ required: true })
    url: string;

    @Prop({ default: Date.now })
    uploadedAt: Date;
}

/**
 * 브리더 인증 정보 스키마
 */
@Schema({ _id: false })
export class BreederVerification {
    /**
     * 인증 상태
     */
    @Prop({
        required: true,
        enum: ['pending', 'reviewing', 'approved', 'rejected'],
        default: 'pending',
    })
    status: string;

    /**
     * 구독 플랜
     */
    @Prop({
        required: true,
        enum: ['basic', 'pro'],
        default: 'basic',
    })
    plan: string;

    /**
     * 브리더 레벨 (new: 뉴, elite: 엘리트)
     */
    @Prop({
        required: true,
        enum: ['new', 'elite'],
        default: 'new',
    })
    level: string;

    @Prop()
    submittedAt?: Date;

    @Prop()
    reviewedAt?: Date;

    @Prop()
    rejectionReason?: string;

    /**
     * 제출된 인증 서류 배열
     */
    @Prop({ type: [VerificationDocument], default: [] })
    documents: VerificationDocument[];

    @Prop()
    submittedByEmail?: boolean;
}

/**
 * 브리더 프로필 상세 정보 스키마
 */
@Schema({ _id: false })
export class BreederProfile {
    /**
     * 브리더 소개글 (공백 포함 최대 1500자)
     */
    @Prop({ required: true, maxlength: 1500 })
    description: string;

    /**
     * 브리더 위치 정보
     */
    @Prop({
        type: {
            city: { type: String, required: true },
            district: { type: String, required: true },
            address: String,
        },
        required: true,
    })
    location: {
        city: string;
        district: string;
        address?: string;
    };

    /**
     * 브리더 대표 사진 URL 배열 (최대 3장 제한)
     */
    @Prop({ type: [String], validate: [arrayLimit, '{PATH} exceeds the limit of 3'], default: [] })
    representativePhotos: string[];

    /**
     * 전문 분야 (강아지, 고양이)
     */
    @Prop({ required: true, type: [String], enum: ['dog', 'cat'] })
    specialization: string[];

    /**
     * 브리딩 경력 (년)
     */
    @Prop()
    experienceYears?: number;
}

/**
 * 배열 길이 제한 함수 (최대 3개)
 */
function arrayLimit(val: string[]) {
    return val.length <= 3;
}

/**
 * 브리더 통계 정보 스키마 (자동 계산)
 */
@Schema({ _id: false })
export class BreederStats {
    /**
     * 총 받은 입양 신청 수
     */
    @Prop({ default: 0 })
    totalApplications: number;

    /**
     * 총 찜 수
     */
    @Prop({ default: 0 })
    totalFavorites: number;

    /**
     * 완료된 입양 건수
     */
    @Prop({ default: 0 })
    completedAdoptions: number;

    /**
     * 평균 평점
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

    /**
     * 분양 가격 범위 (availablePets 기반 자동 계산)
     */
    @Prop({
        type: {
            min: { type: Number, default: 0 },
            max: { type: Number, default: 0 },
        },
        default: { min: 0, max: 0 },
    })
    priceRange: {
        min: number;
        max: number;
    };

    /**
     * 통계 마지막 업데이트 일시
     */
    @Prop({ default: Date.now })
    lastUpdated: Date;
}

/**
 * 입양 신청 폼 필드 스키마
 */
@Schema({ _id: false })
export class ApplicationFormField {
    @Prop({ required: true })
    id: string;

    @Prop({ required: true, enum: ['text', 'textarea', 'select', 'radio', 'checkbox', 'file'] })
    type: string;

    @Prop({ required: true })
    label: string;

    @Prop({ required: true })
    required: boolean;

    @Prop([String])
    options?: string[];

    @Prop()
    placeholder?: string;

    @Prop({ required: true })
    order: number;
}

/**
 * 브리더 메인 스키마
 * User 스키마를 상속받아 브리더 전용 필드만 추가
 */
@Schema({
    timestamps: true,
    collection: 'breeders',
})
export class Breeder extends User {
    /**
     * 브리더명 (업체명/상호명) - User의 nickname과 별도
     */
    @Prop({ required: true })
    name: string;

    /**
     * 반려동물 타입 (강아지/고양이)
     */
    @Prop({ required: true, enum: ['dog', 'cat'] })
    petType: string;

    /**
     * 세부 품종명 (최대 5개)
     */
    @Prop({ type: [String], default: [] })
    breeds: string[];

    /**
     * 브리더 인증 정보
     */
    @Prop({ type: BreederVerification, required: true })
    verification: BreederVerification;

    /**
     * 브리더 프로필 상세 정보
     */
    @Prop({ type: BreederProfile, required: true })
    profile: BreederProfile;

    /**
     * 입양 신청 양식 설정
     */
    @Prop({ type: [ApplicationFormField], default: getDefaultApplicationForm })
    applicationForm: ApplicationFormField[];

    /**
     * 브리더 활동 통계
     */
    @Prop({ type: BreederStats, default: () => new BreederStats() })
    stats: BreederStats;
}

/**
 * 기본 입양 신청 양식
 */
function getDefaultApplicationForm(): ApplicationFormField[] {
    return [
        { id: 'name', type: 'text', label: '성함', required: true, order: 1 },
        { id: 'phone', type: 'text', label: '연락처', required: true, order: 2 },
        { id: 'address', type: 'textarea', label: '주소', required: true, order: 3 },
        { id: 'experience', type: 'textarea', label: '반려동물 경험', required: false, order: 4 },
        { id: 'reason', type: 'textarea', label: '입양 사유', required: true, order: 5 },
    ];
}

export const BreederSchema = SchemaFactory.createForClass(Breeder);

// 인덱스 설정
BreederSchema.index({ email: 1 }, { unique: true });
BreederSchema.index({ status: 1, 'verification.status': 1, 'stats.averageRating': -1 });
BreederSchema.index({ 'verification.status': 1, 'profile.location.city': 1, 'profile.location.district': 1 });
BreederSchema.index({ 'socialAuth.provider': 1, 'socialAuth.providerId': 1 });
