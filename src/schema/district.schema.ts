import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * 지역 스키마
 */
@Schema({
    timestamps: true,
    collection: 'districts',
})
export class District extends Document {
    /**
     * 도/특별시/광역시 (예: 경기도, 서울특별시)
     */
    @Prop({ required: true })
    city: string;

    /**
     * 시/군/구 목록
     */
    @Prop({ type: [String], required: true })
    districts: string[];
}

export const DistrictSchema = SchemaFactory.createForClass(District);

// 인덱스 추가
DistrictSchema.index({ city: 1 }, { unique: true });
