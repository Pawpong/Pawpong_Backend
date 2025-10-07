import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ParentPetDocument = ParentPet & Document;

/**
 * 부모견/부모묘 정보 스키마
 * 프로필 페이지 표시: 사진 / 이름 / 품종 / 소개
 */
@Schema({
    timestamps: true,
    collection: 'parent_pets',
})
export class ParentPet {
    /**
     * 브리더 ID (참조)
     */
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Breeder', required: true, index: true })
    breederId: MongooseSchema.Types.ObjectId;

    /**
     * 부모견/부모묘 이름
     */
    @Prop({ required: true })
    name: string;

    /**
     * 품종명
     */
    @Prop({ required: true })
    breed: string;

    /**
     * 성별 (male: 수컷, female: 암컷)
     */
    @Prop({ required: true, enum: ['male', 'female'] })
    gender: string;

    /**
     * 부모견/부모묘 사진 파일명 배열 (버킷에서 조회)
     */
    @Prop({ type: [String], default: [] })
    photos: string[];

    /**
     * 부모묘 소개
     */
    @Prop({ maxlength: 500 })
    description?: string;

    /**
     * 활성 상태 여부 (삭제된 항목은 false)
     */
    @Prop({ default: true })
    isActive: boolean;
}

export const ParentPetSchema = SchemaFactory.createForClass(ParentPet);

// 인덱스 설정
ParentPetSchema.index({ breederId: 1, isActive: 1 });
