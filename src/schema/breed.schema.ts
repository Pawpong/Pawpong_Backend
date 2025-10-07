import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * 품종 스키마
 */
@Schema({
    timestamps: true,
    collection: 'breeds',
})
export class Breed extends Document {
    /**
     * 동물 타입 (dog, cat)
     */
    @Prop({ required: true, enum: ['dog', 'cat'], index: true })
    petType: string;

    /**
     * 품종 카테고리 (예: 소형견, 중형견, 대형견, 장모, 단모)
     */
    @Prop({ required: true })
    category: string;

    /**
     * 카테고리 설명 (예: 10kg 미만, 10kg-25kg)
     */
    @Prop()
    categoryDescription?: string;

    /**
     * 품종 목록
     */
    @Prop({ type: [String], required: true })
    breeds: string[];
}

export const BreedSchema = SchemaFactory.createForClass(Breed);

// 인덱스 추가
BreedSchema.index({ petType: 1, category: 1 }, { unique: true });
