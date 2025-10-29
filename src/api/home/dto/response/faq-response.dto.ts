import { ApiProperty } from '@nestjs/swagger';

/**
 * FAQ 응답 DTO
 */
export class FaqResponseDto {
    @ApiProperty({
        description: 'FAQ ID',
        example: '507f1f77bcf86cd799439011',
    })
    id: string;

    @ApiProperty({
        description: '질문',
        example: '포퐁은 어떤 서비스인가요?',
    })
    question: string;

    @ApiProperty({
        description: '답변',
        example: '포퐁은 신뢰할 수 있는 브리더와 입양자를 연결하는 플랫폼입니다.',
    })
    answer: string;

    @ApiProperty({
        description: '카테고리',
        example: 'service',
        enum: ['service', 'adoption', 'breeder', 'payment', 'etc'],
    })
    category: string;

    @ApiProperty({
        description: '정렬 순서',
        example: 1,
    })
    order: number;
}
