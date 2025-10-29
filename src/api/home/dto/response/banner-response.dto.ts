import { ApiProperty } from '@nestjs/swagger';

/**
 * 배너 응답 DTO
 */
export class BannerResponseDto {
    @ApiProperty({
        description: '배너 ID',
        example: '507f1f77bcf86cd799439011',
    })
    id: string;

    @ApiProperty({
        description: '배너 이미지 URL (Signed URL)',
        example: 'https://cdn.pawpong.kr/banners/uuid.png?Expires=...',
    })
    imageUrl: string;

    @ApiProperty({
        description: '링크 타입',
        example: 'internal',
        enum: ['internal', 'external'],
    })
    linkType: string;

    @ApiProperty({
        description: '링크 URL',
        example: '/explore?animal=dog',
    })
    linkUrl: string;

    @ApiProperty({
        description: '정렬 순서',
        example: 1,
    })
    order: number;

    @ApiProperty({
        description: '배너 제목 (선택)',
        example: '크리스마스 특별 이벤트',
        required: false,
    })
    title?: string;
}
