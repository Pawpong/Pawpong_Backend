import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type BreederReportDocument = BreederReport & Document;

/**
 * 브리더 신고 정보 스키마
 */
@Schema({
    timestamps: true,
    collection: 'breeder_reports',
})
export class BreederReport {
    /**
     * 브리더 ID (참조)
     */
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Breeder', required: true, index: true })
    breederId: MongooseSchema.Types.ObjectId;

    /**
     * 신고자 ID
     */
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Adopter', required: true })
    reporterId: MongooseSchema.Types.ObjectId;

    /**
     * 신고자 이름
     */
    @Prop({ required: true })
    reporterName: string;

    /**
     * 신고 유형
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
     * 신고 처리 상태
     */
    @Prop({ required: true, enum: ['pending', 'reviewing', 'resolved', 'dismissed'], default: 'pending' })
    status: string;

    /**
     * 관리자 처리 메모
     */
    @Prop()
    adminNotes?: string;
}

export const BreederReportSchema = SchemaFactory.createForClass(BreederReport);

// 인덱스 설정
BreederReportSchema.index({ breederId: 1, status: 1 });
BreederReportSchema.index({ reporterId: 1 });
