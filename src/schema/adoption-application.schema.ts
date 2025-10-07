import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AdoptionApplicationDocument = AdoptionApplication & Document;

/**
 * 입양 신청 정보 스키마
 * 브리더가 받은 입양 신청을 별도 컬렉션으로 관리
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
     * 신청 대상 반려동물 ID
     */
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'AvailablePet', required: true })
    petId: MongooseSchema.Types.ObjectId;

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

export const AdoptionApplicationSchema = SchemaFactory.createForClass(AdoptionApplication);

// 인덱스 설정
AdoptionApplicationSchema.index({ breederId: 1, status: 1, appliedAt: -1 });
AdoptionApplicationSchema.index({ adopterId: 1, status: 1 });
AdoptionApplicationSchema.index({ petId: 1 });
