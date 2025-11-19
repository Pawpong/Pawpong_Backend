import { ApiProperty } from '@nestjs/swagger';

/**
 * 배너 응답 DTO
 */
export class BannerResponseDto {
    /**
     * 배너 ID
     * @example "507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '배너 ID',
        example: '507f1f77bcf86cd799439011',
    })
    bannerId: string;

    /**
     * 배너 이미지 URL (Signed URL)
     * @example "https://storage.googleapis.com/..."
     */
    @ApiProperty({
        description: '배너 이미지 URL',
        example: 'https://storage.googleapis.com/bucket/banners/uuid.png',
    })
    imageUrl: string;

    /**
     * 링크 타입
     * @example "internal"
     */
    @ApiProperty({
        description: '링크 타입 (internal/external)',
        example: 'internal',
        enum: ['internal', 'external'],
    })
    linkType: string;

    /**
     * 링크 URL
     * @example "/explore?animal=dog"
     */
    @ApiProperty({
        description: '배너 클릭 시 이동할 URL',
        example: '/explore?animal=dog',
    })
    linkUrl: string;

    /**
     * 배너 제목 (선택)
     * @example "크리스마스 특별 이벤트"
     */
    @ApiProperty({
        description: '배너 제목',
        example: '크리스마스 특별 이벤트',
        required: false,
    })
    title?: string;

    /**
     * 배너 설명 (선택)
     * @example "2025년 1월 말까지"
     */
    @ApiProperty({
        description: '배너 설명',
        example: '2025년 1월 말까지',
        required: false,
    })
    description?: string;

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
