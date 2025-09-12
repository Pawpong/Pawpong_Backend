export enum UserStatus {
    ACTIVE = 'active',
    SUSPENDED = 'suspended',
    DELETED = 'deleted',
}

export enum SocialProvider {
    LOCAL = 'local',
    GOOGLE = 'google',
    KAKAO = 'kakao',
    APPLE = 'apple',
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
    PREMIUM = 'premium',
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
