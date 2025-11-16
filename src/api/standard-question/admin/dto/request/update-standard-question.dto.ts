import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsArray, IsIn } from 'class-validator';
import { StandardQuestionResponseDto } from '../response/standard-question-response.dto';

class UpdateStandardQuestionFields {
    @ApiProperty({ description: '질문 타입', example: 'text', required: false })
    @IsOptional()
    @IsIn(['text', 'textarea', 'checkbox', 'radio', 'select'])
    type?: string;

    @ApiProperty({ description: '질문 내용', example: '새로운 질문 내용', required: false })
    @IsOptional()
    @IsString()
    label?: string;

    @ApiProperty({ description: '필수 여부', example: false, required: false })
    @IsOptional()
    @IsBoolean()
    required?: boolean;

    @ApiProperty({
        description: '선택형 질문의 옵션들',
        example: ['옵션1', '옵션2'],
        required: false,
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    options?: string[];

    @ApiProperty({ description: '플레이스홀더 텍스트', example: '새로운 플레이스홀더', required: false })
    @IsOptional()
    @IsString()
    placeholder?: string;

    @ApiProperty({ description: '설명 또는 도움말', example: '새로운 도움말', required: false })
    @IsOptional()
    @IsString()
    description?: string;
}

export class UpdateStandardQuestionDto extends PartialType(UpdateStandardQuestionFields) {}
