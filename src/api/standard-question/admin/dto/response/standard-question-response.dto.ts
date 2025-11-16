import { ApiProperty } from '@nestjs/swagger';

import { StandardQuestion } from '../../../../../schema/standard-question.schema';

export class StandardQuestionResponseDto {
    @ApiProperty({ description: '질문 고유 ID', example: 'privacyConsent' })
    id: string;

    @ApiProperty({ description: '질문 타입', example: 'checkbox' })
    type: string;

    @ApiProperty({ description: '질문 내용', example: '개인정보 수집 및 이용에 동의하시나요?' })
    label: string;

    @ApiProperty({ description: '필수 여부', example: true })
    required: boolean;

    @ApiProperty({ description: '정렬 순서', example: 1 })
    order: number;

    @ApiProperty({ description: '활성화 여부', example: true })
    isActive: boolean;

    @ApiProperty({
        description: '선택형 질문의 옵션들 (select, radio, checkbox의 경우)',
        example: ['예', '아니오'],
        required: false,
    })
    options?: string[];

    @ApiProperty({ description: '플레이스홀더 텍스트', example: '예: 서울시 강남구', required: false })
    placeholder?: string;

    @ApiProperty({
        description: '설명 또는 도움말',
        example: '개인정보는 입양 심사 목적으로만 사용됩니다',
        required: false,
    })
    description?: string;

    constructor(question: StandardQuestion) {
        this.id = question.id;
        this.type = question.type;
        this.label = question.label;
        this.required = question.required;
        this.order = question.order;
        this.isActive = question.isActive;
        this.options = question.options;
        this.placeholder = question.placeholder;
        this.description = question.description;
    }
}
