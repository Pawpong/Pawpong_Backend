import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BreederDocument = Breeder & Document;

@Schema({ _id: false })
export class SocialAuth {
    @Prop({ required: true, enum: ['local', 'google', 'kakao', 'apple'] })
    provider: string;

    @Prop()
    providerId?: string;

    @Prop()
    email?: string;
}

@Schema({ _id: false })
export class BreederVerification {
    @Prop({ required: true, enum: ['pending', 'reviewing', 'approved', 'rejected'], default: 'pending' })
    status: string;

    @Prop({ required: true, enum: ['basic', 'premium'], default: 'basic' })
    plan: string;

    @Prop()
    submittedAt?: Date;

    @Prop()
    reviewedAt?: Date;

    @Prop()
    rejectionReason?: string;

    @Prop([String])
    documents: string[];

    @Prop()
    submittedByEmail?: boolean;
}

@Schema({ _id: false })
export class BreederProfile {
    @Prop({ required: true })
    description: string;

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

    @Prop({ type: [String], validate: [arrayLimit, '{PATH} exceeds the limit of 3'] })
    photos: string[];

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

    @Prop({ required: true, type: [String], enum: ['dog', 'cat'] })
    specialization: string[];

    @Prop()
    experienceYears?: number;
}

function arrayLimit(val: string[]) {
    return val.length <= 3;
}

@Schema({ _id: false })
export class ParentPet {
    @Prop({ required: true })
    petId: string;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true, enum: ['dog', 'cat'] })
    type: string;

    @Prop({ required: true })
    breed: string;

    @Prop({ required: true })
    age: number;

    @Prop({ required: true, enum: ['male', 'female'] })
    gender: string;

    @Prop([String])
    photos: string[];

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
        vaccinated: boolean;
        neutered: boolean;
        healthChecked: boolean;
        healthIssues?: string;
    };

    @Prop({ default: true })
    isActive: boolean;
}

@Schema({ _id: false })
export class AvailablePet {
    @Prop({ required: true })
    petId: string;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true, enum: ['dog', 'cat'] })
    type: string;

    @Prop({ required: true })
    breed: string;

    @Prop({ required: true })
    birthDate: Date;

    @Prop({ required: true, enum: ['male', 'female'] })
    gender: string;

    @Prop([String])
    photos: string[];

    @Prop({ required: true })
    price: number;

    @Prop({ required: true, enum: ['available', 'reserved', 'adopted'], default: 'available' })
    status: string;

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
        vaccinated: boolean;
        neutered: boolean;
        healthChecked: boolean;
        healthIssues?: string;
    };

    @Prop({
        type: {
            mother: String,
            father: String,
        },
    })
    parentInfo?: {
        mother?: string;
        father?: string;
    };

    @Prop({ default: true })
    isActive: boolean;

    @Prop()
    adoptedAt?: Date;

    @Prop()
    reservedAt?: Date;
}

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

@Schema({ _id: false })
export class ReceivedApplication {
    @Prop({ required: true })
    applicationId: string;

    @Prop({ required: true })
    adopterId: string;

    @Prop({ required: true })
    adopterName: string;

    @Prop({ required: true })
    adopterEmail: string;

    @Prop({ required: true })
    petId: string;

    @Prop({ required: true })
    petName: string;

    @Prop({
        required: true,
        enum: ['consultation_pending', 'consultation_completed', 'adoption_approved', 'adoption_rejected'],
        default: 'consultation_pending',
    })
    status: string;

    @Prop({ required: true, type: Object })
    applicationData: Record<string, any>;

    @Prop({ default: Date.now })
    appliedAt: Date;

    @Prop()
    processedAt?: Date;

    @Prop()
    notes?: string;
}

@Schema({ _id: false })
export class BreederReview {
    @Prop({ required: true })
    reviewId: string;

    @Prop({ required: true })
    adopterId: string;

    @Prop({ required: true })
    adopterName: string;

    @Prop({ required: true })
    applicationId: string;

    @Prop({ required: true, enum: ['consultation', 'adoption'] })
    type: string;

    @Prop({ required: true, min: 1, max: 5 })
    rating: number;

    @Prop({ required: true })
    content: string;

    @Prop([String])
    photos: string[];

    @Prop({ default: Date.now })
    writtenAt: Date;

    @Prop({ default: true })
    isVisible: boolean;
}

@Schema({ _id: false })
export class BreederStats {
    @Prop({ default: 0 })
    totalApplications: number;

    @Prop({ default: 0 })
    completedAdoptions: number;

    @Prop({ default: 0 })
    averageRating: number;

    @Prop({ default: 0 })
    totalReviews: number;

    @Prop({ default: 0 })
    profileViews: number;

    @Prop({ default: Date.now })
    lastUpdated: Date;
}

@Schema({ _id: false })
export class BreederReport {
    @Prop({ required: true })
    reportId: string;

    @Prop({ required: true })
    reporterId: string;

    @Prop({ required: true })
    reporterName: string;

    @Prop({ required: true, enum: ['no_contract', 'false_info', 'inappropriate_content', 'other'] })
    type: string;

    @Prop({ required: true })
    description: string;

    @Prop({ default: Date.now })
    reportedAt: Date;

    @Prop({ required: true, enum: ['pending', 'reviewing', 'resolved', 'dismissed'], default: 'pending' })
    status: string;

    @Prop()
    adminNotes?: string;
}

@Schema({
    timestamps: true,
    collection: 'breeders',
})
export class Breeder {
    @Prop({ required: true })
    email: string;

    @Prop()
    password?: string;

    @Prop({ required: true })
    name: string;

    @Prop()
    phone?: string;

    @Prop()
    profileImage?: string;

    @Prop({ type: SocialAuth })
    socialAuth?: SocialAuth;

    @Prop({ default: 'active', enum: ['active', 'suspended', 'deleted'] })
    status: string;

    @Prop({ default: Date.now })
    lastLoginAt: Date;

    @Prop({ type: BreederVerification, required: true })
    verification: BreederVerification;

    @Prop({ type: BreederProfile })
    profile?: BreederProfile;

    @Prop([ParentPet])
    parentPets: ParentPet[];

    @Prop([AvailablePet])
    availablePets: AvailablePet[];

    @Prop({ type: [ApplicationFormField], default: getDefaultApplicationForm })
    applicationForm: ApplicationFormField[];

    @Prop([ReceivedApplication])
    receivedApplications: ReceivedApplication[];

    @Prop([BreederReview])
    reviews: BreederReview[];

    @Prop({ type: BreederStats, default: () => new BreederStats() })
    stats: BreederStats;

    @Prop([BreederReport])
    reports: BreederReport[];
}

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

// 1. 이메일 주소 - 유니크 인덱스 (로그인 및 사용자 조회용)
BreederSchema.index({ email: 1 }, { unique: true });

// 2. 브리더 검색 최적화 - 승인된 활성 브리더 조회
BreederSchema.index({ 
    status: 1, 
    'verification.status': 1, 
    'stats.averageRating': -1 
});

// 3. 지역별 브리더 검색 - 입양자의 주요 검색 패턴
BreederSchema.index({ 
    'verification.status': 1,
    'profile.location.city': 1, 
    'profile.location.district': 1,
    'stats.averageRating': -1
});

// 4. 반려동물 종류/품종별 검색 최적화
BreederSchema.index({ 
    'verification.status': 1,
    'availablePets.status': 1,
    'availablePets.type': 1, 
    'availablePets.breed': 1,
    'stats.averageRating': -1
});

// 5. 관리자 승인 대기 브리더 조회
BreederSchema.index({ 
    'verification.status': 1, 
    'verification.submittedAt': 1 
});

// 6. 소셜 로그인 사용자 조회
BreederSchema.index({ 
    'socialAuth.provider': 1, 
    'socialAuth.providerId': 1 
});

// 7. 받은 입양 신청 상태별 조회 - 브리더 대시보드용
BreederSchema.index({ 
    'receivedApplications.status': 1,
    'receivedApplications.appliedAt': -1 
});

// 8. 후기 조회 최적화 - 브리더별 공개 후기
BreederSchema.index({ 
    'reviews.isVisible': 1,
    'reviews.writtenAt': -1 
});

// 9. 인기 브리더 조회 - 평점 기반 정렬
BreederSchema.index({ 
    status: 1,
    'verification.status': 1,
    'stats.averageRating': -1, 
    'stats.totalReviews': -1 
});
