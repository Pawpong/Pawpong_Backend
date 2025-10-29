import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * 부모견/부모묘 스키마
 */
@Schema({ collection: 'parent_pets', timestamps: true })
export class ParentPet {
    /**
     * 소속 브리더 ID
     * @example "507f1f77bcf86cd799439011"
     */
    @Prop({ required: true, type: Types.ObjectId, ref: 'Breeder', index: true })
    breederId: Types.ObjectId;

    /**
     * 이름
     * @example "엄마초코"
     */
    @Prop({ required: true })
    name: string;

    /**
     * 품종
     * @example "포메라니안"
     */
    @Prop({ required: true })
    breed: string;

    /**
     * 성별
     * @example "female"
     */
    @Prop({ required: true, enum: ['male', 'female'] })
    gender: string;

    /**
     * 생년월일
     * @example "2020-05-15"
     */
    @Prop({ required: true, type: Date })
    birthDate: Date;

    /**
     * 부모견/부모묘 사진 파일명
     * @example "parents/uuid.jpg"
     */
    @Prop({ required: true })
    photoFileName: string;

    /**
     * 건강 기록
     * @example ["정기 건강검진 완료 (2024-12-01)", "유전질환 없음"]
     */
    @Prop({ type: [String], default: [] })
    healthRecords?: string[];

    /**
     * 소개 내용
     * @example "건강하고 온순한 성격의 엄마 포메라니안입니다"
     */
    @Prop()
    description?: string;

    /**
     * 활성화 여부 (소프트 삭제)
     * @example true
     */
    @Prop({ default: true })
    isActive: boolean;
}

export type ParentPetDocument = ParentPet & Document;
export const ParentPetSchema = SchemaFactory.createForClass(ParentPet);

// 인덱스 생성
ParentPetSchema.index({ breederId: 1, isActive: 1 });
