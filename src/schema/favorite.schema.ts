import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * 찜 스키마
 */
@Schema({ collection: 'favorites', timestamps: true })
export class Favorite {
    /**
     * 입양자 ID
     * @example "507f1f77bcf86cd799439011"
     */
    @Prop({ required: true, type: Types.ObjectId, ref: 'Adopter', index: true })
    adopterId: Types.ObjectId;

    /**
     * 브리더 ID
     * @example "507f1f77bcf86cd799439012"
     */
    @Prop({ required: true, type: Types.ObjectId, ref: 'Breeder', index: true })
    breederId: Types.ObjectId;
}

export type FavoriteDocument = Favorite & Document;
export const FavoriteSchema = SchemaFactory.createForClass(Favorite);

// 유니크 복합 인덱스 (한 입양자가 같은 브리더를 중복 찜할 수 없음)
FavoriteSchema.index({ adopterId: 1, breederId: 1 }, { unique: true });
