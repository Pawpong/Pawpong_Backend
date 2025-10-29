import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * FAQ 스키마
 * 자주 묻는 질문
 */
@Schema({ collection: 'faqs', timestamps: true })
export class Faq {
    /**
     * 질문
     * @example "포퐁은 어떤 서비스인가요?"
     */
    @Prop({ required: true })
    question: string;

    /**
     * 답변
     * @example "포퐁은 신뢰할 수 있는 브리더와 입양자를 연결하는 플랫폼입니다."
     */
    @Prop({ required: true })
    answer: string;

    /**
     * 카테고리
     * service: 서비스 소개
     * adoption: 입양 관련
     * breeder: 브리더 관련
     * payment: 결제 관련
     * @example "service"
     */
    @Prop({ required: true, enum: ['service', 'adoption', 'breeder', 'payment', 'etc'] })
    category: string;

    /**
     * 사용자 타입
     * adopter: 입양자용 FAQ
     * breeder: 브리더용 FAQ
     * both: 공통 FAQ
     * @example "adopter"
     */
    @Prop({ required: true, enum: ['adopter', 'breeder', 'both'], default: 'both' })
    userType: string;

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
}

export type FaqDocument = Faq & Document;
export const FaqSchema = SchemaFactory.createForClass(Faq);

// 인덱스 생성
FaqSchema.index({ userType: 1, isActive: 1, order: 1 });
FaqSchema.index({ category: 1, isActive: 1 });
