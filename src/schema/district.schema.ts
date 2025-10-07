import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * 시/군/구 스키마
 */
@Schema({
    timestamps: true,
    collection: 'districts',
})
export class District extends Document {
    /**
     * 시/도 이름
     */
    @Prop({ required: true, index: true })
    city: string;

    /**
     * 시/군/구 이름 배열
     */
    @Prop({ type: [String], required: true })
    districts: string[];
}

export const DistrictSchema = SchemaFactory.createForClass(District);

// 인덱스 추가
DistrictSchema.index({ city: 1 }, { unique: true });
