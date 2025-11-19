import { ApiProperty } from '@nestjs/swagger';

/**
 * FAQ 응답 DTO
 */
export class FaqResponseDto {
    /**
     * FAQ ID
     * @example "507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: 'FAQ ID',
        example: '507f1f77bcf86cd799439011',
    })
    faqId: string;

    /**
     * 질문
     * @example "포퐁은 어떤 서비스인가요?"
     */
    @ApiProperty({
        description: '질문',
        example: '포퐁은 어떤 서비스인가요?',
    })
    question: string;

    /**
     * 답변
     * @example "포퐁은 신뢰할 수 있는 브리더와 입양자를 연결하는 플랫폼입니다."
     */
    @ApiProperty({
        description: '답변',
        example: '포퐁은 신뢰할 수 있는 브리더와 입양자를 연결하는 플랫폼입니다.',
    })
    answer: string;

    /**
     * 카테고리
     * @example "service"
     */
    @ApiProperty({
        description: '카테고리',
        example: 'service',
        enum: ['service', 'adoption', 'breeder', 'payment', 'etc'],
    })
    category: string;

    /**
     * 사용자 타입
     * @example "adopter"
     */
    @ApiProperty({
        description: '사용자 타입 (adopter/breeder/both)',
        example: 'adopter',
        enum: ['adopter', 'breeder', 'both'],
    })
    userType: string;

    /**
     * 정렬 순서
     * @example 1
     */
    @ApiProperty({
        description: '정렬 순서',
        example: 1,
    })
    order: number;
}
