import { ApiProperty } from '@nestjs/swagger';

/**
 * 후기 작성 응답 DTO
 * 후기가 성공적으로 작성되었을 때 반환되는 데이터 구조입니다.
 */
export class ReviewCreateResponseDto {
    /**
     * 생성된 후기 ID
     * @example "507f1f77bcf86cd799439044"
     */
    @ApiProperty({
        description: '생성된 후기 ID',
        example: '507f1f77bcf86cd799439044',
    })
    reviewId: string;

    /**
     * 후기 대상 브리더 ID
     * @example "507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '후기 대상 브리더 ID',
        example: '507f1f77bcf86cd799439011',
    })
    targetBreederId: string;

    /**
     * 전체 평점
     * @example 5
     */
    @ApiProperty({
        description: '전체 평점',
        example: 5,
        minimum: 1,
        maximum: 5,
    })
    overallRating: number;

    /**
     * 후기 내용
     * @example "정말 좋은 브리더입니다. 반려동물이 건강하고 성격도 좋아요."
     */
    @ApiProperty({
        description: '후기 내용',
        example: '정말 좋은 브리더입니다. 반려동물이 건강하고 성격도 좋아요.',
    })
    reviewContent: string;

    /**
     * 후기 작성 일시
     * @example "2024-01-15T10:30:00.000Z"
     */
    @ApiProperty({
        description: '후기 작성 일시',
        example: '2024-01-15T10:30:00.000Z',
        format: 'date-time',
    })
    createdAt: string;

    /**
     * 후기 공개 상태
     * @example true
     */
    @ApiProperty({
        description: '후기 공개 상태',
        example: true,
    })
    isPublicVisible: boolean;

    /**
     * 후기 작성 완료 메시지
     * @example "후기가 성공적으로 작성되었습니다. 다른 입양자들에게 도움이 될 것입니다."
     */
    @ApiProperty({
        description: '후기 작성 완료 메시지',
        example: '후기가 성공적으로 작성되었습니다. 다른 입양자들에게 도움이 될 것입니다.',
    })
    confirmationMessage: string;
}
