import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * 배너 스키마
 * 홈 화면 메인 배너 정보
 */
@Schema({ collection: 'banners', timestamps: true })
export class Banner {
    /**
     * 배너 이미지 파일명
     * @example "banners/uuid.png"
     */
    @Prop({ required: true })
    imageFileName: string;

    /**
     * 링크 타입
     * internal: 서비스 내부 링크
     * external: 외부 웹 링크
     * @example "internal"
     */
    @Prop({ required: true, enum: ['internal', 'external'] })
    linkType: string;

    /**
     * 링크 URL
     * @example "/explore?animal=dog"
     */
    @Prop({ required: true })
    linkUrl: string;

    /**
     * 정렬 순서 (낮을수록 먼저 표시)
     * @example 1
     */
    @Prop({ required: true, default: 0 })
    order: number;

    /**
     * 활성화 여부
     * @example true
     */
    @Prop({ default: true })
    isActive: boolean;

    /**
     * 배너 제목 (선택, 관리용)
     * @example "크리스마스 특별 이벤트"
     */
    @Prop()
    title?: string;

    /**
     * 배너 설명 (선택, 관리용)
     * @example "2025년 1월 말까지"
     */
    @Prop()
    description?: string;
}

export type BannerDocument = Banner & Document;
export const BannerSchema = SchemaFactory.createForClass(Banner);

// 인덱스 생성
BannerSchema.index({ isActive: 1, order: 1 });
