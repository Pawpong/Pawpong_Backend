import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * 표준 입양 신청 폼 질문 스키마
 * 모든 브리더에게 공통으로 적용되는 필수 질문들
 */
@Schema({ collection: 'standard_questions', timestamps: true })
export class StandardQuestion {
    /**
     * 질문 고유 ID
     * @example "privacyConsent"
     */
    @Prop({ required: true, unique: true, index: true })
    id: string;

    /**
     * 질문 타입
     * @example "checkbox"
     */
    @Prop({ required: true, enum: ['text', 'textarea', 'checkbox', 'radio', 'select'] })
    type: string;

    /**
     * 질문 내용
     * @example "개인정보 수집 및 이용에 동의하시나요?"
     */
    @Prop({ required: true })
    label: string;

    /**
     * 필수 여부
     * @example true
     */
    @Prop({ required: true, default: true })
    required: boolean;

    /**
     * 정렬 순서
     * @example 1
     */
    @Prop({ required: true })
    order: number;

    /**
     * 활성화 여부
     * @example true
     */
    @Prop({ default: true })
    isActive: boolean;

    /**
     * 선택형 질문의 옵션들 (select, radio, checkbox의 경우)
     * @example ["예", "아니오"]
     */
    @Prop({ type: [String] })
    options?: string[];

    /**
     * 플레이스홀더 텍스트
     * @example "예: 서울시 강남구"
     */
    @Prop()
    placeholder?: string;

    /**
     * 설명 또는 도움말
     * @example "개인정보는 입양 심사 목적으로만 사용됩니다"
     */
    @Prop()
    description?: string;
}

export type StandardQuestionDocument = StandardQuestion & Document;
export const StandardQuestionSchema = SchemaFactory.createForClass(StandardQuestion);

// 인덱스 생성
StandardQuestionSchema.index({ order: 1, isActive: 1 });
