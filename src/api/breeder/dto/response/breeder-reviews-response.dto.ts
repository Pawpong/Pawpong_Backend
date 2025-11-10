import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponseDto } from '../../../../common/dto/pagination/pagination-response.dto';

/**
 * 브리더 후기 데이터 DTO
 */
export class BreederReviewItemDto {
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
     * 입양 신청 ID
     * @example "507f1f77bcf86cd799439012"
     */
    @ApiProperty({
        description: '입양 신청 ID',
        example: '507f1f77bcf86cd799439012',
    })
    applicationId: string;

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
     * 입양한 반려동물 이름 (신청 시 특정 개체 지정한 경우)
     * @example "뽀삐"
     */
    @ApiProperty({
        description: '입양한 반려동물 이름',
        example: '뽀삐',
        required: false,
    })
    petName?: string;

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
        description: '후기 타입 (consultation: 상담후기 | adoption: 입양완료후기)',
        example: 'adoption',
        enum: ['consultation', 'adoption'],
    })
    type: string;
}

/**
 * 브리더 후기 목록 응답 DTO
 */
export class BreederReviewsResponseDto extends PaginationResponseDto<BreederReviewItemDto> {
    /**
     * 후기 목록
     */
    @ApiProperty({
        description: '후기 목록',
        type: [BreederReviewItemDto],
    })
    declare items: BreederReviewItemDto[];
}
