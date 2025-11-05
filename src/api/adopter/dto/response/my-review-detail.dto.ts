import { ApiProperty } from '@nestjs/swagger';

/**
 * 후기 세부 조회 응답 DTO
 *
 * GET /api/adopter/reviews/:id (상세)
 * 입양자가 작성한 특정 후기의 상세 정보를 담는 DTO입니다.
 */
export class MyReviewDetailDto {
    /**
     * 후기 고유 ID
     * @example "507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '후기 고유 ID',
        example: '507f1f77bcf86cd799439011',
    })
    reviewId: string;

    /**
     * 브리더 닉네임
     * @example "사랑스러운강아지"
     */
    @ApiProperty({
        description: '브리더 닉네임',
        example: '사랑스러운강아지',
    })
    breederNickname: string;

    /**
     * 브리더 프로필 이미지 URL (Signed URL, 1시간 유효)
     * @example "https://storage.googleapis.com/..."
     */
    @ApiProperty({
        description: '브리더 프로필 이미지 URL (Signed URL, 1시간 유효)',
        example: 'https://storage.googleapis.com/pawpong/profiles/breeder123.jpg',
        nullable: true,
    })
    breederProfileImage: string | null;

    /**
     * 브리더 레벨
     * @example "gold"
     */
    @ApiProperty({
        description: '브리더 레벨 (new, bronze, silver, gold, platinum)',
        example: 'gold',
    })
    breederLevel: string;

    /**
     * 브리딩 동물 종류
     * @example "dog"
     */
    @ApiProperty({
        description: '브리딩 동물 종류 (dog, cat)',
        example: 'dog',
    })
    breedingPetType: string;

    /**
     * 후기 내용
     * @example "친절하고 전문적인 브리더님이셨습니다. 강아지도 매우 건강합니다."
     */
    @ApiProperty({
        description: '후기 내용',
        example: '친절하고 전문적인 브리더님이셨습니다. 강아지도 매우 건강합니다.',
    })
    content: string;

    /**
     * 후기 유형
     * @example "adoption_completed"
     */
    @ApiProperty({
        description: '후기 유형',
        example: 'adoption_completed',
    })
    reviewType: string;

    /**
     * 후기 작성 일시
     * @example "2025-01-15T10:30:00.000Z"
     */
    @ApiProperty({
        description: '후기 작성 일시 (ISO 8601 형식)',
        example: '2025-01-15T10:30:00.000Z',
    })
    writtenAt: Date;

    /**
     * 후기 공개 여부
     * @example true
     */
    @ApiProperty({
        description: '후기 공개 여부 (true: 공개, false: 비공개)',
        example: true,
    })
    isVisible: boolean;
}
