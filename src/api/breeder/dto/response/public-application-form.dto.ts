import { ApiProperty } from '@nestjs/swagger';

/**
 * 폼 질문 DTO
 *
 * 입양 신청 폼의 개별 질문 정보를 담는 DTO입니다.
 */
export class FormQuestionDto {
    /**
     * 질문 고유 ID
     * @example "privacyConsent"
     */
    @ApiProperty({
        description: '질문 고유 ID',
        example: 'privacyConsent',
    })
    id: string;

    /**
     * 질문 입력 타입
     * @example "checkbox"
     */
    @ApiProperty({
        description: '질문 입력 타입 (text, textarea, checkbox, radio, select)',
        example: 'checkbox',
    })
    type: string;

    /**
     * 질문 레이블
     * @example "개인정보 수집 및 이용에 동의하시나요?"
     */
    @ApiProperty({
        description: '질문 레이블',
        example: '개인정보 수집 및 이용에 동의하시나요?',
    })
    label: string;

    /**
     * 필수 여부
     * @example true
     */
    @ApiProperty({
        description: '필수 입력 여부',
        example: true,
    })
    required: boolean;

    /**
     * 선택 옵션 (select, radio, checkbox 타입인 경우)
     * @example ["오전", "오후", "저녁"]
     */
    @ApiProperty({
        description: '선택 옵션 배열 (select, radio, checkbox 타입인 경우)',
        example: ['오전', '오후', '저녁'],
        required: false,
        type: [String],
    })
    options?: string[];

    /**
     * Placeholder 텍스트
     * @example "예: 활발하고 사람을 좋아하는 성격"
     */
    @ApiProperty({
        description: 'Placeholder 텍스트',
        example: '예: 활발하고 사람을 좋아하는 성격',
        required: false,
    })
    placeholder?: string;

    /**
     * 질문 순서
     * @example 1
     */
    @ApiProperty({
        description: '질문 순서',
        example: 1,
    })
    order: number;

    /**
     * 표준 질문 여부
     * @example true
     */
    @ApiProperty({
        description: '표준 질문 여부 (true: 표준 질문, false: 커스텀 질문)',
        example: true,
    })
    isStandard: boolean;
}

/**
 * 입양 신청 폼 구조 조회 응답 DTO (공개)
 *
 * GET /api/breeder/:id/application-form
 * 입양자가 입양 신청하기 전에 브리더의 입양 신청 폼 구조를 조회합니다.
 */
export class PublicApplicationFormResponseDto {
    /**
     * 표준 질문 목록 (14개, 수정 불가)
     */
    @ApiProperty({
        description: '표준 질문 목록 (14개, 모든 브리더 공통)',
        type: [FormQuestionDto],
    })
    standardQuestions: FormQuestionDto[];

    /**
     * 커스텀 질문 목록 (브리더가 추가한 질문들)
     */
    @ApiProperty({
        description: '커스텀 질문 목록 (브리더가 추가한 질문들)',
        type: [FormQuestionDto],
    })
    customQuestions: FormQuestionDto[];

    /**
     * 전체 질문 수
     * @example 16
     */
    @ApiProperty({
        description: '전체 질문 수 (표준 + 커스텀)',
        example: 16,
    })
    totalQuestions: number;
}
