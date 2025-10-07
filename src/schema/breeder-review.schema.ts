import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type BreederReviewDocument = BreederReview & Document;

/**
 * 브리더가 받은 후기 정보 스키마
 * 프로필 페이지 표시: 후기 종류 / 입양자 닉네임 / 작성 년월일 / 내용
 */
@Schema({
    timestamps: true,
    collection: 'breeder_reviews',
})
export class BreederReview {
    /**
     * 브리더 ID (참조)
     */
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Breeder', required: true, index: true })
    breederId: MongooseSchema.Types.ObjectId;

    /**
     * 후기 작성자 (입양자) ID
     */
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Adopter', required: true })
    adopterId: MongooseSchema.Types.ObjectId;

    /**
     * 후기 작성자 닉네임
     */
    @Prop({ required: true })
    adopterNickname: string;

    /**
     * 후기 유형 (consultation: 상담후기, adoption: 입양완료후기)
     */
    @Prop({ required: true, enum: ['consultation', 'adoption'] })
    type: string;

    /**
     * 후기 내용
     */
    @Prop({ required: true })
    content: string;

    /**
     * 평점 (1-5점)
     */
    @Prop({ required: true, min: 1, max: 5 })
    rating: number;

    /**
     * 후기 사진 파일명 배열
     */
    @Prop({ type: [String], default: [] })
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

export const BreederReviewSchema = SchemaFactory.createForClass(BreederReview);

// 인덱스 설정
BreederReviewSchema.index({ breederId: 1, isVisible: 1, writtenAt: -1 });
BreederReviewSchema.index({ breederId: 1, type: 1 });
BreederReviewSchema.index({ adopterId: 1 });
