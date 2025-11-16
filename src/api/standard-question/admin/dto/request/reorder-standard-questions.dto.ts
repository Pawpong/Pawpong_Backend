import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

class ReorderItemDto {
    @ApiProperty({ description: '질문 ID', example: 'privacyConsent' })
    @IsString()
    @IsNotEmpty()
    id: string;

    @ApiProperty({ description: '새로운 순서', example: 1 })
    @IsInt()
    order: number;
}

export class ReorderStandardQuestionsDto {
    @ApiProperty({
        description: '순서를 변경할 질문 목록',
        type: [ReorderItemDto],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReorderItemDto)
    reorderData: ReorderItemDto[];
}
