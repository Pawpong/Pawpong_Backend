import { ApiProperty } from '@nestjs/swagger';

/**
 * 입양자가 작성한 후기 목록 응답 DTO
 */
export class MyReviewItemDto {
    /**
     * 후기 ID
     * @example "507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '후기 ID',
        example: '507f1f77bcf86cd799439011',
    })
    reviewId: string;

    /**
     * 브리더 닉네임
     * @example "행복한브리더"
     */
    @ApiProperty({
        description: '브리더 닉네임',
        example: '행복한브리더',
    })
    breederNickname: string;

    /**
     * 브리더 프로필 사진 URL
     * @example "https://example.com/profile.jpg"
     */
    @ApiProperty({
        description: '브리더 프로필 사진 URL',
        example: 'https://example.com/profile.jpg',
        required: false,
    })
    breederProfileImage?: string;

    /**
     * 브리더 레벨
     * @example "elite"
     */
    @ApiProperty({
        description: '브리더 레벨 (new, elite)',
        example: 'elite',
        enum: ['new', 'elite'],
    })
    breederLevel: string;

    /**
     * 브리더의 브리딩 동물 종류
     * @example "dog"
     */
    @ApiProperty({
        description: '브리더의 브리딩 동물 종류 (dog, cat)',
        example: 'dog',
        enum: ['dog', 'cat'],
    })
    breedingPetType: string;

    /**
     * 후기 내용
     * @example "정말 좋은 브리더입니다. 반려동물이 건강하고 성격도 좋아요."
     */
    @ApiProperty({
        description: '후기 내용',
        example: '정말 좋은 브리더입니다. 반려동물이 건강하고 성격도 좋아요.',
    })
    content: string;

    /**
     * 후기 종류
     * @example "adoption"
     */
    @ApiProperty({
        description: '후기 종류 (consultation, adoption)',
        example: 'adoption',
        enum: ['consultation', 'adoption'],
    })
    reviewType: string;

    /**
     * 작성 일자
     * @example "2024-01-15T10:30:00.000Z"
     */
    @ApiProperty({
        description: '작성 일자',
        example: '2024-01-15T10:30:00.000Z',
    })
    writtenAt: string;
}

/**
 * 후기 세부 조회 응답 DTO
 */
export class ReviewDetailResponseDto extends MyReviewItemDto {
    /**
     * 공개 여부
     * @example true
     */
    @ApiProperty({
        description: '공개 여부',
        example: true,
    })
    isVisible: boolean;
}
