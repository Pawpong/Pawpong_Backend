import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { 
    SocialProvider, 
    UserStatus, 
    VerificationStatus, 
    BreederPlan, 
    BreederLevel,
    PetType,
    PetGender,
    PetSize,
    FurLength,
    PetStatus,
    ApplicationStatus,
    ReviewType
} from '../common/enum/user.enum';

export type BreederDocument = Breeder & Document;

/**
 * 소셜 로그인 인증 정보 스키마
 * 브리더의 소셜 로그인 연동 정보를 저장합니다.
 */
@Schema({ _id: false })
export class SocialAuth {
    /**
     * 인증 제공자 (local, google, kakao, apple)
     */
    @Prop({ required: true, enum: ['local', 'google', 'kakao', 'apple'] })
    provider: string;

    /**
     * 제공자 고유 ID
     */
    @Prop()
    providerId?: string;

    /**
     * 제공자에서 받은 이메일
     */
    @Prop()
    email?: string;
}

/**
 * 브리더 인증 정보 스키마
 * 브리더의 신원 확인 및 인증 상태를 관리합니다.
 */
@Schema({ _id: false })
export class BreederVerification {
    /**
     * 인증 상태 (pending: 대기, reviewing: 검토중, approved: 승인, rejected: 거절)
     */
    @Prop({ required: true, enum: ['pending', 'reviewing', 'approved', 'rejected'], default: 'pending' })
    status: string;

    /**
     * 구독 플랜 (basic: 기본, premium: 프리미엄)
     */
    @Prop({ required: true, enum: ['basic', 'premium'], default: 'basic' })
    plan: string;

    /**
     * 브리더 레벨 (new: 뉴, elite: 엘리트)
     */
    @Prop({ required: true, enum: ['new', 'elite'], default: 'new' })
    level: string;

    /**
     * 인증 신청 제출 일시
     */
    @Prop()
    submittedAt?: Date;

    /**
     * 관리자 검토 완료 일시
     */
    @Prop()
    reviewedAt?: Date;

    /**
     * 거절 사유
     */
    @Prop()
    rejectionReason?: string;

    /**
     * 제출된 인증 서류 URL 배열
     */
    @Prop([String])
    documents: string[];

    /**
     * 이메일 제출 여부
     */
    @Prop()
    submittedByEmail?: boolean;
}

/**
 * 브리더 프로필 상세 정보 스키마
 * 브리더의 소개, 위치, 전문 분야 등 프로필 정보를 저장합니다.
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
    @Prop({ type: [String], validate: [arrayLimit, '{PATH} exceeds the limit of 3'] })
    representativePhotos: string[];

    /**
     * 분양 가격 범위
     */
    @Prop({
        type: {
            min: { type: Number, required: true },
            max: { type: Number, required: true },
        },
        required: true,
    })
    priceRange: {
        min: number;
        max: number;
    };

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
 * 부모견/부모묘 정보 스키마
 * 브리더가 보유한 종견/종묘의 정보를 저장합니다.
 */
@Schema({ _id: false })
export class ParentPet {
    /**
     * 부모견/부모묘 고유 ID
     */
    @Prop({ required: true })
    petId: string;

    /**
     * 부모견/부모묘 이름
     */
    @Prop({ required: true })
    name: string;

    /**
     * 반려동물 종류 (dog: 강아지, cat: 고양이)
     */
    @Prop({ required: true, enum: ['dog', 'cat'] })
    type: string;

    /**
     * 품종명
     */
    @Prop({ required: true })
    breed: string;

    /**
     * 나이 (년)
     */
    @Prop({ required: true })
    age: number;

    /**
     * 성별 (male: 수컷, female: 암컷)
     */
    @Prop({ required: true, enum: ['male', 'female'] })
    gender: string;

    /**
     * 부모견/부모묘 사진 URL 배열
     */
    @Prop([String])
    photos: string[];

    /**
     * 건강 정보
     */
    @Prop({
        type: {
            vaccinated: { type: Boolean, default: false },
            neutered: { type: Boolean, default: false },
            healthChecked: { type: Boolean, default: false },
            healthIssues: String,
        },
        required: true,
    })
    healthInfo: {
        vaccinated: boolean; // 백신 접종 여부
        neutered: boolean; // 중성화 수술 여부
        healthChecked: boolean; // 건강검진 여부
        healthIssues?: string; // 건강상 문제점
    };

    /**
     * 활성 상태 여부 (삭제된 항목은 false)
     */
    @Prop({ default: true })
    isActive: boolean;
}

/**
 * 분양 가능한 반려동물 정보 스키마
 * 입양자들이 신청할 수 있는 분양 개체의 정보를 저장합니다.
 */
@Schema({ _id: false })
export class AvailablePet {
    /**
     * 분양 개체 고유 ID
     */
    @Prop({ required: true })
    petId: string;

    /**
     * 분양 개체 이름
     */
    @Prop({ required: true })
    name: string;

    /**
     * 반려동물 종류 (dog: 강아지, cat: 고양이)
     */
    @Prop({ required: true, enum: ['dog', 'cat'] })
    type: string;

    /**
     * 품종명
     */
    @Prop({ required: true })
    breed: string;

    /**
     * 강아지 크기 (소형/중형/대형)
     */
    @Prop({ enum: ['small', 'medium', 'large'] })
    size?: string;

    /**
     * 고양이 털 길이 (단모/장모)
     */
    @Prop({ enum: ['short', 'long'] })
    furLength?: string;

    /**
     * 출생일
     */
    @Prop({ required: true })
    birthDate: Date;

    /**
     * 성별 (male: 수컷, female: 암컷)
     */
    @Prop({ required: true, enum: ['male', 'female'] })
    gender: string;

    /**
     * 분양 개체 사진 URL 배열
     */
    @Prop([String])
    photos: string[];

    /**
     * 분양 가격 (원)
     */
    @Prop({ required: true })
    price: number;

    /**
     * 분양 상태 (available: 분양가능, reserved: 예약됨, adopted: 분양완료)
     */
    @Prop({ required: true, enum: ['available', 'reserved', 'adopted'], default: 'available' })
    status: string;

    /**
     * 건강 정보
     */
    @Prop({
        type: {
            vaccinated: { type: Boolean, default: false },
            neutered: { type: Boolean, default: false },
            healthChecked: { type: Boolean, default: false },
            healthIssues: String,
        },
        required: true,
    })
    healthInfo: {
        vaccinated: boolean; // 백신 접종 여부
        neutered: boolean; // 중성화 수술 여부
        healthChecked: boolean; // 건강검진 여부
        healthIssues?: string; // 건강상 문제점
    };

    /**
     * 부모견/부모묘 정보
     */
    @Prop({
        type: {
            mother: String,
            father: String,
        },
    })
    parentInfo?: {
        mother?: string; // 어미 ID
        father?: string; // 아비 ID
    };

    /**
     * 활성 상태 여부 (삭제된 항목은 false)
     */
    @Prop({ default: true })
    isActive: boolean;

    /**
     * 분양 완료 일시
     */
    @Prop()
    adoptedAt?: Date;

    /**
     * 예약 일시
     */
    @Prop()
    reservedAt?: Date;
}

/**
 * 입양 신청 폼 필드 스키마
 * 브리더가 설정한 입양 신청 양식의 필드 정보를 저장합니다.
 */
@Schema({ _id: false })
export class ApplicationFormField {
    /**
     * 필드 고유 ID
     */
    @Prop({ required: true })
    id: string;

    /**
     * 필드 타입 (text: 텍스트, textarea: 긴글, select: 선택, radio: 단일선택, checkbox: 체크박스, file: 파일)
     */
    @Prop({ required: true, enum: ['text', 'textarea', 'select', 'radio', 'checkbox', 'file'] })
    type: string;

    /**
     * 필드 라벨 (화면에 표시되는 이름)
     */
    @Prop({ required: true })
    label: string;

    /**
     * 필수 입력 여부
     */
    @Prop({ required: true })
    required: boolean;

    /**
     * 선택 옵션 배열 (select, radio 타입에서 사용)
     */
    @Prop([String])
    options?: string[];

    /**
     * 플레이스홀더 텍스트
     */
    @Prop()
    placeholder?: string;

    /**
     * 필드 표시 순서
     */
    @Prop({ required: true })
    order: number;
}

/**
 * 브리더가 받은 입양 신청 정보 스키마
 * 입양자들로부터 받은 입양 신청 내역을 저장합니다.
 */
@Schema({ _id: false })
export class ReceivedApplication {
    /**
     * 입양 신청 고유 ID
     */
    @Prop({ required: true })
    applicationId: string;

    /**
     * 신청자 (입양자) ID
     */
    @Prop({ required: true })
    adopterId: string;

    /**
     * 신청자 이름
     */
    @Prop({ required: true })
    adopterName: string;

    /**
     * 신청자 이메일
     */
    @Prop({ required: true })
    adopterEmail: string;

    /**
     * 신청 대상 반려동물 ID
     */
    @Prop({ required: true })
    petId: string;

    /**
     * 신청 대상 반려동물 이름
     */
    @Prop({ required: true })
    petName: string;

    /**
     * 신청 처리 상태 (consultation_pending: 상담대기, consultation_completed: 상담완료, adoption_approved: 입양승인, adoption_rejected: 입양거절)
     */
    @Prop({
        required: true,
        enum: ['consultation_pending', 'consultation_completed', 'adoption_approved', 'adoption_rejected'],
        default: 'consultation_pending',
    })
    status: string;

    /**
     * 입양 신청 폼 응답 데이터
     */
    @Prop({ required: true, type: Object })
    applicationData: Record<string, any>;

    /**
     * 신청 접수 일시
     */
    @Prop({ default: Date.now })
    appliedAt: Date;

    /**
     * 브리더 처리 완료 일시
     */
    @Prop()
    processedAt?: Date;

    /**
     * 브리더 처리 메모
     */
    @Prop()
    notes?: string;
}

/**
 * 브리더가 받은 후기 정보 스키마
 * 입양자들이 작성한 브리더 후기를 저장합니다.
 */
@Schema({ _id: false })
export class BreederReview {
    /**
     * 후기 고유 ID
     */
    @Prop({ required: true })
    reviewId: string;

    /**
     * 후기 작성자 (입양자) ID
     */
    @Prop({ required: true })
    adopterId: string;

    /**
     * 후기 작성자 이름
     */
    @Prop({ required: true })
    adopterName: string;

    /**
     * 관련 입양 신청 ID
     */
    @Prop({ required: true })
    applicationId: string;

    /**
     * 후기 유형 (consultation: 상담후기, adoption: 입양완료후기)
     */
    @Prop({ required: true, enum: ['consultation', 'adoption'] })
    type: string;

    /**
     * 평점 (1-5점)
     */
    @Prop({ required: true, min: 1, max: 5 })
    rating: number;

    /**
     * 후기 내용
     */
    @Prop({ required: true })
    content: string;

    /**
     * 후기 사진 URL 배열
     */
    @Prop([String])
    photos: string[];

    /**
     * 후기 작성 일시
     */
    @Prop({ default: Date.now })
    writtenAt: Date;

    /**
     * 공개 여부
     */
    @Prop({ default: true })
    isVisible: boolean;
}

/**
 * 브리더 통계 정보 스키마
 * 브리더의 활동 통계 및 성과 지표를 저장합니다.
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
     * 통계 마지막 업데이트 일시
     */
    @Prop({ default: Date.now })
    lastUpdated: Date;
}

/**
 * 브리더에게 접수된 신고 정보 스키마
 * 입양자들이 브리더에 대해 제출한 신고 내역을 저장합니다.
 */
@Schema({ _id: false })
export class BreederReport {
    /**
     * 신고 고유 ID
     */
    @Prop({ required: true })
    reportId: string;

    /**
     * 신고자 ID
     */
    @Prop({ required: true })
    reporterId: string;

    /**
     * 신고자 이름
     */
    @Prop({ required: true })
    reporterName: string;

    /**
     * 신고 유형 (no_contract: 계약불이행, false_info: 허위정보, inappropriate_content: 부적절한내용, other: 기타)
     */
    @Prop({ required: true, enum: ['no_contract', 'false_info', 'inappropriate_content', 'other'] })
    type: string;

    /**
     * 신고 상세 내용
     */
    @Prop({ required: true })
    description: string;

    /**
     * 신고 접수 일시
     */
    @Prop({ default: Date.now })
    reportedAt: Date;

    /**
     * 신고 처리 상태 (pending: 대기, reviewing: 검토중, resolved: 해결완료, dismissed: 기각)
     */
    @Prop({ required: true, enum: ['pending', 'reviewing', 'resolved', 'dismissed'], default: 'pending' })
    status: string;

    /**
     * 관리자 처리 메모
     */
    @Prop()
    adminNotes?: string;
}

/**
 * 브리더 메인 스키마
 * 반려동물 브리더의 모든 정보와 활동 내역을 저장하는 중심 컬렉션입니다.
 */
@Schema({
    timestamps: true,
    collection: 'breeders',
})
export class Breeder {
    /**
     * 이메일 주소 (로그인 ID)
     */
    @Prop({ required: true })
    email: string;

    /**
     * 해시된 비밀번호 (소셜 로그인 사용자는 선택사항)
     */
    @Prop()
    password?: string;

    /**
     * 리프레시 토큰 (JWT 재발급용)
     */
    @Prop()
    refreshToken?: string;

    /**
     * 브리더 이름/업체명
     */
    @Prop({ required: true })
    name: string;

    /**
     * 연락처 전화번호
     */
    @Prop()
    phone?: string;

    /**
     * 프로필 이미지 URL
     */
    @Prop()
    profileImage?: string;

    /**
     * 반려동물 타입 (강아지/고양이)
     */
    @Prop({ enum: ['dog', 'cat'] })
    petType?: string;

    /**
     * 세부 품종명 (최대 5개)
     */
    @Prop({ type: [String] })
    detailBreed?: string[];

    /**
     * 브리더명(상호명)
     */
    @Prop()
    breederName?: string;

    /**
     * 브리더 소개
     */
    @Prop()
    introduction?: string;

    /**
     * 브리더 레벨
     */
    @Prop({ enum: ['level1', 'level2', 'level3'] })
    breederLevel?: string;

    /**
     * 브리더 프로필 사진 URL
     */
    @Prop()
    breederProfilePhoto?: string;

    /**
     * 브리더 위치 정보
     */
    @Prop({
        type: {
            city: String,
            district: String,
        },
    })
    location?: {
        city?: string;
        district?: string;
    };

    /**
     * 입양비 노출 설정 (range: 범위 노출, consultation: 상담 후 공개)
     */
    @Prop({ required: true, enum: ['range', 'consultation'], default: 'range' })
    priceDisplay: string;

    /**
     * 입양비 범위 (최소-최대)
     */
    @Prop({ 
        type: {
            min: { type: Number, required: true },
            max: { type: Number, required: true }
        }
    })
    priceRange: {
        min: number;
        max: number;
    };

    /**
     * 소셜 로그인 정보
     */
    @Prop({ type: SocialAuth })
    socialAuth?: SocialAuth;

    /**
     * 계정 상태 (active: 활성, suspended: 정지, deleted: 삭제)
     */
    @Prop({ default: 'active', enum: ['active', 'suspended', 'deleted'] })
    status: string;

    /**
     * 마지막 로그인 일시
     */
    @Prop({ default: Date.now })
    lastLoginAt: Date;

    /**
     * 마케팅 정보 수신 동의 여부
     */
    @Prop({ default: false })
    marketingAgreed: boolean;

    /**
     * 브리더 인증 정보 (필수)
     */
    @Prop({ type: BreederVerification, required: true })
    verification: BreederVerification;

    /**
     * 브리더 프로필 상세 정보
     */
    @Prop({ type: BreederProfile })
    profile?: BreederProfile;

    /**
     * 부모견/부모묘 목록
     */
    @Prop([ParentPet])
    parentPets: ParentPet[];

    /**
     * 분양 가능한 반려동물 목록
     */
    @Prop([AvailablePet])
    availablePets: AvailablePet[];

    /**
     * 입양 신청 양식 설정
     */
    @Prop({ type: [ApplicationFormField], default: getDefaultApplicationForm })
    applicationForm: ApplicationFormField[];

    /**
     * 받은 입양 신청 목록
     */
    @Prop([ReceivedApplication])
    receivedApplications: ReceivedApplication[];

    /**
     * 받은 후기 목록
     */
    @Prop([BreederReview])
    reviews: BreederReview[];

    /**
     * 브리더 활동 통계
     */
    @Prop({ type: BreederStats, default: () => new BreederStats() })
    stats: BreederStats;

    /**
     * 접수된 신고 목록
     */
    @Prop([BreederReport])
    reports: BreederReport[];
}

/**
 * 기본 입양 신청 양식 생성 함수
 * 새로 가입한 브리더에게 제공되는 기본 신청 양식을 정의합니다.
 *
 * @returns 기본 입양 신청 폼 필드 배열
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

// MongoDB 모범사례에 따른 효율적인 복합 인덱스 설정
// 브리더 검색 및 조회 성능 최적화를 위한 인덱스 전략

// 1. 이메일 주소 - 유니크 인덱스 (로그인 및 사용자 조회용)
BreederSchema.index({ email: 1 }, { unique: true });

// 2. 브리더 검색 최적화 - 승인된 활성 브리더 조회
// 입양자가 브리더 목록을 조회할 때 사용되는 핵심 인덱스
BreederSchema.index({
    status: 1,
    'verification.status': 1,
    'stats.averageRating': -1,
});

// 3. 지역별 브리더 검색 - 입양자의 주요 검색 패턴
// 위치 기반 브리더 검색 쿼리 최적화
BreederSchema.index({
    'verification.status': 1,
    'profile.location.city': 1,
    'profile.location.district': 1,
    'stats.averageRating': -1,
});

// 4. 반려동물 종류/품종별 검색 최적화
// 특정 품종의 브리더를 찾는 검색 쿼리 최적화
BreederSchema.index({
    'verification.status': 1,
    'availablePets.status': 1,
    'availablePets.type': 1,
    'availablePets.breed': 1,
    'stats.averageRating': -1,
});

// 5. 관리자 승인 대기 브리더 조회
// 관리자 대시보드에서 인증 대기 목록 조회 최적화
BreederSchema.index({
    'verification.status': 1,
    'verification.submittedAt': 1,
});

// 6. 소셜 로그인 사용자 조회
// 소셜 로그인 연동 사용자 식별 및 중복 가입 방지
BreederSchema.index({
    'socialAuth.provider': 1,
    'socialAuth.providerId': 1,
});

// 7. 받은 입양 신청 상태별 조회 - 브리더 대시보드용
// 브리더가 받은 신청을 상태별로 조회하고 최신순 정렬
BreederSchema.index({
    'receivedApplications.status': 1,
    'receivedApplications.appliedAt': -1,
});

// 8. 후기 조회 최적화 - 브리더별 공개 후기
// 브리더 프로필 페이지에서 공개된 후기만 최신순으로 조회
BreederSchema.index({
    'reviews.isVisible': 1,
    'reviews.writtenAt': -1,
});

// 9. 인기 브리더 조회 - 평점 기반 정렬
// 평점이 높고 후기가 많은 인기 브리더 목록 조회 최적화
BreederSchema.index({
    status: 1,
    'verification.status': 1,
    'stats.averageRating': -1,
    'stats.totalReviews': -1,
});
