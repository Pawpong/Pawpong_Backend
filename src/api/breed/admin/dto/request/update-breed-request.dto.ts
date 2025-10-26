import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, ArrayNotEmpty } from 'class-validator';

export class UpdateBreedRequestDto {
    @ApiProperty({
        description: '품종 카테고리',
        example: '소형견',
        required: false,
    })
    @IsOptional()
    @IsString()
    category?: string;

    @ApiProperty({
        description: '카테고리 설명',
        example: '10kg 미만',
        required: false,
    })
    @IsOptional()
    @IsString()
    categoryDescription?: string;

    @ApiProperty({
        description: '품종 목록',
        type: [String],
        example: ['비숑프리제', '닥스훈트', '말티즈'],
        required: false,
    })
    @IsOptional()
    @IsArray()
    @ArrayNotEmpty({ message: '최소 1개 이상의 품종이 필요합니다.' })
    @IsString({ each: true })
    breeds?: string[];
}
