export enum UserStatus {
    ACTIVE = 'active',
    SUSPENDED = 'suspended',
    DELETED = 'deleted',
}

export enum SocialProvider {
    LOCAL = 'local',
    GOOGLE = 'google',
    KAKAO = 'kakao',
    NAVER = 'naver',
    APPLE = 'apple',
}

export enum UserRole {
    ADOPTER = 'adopter',
    BREEDER = 'breeder',
}

export enum PetType {
    DOG = 'dog',
    CAT = 'cat',
}

export enum PetGender {
    MALE = 'male',
    FEMALE = 'female',
}

export enum ApplicationStatus {
    CONSULTATION_PENDING = 'consultation_pending',
    CONSULTATION_COMPLETED = 'consultation_completed',
    ADOPTION_APPROVED = 'adoption_approved',
    ADOPTION_REJECTED = 'adoption_rejected',
}

export enum ReviewType {
    CONSULTATION = 'consultation',
    ADOPTION = 'adoption',
}

export enum PetStatus {
    AVAILABLE = 'available',
    RESERVED = 'reserved',
    ADOPTED = 'adopted',
}

export enum VerificationStatus {
    PENDING = 'pending',
    REVIEWING = 'reviewing',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

export enum BreederPlan {
    BASIC = 'basic',
    PRO = 'pro',
}

/**
 * 브리더 레벨 열거형
 */
export enum BreederLevel {
    NEW = 'new', // 뉴 브리더
    ELITE = 'elite', // 엘리트 브리더
}

/**
 * 반려동물 크기 열거형 (강아지)
 */
export enum PetSize {
    SMALL = 'small', // 소형견
    MEDIUM = 'medium', // 중형견
    LARGE = 'large', // 대형견
}

/**
 * 반려동물 털 길이 열거형 (고양이)
 */
export enum FurLength {
    SHORT = 'short', // 단모종
    LONG = 'long', // 장모종
}

export enum ReportType {
    NO_CONTRACT = 'no_contract',
    FALSE_INFO = 'false_info',
    INAPPROPRIATE_CONTENT = 'inappropriate_content',
    OTHER = 'other',
}

export enum ReportStatus {
    PENDING = 'pending',
    REVIEWING = 'reviewing',
    RESOLVED = 'resolved',
    DISMISSED = 'dismissed',
}

export enum AdminLevel {
    SUPER_ADMIN = 'super_admin',
    BREEDER_ADMIN = 'breeder_admin',
    REPORT_ADMIN = 'report_admin',
    STATS_ADMIN = 'stats_admin',
}

export enum AdminAction {
    APPROVE_BREEDER = 'approve_breeder',
    REJECT_BREEDER = 'reject_breeder',
    SUSPEND_USER = 'suspend_user',
    ACTIVATE_USER = 'activate_user',
    RESOLVE_REPORT = 'resolve_report',
    DISMISS_REPORT = 'dismiss_report',
    DELETE_REVIEW = 'delete_review',
}

export enum AdminTargetType {
    BREEDER = 'breeder',
    ADOPTER = 'adopter',
    REPORT = 'report',
    REVIEW = 'review',
}

export enum FormFieldType {
    TEXT = 'text',
    TEXTAREA = 'textarea',
    SELECT = 'select',
    RADIO = 'radio',
    CHECKBOX = 'checkbox',
    FILE = 'file',
}

export enum StatsType {
    DAILY = 'daily',
    WEEKLY = 'weekly',
    MONTHLY = 'monthly',
}
