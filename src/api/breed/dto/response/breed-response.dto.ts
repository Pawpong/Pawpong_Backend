import { ApiProperty } from '@nestjs/swagger';

export class BreedResponseDto {
    @ApiProperty({
        description: '품종 ID',
        example: '507f1f77bcf86cd799439011',
    })
    id: string;

    @ApiProperty({
        description: '동물 타입',
        example: 'dog',
        enum: ['dog', 'cat'],
    })
    petType: string;

    @ApiProperty({
        description: '품종 카테고리',
        example: '소형견',
    })
    category: string;

    @ApiProperty({
        description: '카테고리 설명',
        example: '10kg 미만',
        required: false,
    })
    categoryDescription?: string;

    @ApiProperty({
        description: '품종 목록',
        type: [String],
        example: ['비숑프리제', '닥스훈트', '말티즈'],
    })
    breeds: string[];

    @ApiProperty({
        description: '생성일',
        example: '2024-01-01T00:00:00.000Z',
    })
    createdAt: Date;

    @ApiProperty({
        description: '수정일',
        example: '2024-01-01T00:00:00.000Z',
    })
    updatedAt: Date;
}
