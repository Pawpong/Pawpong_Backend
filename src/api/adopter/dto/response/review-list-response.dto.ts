import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponseDto } from '../../../../common/dto/pagination/pagination-response.dto';

/**
 * 작성한 후기 데이터 DTO
 * 단일 후기의 정보를 나타냅니다.
 */
export class WrittenReviewDataDto {
    /**
     * 후기 ID
     */
    @ApiProperty({ description: '후기 ID' })
    reviewId: string;

    /**
     * 브리더 ID
     */
    @ApiProperty({ description: '브리더 ID' })
    breederId: string;

    /**
     * 브리더 이름
     */
    @ApiProperty({ description: '브리더 이름' })
    breederName: string;

    /**
     * 관련 입양 신청 ID
     */
    @ApiProperty({ description: '관련 입양 신청 ID' })
    applicationId: string;

    /**
     * 후기 종류
     */
    @ApiProperty({
        description: '후기 종류',
        enum: ['adoption_completed', 'experience_sharing'],
    })
    reviewType: string;

    /**
     * 전체 평점 (1-5)
     */
    @ApiProperty({ description: '전체 평점 (1-5)' })
    overallRating: number;

    /**
     * 반려동물 건강 상태 평점 (1-5)
     */
    @ApiProperty({ description: '반려동물 건강 상태 평점 (1-5)' })
    petHealthRating: number;

    /**
     * 소통 능력 평점 (1-5)
     */
    @ApiProperty({ description: '소통 능력 평점 (1-5)' })
    communicationRating: number;

    /**
     * 시설 환경 평점 (1-5)
     */
    @ApiProperty({ description: '시설 환경 평점 (1-5)', required: false })
    facilityRating?: number;

    /**
     * 후기 내용
     */
    @ApiProperty({ description: '후기 내용' })
    reviewContent: string;

    /**
     * 후기 사진 URL 배열
     */
    @ApiProperty({
        description: '후기 사진 URL 배열',
        type: [String],
    })
    reviewPhotoUrls: string[];

    /**
     * 작성 일시
     */
    @ApiProperty({ description: '작성 일시', format: 'date-time' })
    createdAt: Date;

    /**
     * 공개 여부
     */
    @ApiProperty({ description: '공개 여부' })
    isVisible: boolean;
}

/**
 * 작성한 후기 목록 조회 응답 DTO
 * 공통 페이지네이션 모듈을 활용한 입양자가 작성한 후기 목록 응답입니다.
 */
export class ReviewListResponseDto extends PaginationResponseDto<WrittenReviewDataDto> {
    /**
     * 작성한 후기 목록 (items 필드를 override하여 명확한 타입 지정)
     */
    @ApiProperty({
        description: '작성한 후기 목록',
        type: [WrittenReviewDataDto],
    })
    declare items: WrittenReviewDataDto[];

    /**
     * 평균 평점 통계
     */
    @ApiProperty({
        description: '평균 평점 통계',
        type: 'object',
        properties: {
            overallAverage: { type: 'number', description: '전체 평균 평점' },
            petHealthAverage: { type: 'number', description: '반려동물 건강 평균 평점' },
            communicationAverage: { type: 'number', description: '소통 평균 평점' },
            facilityAverage: { type: 'number', description: '시설 환경 평균 평점' },
        },
    })
    averageRatings: {
        overallAverage: number;
        petHealthAverage: number;
        communicationAverage: number;
        facilityAverage: number;
    };
}
