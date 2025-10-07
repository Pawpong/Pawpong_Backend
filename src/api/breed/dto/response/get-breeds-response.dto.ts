import { ApiProperty } from '@nestjs/swagger';

export class BreedCategoryDto {
    @ApiProperty({
        description: '카테고리명',
        example: '소형견',
    })
    category: string;

    @ApiProperty({
        description: '카테고리 설명',
        example: '10kg 미만',
    })
    categoryDescription?: string;

    @ApiProperty({
        description: '품종 목록',
        type: [String],
        example: ['비숑프리제', '닥스훈트', '말티즈'],
    })
    breeds: string[];
}

export class GetBreedsResponseDto {
    @ApiProperty({
        description: '동물 타입',
        example: 'dog',
        enum: ['dog', 'cat'],
    })
    petType: string;

    @ApiProperty({
        description: '카테고리별 품종 목록',
        type: [BreedCategoryDto],
    })
    categories: BreedCategoryDto[];

    constructor(petType: string, categories: BreedCategoryDto[]) {
        this.petType = petType;
        this.categories = categories;
    }
}
