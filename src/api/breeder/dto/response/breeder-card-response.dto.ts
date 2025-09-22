import { ApiProperty } from '@nestjs/swagger';

/**
 * 브리더 카드뷰 응답 DTO
 * 탐색 화면에서 보여질 브리더 카드 정보입니다.
 */
export class BreederCardResponseDto {
    /**
     * 브리더 ID
     * @example "507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '브리더 ID',
        example: '507f1f77bcf86cd799439011',
    })
    breederId: string;

    /**
     * 브리더명
     * @example "해피독 브리더"
     */
    @ApiProperty({
        description: '브리더명',
        example: '해피독 브리더',
    })
    breederName: string;

    /**
     * 브리더 레벨
     * @example "new"
     */
    @ApiProperty({
        description: '브리더 레벨',
        enum: ['new', 'elite'],
        example: 'new',
    })
    breederLevel: string;

    /**
     * 지역 (광역시/도 + 시/군/구)
     * @example "경기도 파주시"
     */
    @ApiProperty({
        description: '지역',
        example: '경기도 파주시',
    })
    location: string;

    /**
     * 대표 품종
     * @example "말티즈"
     */
    @ApiProperty({
        description: '대표 품종',
        example: '말티즈',
    })
    mainBreed: string;

    /**
     * 입양 가능 여부
     * @example true
     */
    @ApiProperty({
        description: '입양 가능 여부',
        example: true,
    })
    isAdoptionAvailable: boolean;

    /**
     * 가격 범위 (로그인 시에만 노출)
     * @example { "min": 1000000, "max": 2000000 }
     */
    @ApiProperty({
        description: '가격 범위',
        example: { min: 1000000, max: 2000000 },
        required: false,
    })
    priceRange?: {
        min: number;
        max: number;
        display: string; // "range" | "consultation"
    };

    /**
     * 찜 개수
     * @example 42
     */
    @ApiProperty({
        description: '찜 개수',
        example: 42,
    })
    favoriteCount: number;

    /**
     * 현재 사용자의 찜 여부
     * @example false
     */
    @ApiProperty({
        description: '현재 사용자의 찜 여부',
        example: false,
    })
    isFavorited: boolean;

    /**
     * 대표 사진 URL 배열 (최대 3장)
     * @example ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"]
     */
    @ApiProperty({
        description: '대표 사진 URL 배열',
        example: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
        isArray: true,
    })
    representativePhotos: string[];

    /**
     * 프로필 이미지 URL
     * @example "https://example.com/profile.jpg"
     */
    @ApiProperty({
        description: '프로필 이미지 URL',
        example: 'https://example.com/profile.jpg',
        required: false,
    })
    profileImage?: string;

    /**
     * 총 리뷰 개수
     * @example 15
     */
    @ApiProperty({
        description: '총 리뷰 개수',
        example: 15,
    })
    totalReviews: number;

    /**
     * 평균 평점
     * @example 4.5
     */
    @ApiProperty({
        description: '평균 평점',
        example: 4.5,
    })
    averageRating: number;

    /**
     * 등록일
     * @example "2024-01-15T09:00:00.000Z"
     */
    @ApiProperty({
        description: '등록일',
        example: '2024-01-15T09:00:00.000Z',
    })
    createdAt: Date;
}