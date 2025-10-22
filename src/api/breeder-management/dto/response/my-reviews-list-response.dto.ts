import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponseDto } from '../../../../common/dto/pagination/pagination-response.dto';

/**
 * 브리더 자신의 후기 항목 DTO (관리용)
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
     * 작성자 ID
     * @example "507f1f77bcf86cd799439012"
     */
    @ApiProperty({
        description: '작성자 (입양자) ID',
        example: '507f1f77bcf86cd799439012',
    })
    adopterId: string;

    /**
     * 작성자 이름
     * @example "김입양자"
     */
    @ApiProperty({
        description: '작성자 이름',
        example: '김입양자',
    })
    adopterName: string;

    /**
     * 입양한 반려동물 이름
     * @example "뽀삐"
     */
    @ApiProperty({
        description: '입양한 반려동물 이름',
        example: '뽀삐',
        required: false,
    })
    petName?: string;

    /**
     * 전체 평점 (1-5)
     * @example 4.5
     */
    @ApiProperty({
        description: '전체 평점 (1-5)',
        example: 4.5,
    })
    rating: number;

    /**
     * 반려동물 건강 평점 (1-5)
     * @example 5
     */
    @ApiProperty({
        description: '반려동물 건강 평점',
        example: 5,
        required: false,
    })
    petHealthRating?: number;

    /**
     * 의사소통 평점 (1-5)
     * @example 4
     */
    @ApiProperty({
        description: '의사소통 평점',
        example: 4,
        required: false,
    })
    communicationRating?: number;

    /**
     * 후기 내용
     * @example "친절하고 건강한 강아지를 분양받았습니다."
     */
    @ApiProperty({
        description: '후기 내용',
        example: '친절하고 건강한 강아지를 분양받았습니다.',
    })
    content: string;

    /**
     * 후기 사진 URL 배열
     * @example ["https://example.com/photo1.jpg"]
     */
    @ApiProperty({
        description: '후기 사진 URL 배열',
        example: ['https://example.com/photo1.jpg'],
        type: [String],
        required: false,
    })
    photos?: string[];

    /**
     * 작성일시
     * @example "2024-01-15T10:30:00.000Z"
     */
    @ApiProperty({
        description: '작성일시',
        example: '2024-01-15T10:30:00.000Z',
        format: 'date-time',
    })
    writtenAt: Date;

    /**
     * 후기 타입
     * @example "adoption"
     */
    @ApiProperty({
        description: '후기 타입 (adoption: 입양 후기, visit: 방문 후기)',
        example: 'adoption',
        enum: ['adoption', 'visit'],
        required: false,
    })
    type?: string;

    /**
     * 공개 여부
     * @example true
     */
    @ApiProperty({
        description: '공개 여부 (false면 관리자가 숨김 처리)',
        example: true,
    })
    isVisible: boolean;

    /**
     * 신고 횟수
     * @example 0
     */
    @ApiProperty({
        description: '신고 횟수',
        example: 0,
    })
    reportCount?: number;
}

/**
 * 브리더 자신의 후기 목록 응답 DTO
 */
export class MyReviewsListResponseDto extends PaginationResponseDto<MyReviewItemDto> {
    /**
     * 후기 목록
     */
    @ApiProperty({
        description: '후기 목록',
        type: [MyReviewItemDto],
    })
    declare items: MyReviewItemDto[];

    /**
     * 평균 평점
     * @example 4.5
     */
    @ApiProperty({
        description: '평균 평점',
        example: 4.5,
    })
    averageRating?: number;

    /**
     * 총 후기 수
     * @example 42
     */
    @ApiProperty({
        description: '총 후기 수',
        example: 42,
    })
    totalReviews?: number;

    /**
     * 공개된 후기 수
     * @example 40
     */
    @ApiProperty({
        description: '공개된 후기 수',
        example: 40,
    })
    visibleReviews?: number;

    /**
     * 숨겨진 후기 수
     * @example 2
     */
    @ApiProperty({
        description: '숨겨진 후기 수',
        example: 2,
    })
    hiddenReviews?: number;
}
