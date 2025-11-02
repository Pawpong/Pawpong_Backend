import { IsString, IsNotEmpty, IsBoolean, IsEnum, IsArray, IsNumber, ValidateNested, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * 커스텀 질문 필드 DTO
 */
export class CustomQuestionFieldDto {
    /**
     * 질문 고유 ID
     * @example "custom_pet_preference"
     */
    @ApiProperty({
        description: '질문 고유 ID (영문, 숫자, 언더스코어만 사용)',
        example: 'custom_pet_preference',
    })
    @IsString()
    @IsNotEmpty()
    id: string;

    /**
     * 질문 타입
     * @example "textarea"
     */
    @ApiProperty({
        description: '질문 입력 타입',
        example: 'textarea',
        enum: ['text', 'textarea', 'select', 'radio', 'checkbox', 'file'],
    })
    @IsEnum(['text', 'textarea', 'select', 'radio', 'checkbox', 'file'])
    type: string;

    /**
     * 질문 라벨 (실제 표시되는 질문)
     * @example "선호하는 반려동물의 성격을 알려주세요"
     */
    @ApiProperty({
        description: '질문 라벨 (입양자에게 표시되는 질문 텍스트)',
        example: '선호하는 반려동물의 성격을 알려주세요',
    })
    @IsString()
    @IsNotEmpty()
    label: string;

    /**
     * 필수 입력 여부
     * @example true
     */
    @ApiProperty({
        description: '필수 입력 여부',
        example: true,
    })
    @IsBoolean()
    required: boolean;

    /**
     * 선택지 옵션 (select, radio, checkbox 타입일 때만 사용)
     * @example ["활발함", "온순함", "독립적", "사교적"]
     */
    @ApiProperty({
        description: '선택지 옵션 (select, radio, checkbox 타입일 때 필수)',
        example: ['활발함', '온순함', '독립적', '사교적'],
        required: false,
        type: [String],
    })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    options?: string[];

    /**
     * 플레이스홀더 텍스트
     * @example "예: 활발하고 사람을 좋아하는 성격"
     */
    @ApiProperty({
        description: '입력 필드 플레이스홀더',
        example: '예: 활발하고 사람을 좋아하는 성격',
        required: false,
    })
    @IsString()
    @IsOptional()
    placeholder?: string;

    /**
     * 질문 순서
     * @example 1
     */
    @ApiProperty({
        description: '질문 표시 순서',
        example: 1,
    })
    @IsNumber()
    order: number;
}

/**
 * 브리더 입양 신청 폼 수정 요청 DTO
 */
export class ApplicationFormUpdateRequestDto {
    /**
     * 커스텀 질문 목록
     *
     * 표준 17개 질문은 자동으로 포함되며, 이 배열에는 추가 질문만 포함됩니다.
     */
    @ApiProperty({
        description: '브리더가 추가하는 커스텀 질문 목록 (표준 17개 질문은 자동 포함)',
        type: [CustomQuestionFieldDto],
        example: [
            {
                id: 'custom_pet_preference',
                type: 'textarea',
                label: '선호하는 반려동물의 성격을 알려주세요',
                required: true,
                placeholder: '예: 활발하고 사람을 좋아하는 성격',
                order: 1,
            },
            {
                id: 'custom_visit_time',
                type: 'select',
                label: '방문 가능한 시간대를 선택해주세요',
                required: true,
                options: ['오전 (09:00-12:00)', '오후 (13:00-17:00)', '저녁 (18:00-20:00)'],
                order: 2,
            },
        ],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CustomQuestionFieldDto)
    customQuestions: CustomQuestionFieldDto[];
}
