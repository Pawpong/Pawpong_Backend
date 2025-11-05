import { ApiProperty } from '@nestjs/swagger';

/**
 * 커스텀 질문 DTO
 *
 * 브리더가 추가한 커스텀 질문 정보를 담는 DTO입니다.
 */
export class CustomQuestionDto {
    /**
     * 질문 고유 ID
     * @example "custom_visit_time"
     */
    @ApiProperty({
        description: '질문 고유 ID (영문, 숫자, 언더스코어만 사용)',
        example: 'custom_visit_time',
    })
    id: string;

    /**
     * 질문 입력 타입
     * @example "select"
     */
    @ApiProperty({
        description: '질문 입력 타입 (text, textarea, checkbox, radio, select)',
        example: 'select',
    })
    type: string;

    /**
     * 질문 레이블
     * @example "방문 가능한 시간대를 선택해주세요"
     */
    @ApiProperty({
        description: '질문 레이블',
        example: '방문 가능한 시간대를 선택해주세요',
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
        description: '선택 옵션 배열 (select, radio, checkbox 타입인 경우 필수)',
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
}

/**
 * 입양 신청 폼 수정 응답 DTO
 *
 * PUT /api/breeder-management/application-form
 * 브리더가 커스텀 질문을 추가/수정/삭제한 결과를 담는 DTO입니다.
 */
export class ApplicationFormUpdateResponseDto {
    /**
     * 성공 메시지
     * @example "입양 신청 폼이 성공적으로 업데이트되었습니다."
     */
    @ApiProperty({
        description: '성공 메시지',
        example: '입양 신청 폼이 성공적으로 업데이트되었습니다.',
    })
    message: string;

    /**
     * 업데이트된 커스텀 질문 목록
     */
    @ApiProperty({
        description: '업데이트된 커스텀 질문 목록',
        type: [CustomQuestionDto],
    })
    customQuestions: CustomQuestionDto[];
}
