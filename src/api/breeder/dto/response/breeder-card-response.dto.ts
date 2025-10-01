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
        example: '68dd57b1ae55c118139f6be3',
    })
    breederId: string;

    /**
     * 브리더명
     * @example "해피독 브리더"
     */
    @ApiProperty({
        description: '브리더명',
        example: '바람개비 펫',
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
        example: '서울특별시 마포구',
    })
    location: string;

    /**
     * 대표 품종
     * @example "말티즈"
     */
    @ApiProperty({
        description: '대표 품종',
        example: '허스키',
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
     * 가격 범위 정보
     * - range: 최소/최대 가격 표시
     * - consultation: 상담 후 결정
     * @example { "min": 1000000, "max": 2000000, "display": "range" }
     */
    @ApiProperty({
        description: '가격 범위 정보 (range: 가격표시, consultation: 상담후결정)',
        example: { min: 0, max: 0, display: 'consultation' },
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
        example: 16,
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
        example: ['https://example.com/photos/rep-29-1.jpg', 'https://example.com/photos/rep-29-2.jpg'],
        isArray: true,
    })
    representativePhotos: string[];

    /**
     * 프로필 이미지 URL
     * @example "https://example.com/profile.jpg"
     */
    @ApiProperty({
        description: '프로필 이미지 URL',
        example: 'https://example.com/profiles/breeder-29.jpg',
        required: false,
    })
    profileImage?: string;

    /**
     * 총 리뷰 개수
     * @example 15
     */
    @ApiProperty({
        description: '총 리뷰 개수',
        example: 0,
    })
    totalReviews: number;

    /**
     * 평균 평점
     * @example 4.5
     */
    @ApiProperty({
        description: '평균 평점',
        example: 0,
    })
    averageRating: number;

    /**
     * 등록일
     * @example "2024-01-15T09:00:00.000Z"
     */
    @ApiProperty({
        description: '등록일',
        example: '2025-10-01T16:32:49.506Z',
    })
    createdAt: Date;
}