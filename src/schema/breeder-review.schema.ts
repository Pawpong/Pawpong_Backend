import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type BreederReviewDocument = BreederReview & Document;

/**
 * 브리더 후기 스키마
 *
 * 참조 방식으로 설계:
 * - 별도 컬렉션으로만 관리 (임베디드 없음)
 * - 입양 신청과 연결하여 상담 완료 후 작성 가능
 * - 조회 시 populate로 추가 정보 가져오기
 */
@Schema({
    timestamps: true,
    collection: 'breeder_reviews',
})
export class BreederReview {
    /**
     * 입양 신청 ID (참조)
     * 상담 완료 후 작성하는 후기이므로 신청과 1:1 매칭
     */
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'AdoptionApplication', required: true, unique: true, index: true })
    applicationId: MongooseSchema.Types.ObjectId;

    /**
     * 브리더 ID (참조)
     */
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Breeder', required: true, index: true })
    breederId: MongooseSchema.Types.ObjectId;

    /**
     * 후기 작성자 (입양자) ID (참조)
     */
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Adopter', required: true, index: true })
    adopterId: MongooseSchema.Types.ObjectId;

    /**
     * 후기 유형
     * - consultation: 상담후기
     * - adoption: 입양완료후기
     */
    @Prop({ required: true, enum: ['consultation', 'adoption'], index: true })
    type: string;

    /**
     * 후기 내용
     */
    @Prop({ required: true })
    content: string;

    /**
     * 후기 작성 일시
     */
    @Prop({ required: true, default: Date.now, index: true })
    writtenAt: Date;

    /**
     * 공개 여부 (숨김 처리, 신고 처리 등에 사용)
     */
    @Prop({ default: true })
    isVisible: boolean;

    /**
     * 신고 여부
     */
    @Prop({ default: false })
    isReported: boolean;

    /**
     * 신고자 ID
     */
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Adopter' })
    reportedBy?: MongooseSchema.Types.ObjectId;

    /**
     * 신고 사유
     */
    @Prop()
    reportReason?: string;

    /**
     * 신고 상세 설명
     */
    @Prop()
    reportDescription?: string;

    /**
     * 신고 일시
     */
    @Prop()
    reportedAt?: Date;
}

export const BreederReviewSchema = SchemaFactory.createForClass(BreederReview);

// 인덱스 설정
BreederReviewSchema.index({ applicationId: 1 }, { unique: true }); // 신청당 1개 후기 보장
BreederReviewSchema.index({ breederId: 1, isVisible: 1, writtenAt: -1 }); // 브리더별 최신 후기 조회
BreederReviewSchema.index({ adopterId: 1, writtenAt: -1 }); // 입양자별 작성 후기 조회
BreederReviewSchema.index({ breederId: 1, type: 1 }); // 브리더별 후기 타입 필터링
