import { ApiProperty } from '@nestjs/swagger';

/**
 * 표준 질문 필드 DTO
 */
export class StandardQuestionDto {
    @ApiProperty({ description: '질문 ID', example: 'privacyConsent' })
    id: string;

    @ApiProperty({ description: '질문 타입', example: 'checkbox' })
    type: string;

    @ApiProperty({ description: '질문 라벨', example: '개인정보 수집 및 이용에 동의하시나요?' })
    label: string;

    @ApiProperty({ description: '필수 여부', example: true })
    required: boolean;

    @ApiProperty({ description: '질문 순서', example: 1 })
    order: number;

    @ApiProperty({ description: '표준 필드 여부', example: true })
    isStandard: boolean;
}

/**
 * 커스텀 질문 필드 DTO
 */
export class CustomQuestionDto {
    @ApiProperty({ description: '질문 ID', example: 'custom_pet_preference' })
    id: string;

    @ApiProperty({ description: '질문 타입', example: 'textarea' })
    type: string;

    @ApiProperty({ description: '질문 라벨', example: '선호하는 반려동물의 성격을 알려주세요' })
    label: string;

    @ApiProperty({ description: '필수 여부', example: true })
    required: boolean;

    @ApiProperty({ description: '선택지 옵션', required: false, type: [String] })
    options?: string[];

    @ApiProperty({ description: '플레이스홀더', required: false })
    placeholder?: string;

    @ApiProperty({ description: '질문 순서', example: 18 })
    order: number;

    @ApiProperty({ description: '표준 필드 여부', example: false })
    isStandard: boolean;
}

/**
 * 입양 신청 폼 전체 구조 응답 DTO
 */
export class ApplicationFormResponseDto {
    /**
     * 표준 질문 목록 (17개 고정)
     */
    @ApiProperty({
        description: '표준 질문 목록 (모든 브리더 공통, 17개)',
        type: [StandardQuestionDto],
    })
    standardQuestions: StandardQuestionDto[];

    /**
     * 커스텀 질문 목록 (브리더가 추가한 질문)
     */
    @ApiProperty({
        description: '커스텀 질문 목록 (브리더가 추가한 질문)',
        type: [CustomQuestionDto],
    })
    customQuestions: CustomQuestionDto[];

    /**
     * 전체 질문 개수
     */
    @ApiProperty({ description: '전체 질문 개수', example: 20 })
    totalQuestions: number;
}
