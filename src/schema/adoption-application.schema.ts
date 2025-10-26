import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AdoptionApplicationDocument = AdoptionApplication & Document;

/**
 * 입양 신청 상세 정보 (Figma 디자인 기반)
 *
 * 신청 폼의 모든 필드를 명시적으로 정의합니다.
 */
@Schema({ _id: false })
export class ApplicationFormData {
    /**
     * 개인정보 수집 및 이용 동의 여부
     */
    @Prop({ required: true })
    privacyConsent: boolean;

    /**
     * 자기소개 (최대 1500자)
     * 성별, 연령대, 거주지, 결혼 계획, 생활 패턴 등
     */
    @Prop({ required: true, maxlength: 1500 })
    selfIntroduction: string;

    /**
     * 함께 거주하는 가족 구성원 정보
     * 인원 수, 관계, 연령대 등
     */
    @Prop({ required: true })
    familyMembers: string;

    /**
     * 모든 가족 구성원의 입양 동의 여부
     */
    @Prop({ required: true })
    allFamilyConsent: boolean;

    /**
     * 알러지 검사 정보
     * 알러지 검사 여부, 결과(유무), 향후 계획
     */
    @Prop({ required: true })
    allergyTestInfo: string;

    /**
     * 평균적으로 집을 비우는 시간
     * 출퇴근·외출 시간을 포함해 하루 중 집을 비우는 시간
     */
    @Prop({ required: true })
    timeAwayFromHome: string;

    /**
     * 반려동물과 함께 지낼 공간 소개 (최대 1500자)
     * 반려동물이 주로 생활할 공간과 환경
     */
    @Prop({ required: true, maxlength: 1500 })
    livingSpaceDescription: string;

    /**
     * 현재/이전 반려동물 정보 (최대 1500자)
     * 품종, 성격, 함께한 기간, 이별 사유 등
     */
    @Prop({ required: true, maxlength: 1500 })
    previousPetExperience: string;
}

/**
 * 입양 신청 정보 스키마 (Figma 디자인 기반)
 *
 * 입양자의 상담 신청 정보를 별도 컬렉션으로 관리합니다.
 * 브리더와 입양자 모두 이 데이터를 참조합니다.
 */
@Schema({
    timestamps: true,
    collection: 'adoption_applications',
})
export class AdoptionApplication {
    /**
     * 브리더 ID (참조)
     */
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Breeder', required: true, index: true })
    breederId: MongooseSchema.Types.ObjectId;

    /**
     * 신청자 (입양자) ID
     */
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Adopter', required: true, index: true })
    adopterId: MongooseSchema.Types.ObjectId;

    /**
     * 입양자 이름 (비정규화 - 빠른 조회를 위해 저장)
     */
    @Prop({ required: true })
    adopterName: string;

    /**
     * 입양자 이메일 (비정규화)
     */
    @Prop({ required: true })
    adopterEmail: string;

    /**
     * 입양자 휴대폰 번호 (비정규화)
     */
    @Prop({ required: true })
    adopterPhone: string;

    /**
     * 신청 대상 반려동물 ID (선택사항 - 특정 개체 지정 없이 전체 상담일 수도 있음)
     */
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'AvailablePet', required: false })
    petId?: MongooseSchema.Types.ObjectId;

    /**
     * 반려동물 이름 (비정규화 - 있는 경우에만)
     */
    @Prop({ required: false })
    petName?: string;

    /**
     * 신청 처리 상태
     * - consultation_pending: 상담대기
     * - consultation_completed: 상담완료
     * - adoption_approved: 입양승인
     * - adoption_rejected: 입양거절
     */
    @Prop({
        required: true,
        enum: ['consultation_pending', 'consultation_completed', 'adoption_approved', 'adoption_rejected'],
        default: 'consultation_pending',
        index: true,
    })
    status: string;

    /**
     * 입양 신청 폼 응답 데이터 (Figma 디자인 기반 명시적 필드)
     */
    @Prop({ required: true, type: ApplicationFormData })
    applicationData: ApplicationFormData;

    /**
     * 신청 접수 일시
     */
    @Prop({ default: Date.now, index: true })
    appliedAt: Date;

    /**
     * 브리더 처리 완료 일시
     */
    @Prop()
    processedAt?: Date;

    /**
     * 브리더 처리 메모 (내부 참고용)
     */
    @Prop()
    breederNotes?: string;
}

export const AdoptionApplicationSchema = SchemaFactory.createForClass(AdoptionApplication);

// 복합 인덱스 설정 (성능 최적화)
AdoptionApplicationSchema.index({ breederId: 1, status: 1, appliedAt: -1 }); // 브리더가 신청 목록 조회
AdoptionApplicationSchema.index({ adopterId: 1, status: 1, appliedAt: -1 }); // 입양자가 자신의 신청 목록 조회
AdoptionApplicationSchema.index({ petId: 1 }); // 특정 개체의 신청 목록 조회
AdoptionApplicationSchema.index({ appliedAt: -1 }); // 최신 순 정렬
