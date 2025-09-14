import { IsString, IsNotEmpty, IsNumber, Min, Max, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 입양자 후기 작성 요청 DTO
 * 입양 완료 후 브리더에 대한 후기를 작성할 때 사용됩니다.
 */
export class ReviewCreateRequestDto {
    /**
     * 입양 신청 ID (후기 작성 권한 확인용)
     * @example "app_507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '입양 신청 ID',
        example: 'app_507f1f77bcf86cd799439011',
    })
    @IsString()
    @IsNotEmpty()
    applicationId: string;

    /**
     * 후기 타입 (general, health, communication)
     * @example "general"
     */
    @ApiProperty({
        description: '후기 타입',
        example: 'general',
        enum: ['general', 'health', 'communication'],
    })
    @IsString()
    @IsNotEmpty()
    reviewType: string;

    /**
     * 후기를 작성할 브리더 ID
     * @example "507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '후기를 작성할 브리더 ID',
        example: '507f1f77bcf86cd799439011',
    })
    @IsString()
    @IsNotEmpty()
    breederId: string;

    /**
     * 전체 평점 (1-5점)
     * @example 5
     */
    @ApiProperty({
        description: '전체 평점 (1-5점)',
        example: 5,
        minimum: 1,
        maximum: 5,
    })
    @IsNumber()
    @Min(1)
    @Max(5)
    rating: number;

    /**
     * 후기 내용
     * @example "정말 좋은 브리더입니다. 반려동물이 건강하고 성격도 좋아요."
     */
    @ApiProperty({
        description: '후기 내용',
        example: '정말 좋은 브리더입니다. 반려동물이 건강하고 성격도 좋아요.',
    })
    @IsString()
    @IsNotEmpty()
    content: string;

    /**
     * 반려동물 건강 상태 평점 (1-5점)
     * @example 5
     */
    @ApiProperty({
        description: '반려동물 건강 상태 평점 (1-5점)',
        example: 5,
        minimum: 1,
        maximum: 5,
    })
    @IsNumber()
    @Min(1)
    @Max(5)
    petHealthRating: number;

    /**
     * 브리더 소통 능력 평점 (1-5점)
     * @example 4
     */
    @ApiProperty({
        description: '브리더 소통 능력 평점 (1-5점)',
        example: 4,
        minimum: 1,
        maximum: 5,
    })
    @IsNumber()
    @Min(1)
    @Max(5)
    communicationRating: number;

    /**
     * 시설 환경 평점 (1-5점, 선택사항)
     * @example 5
     */
    @ApiProperty({
        description: '시설 환경 평점 (1-5점)',
        example: 5,
        minimum: 1,
        maximum: 5,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(5)
    facilityRating?: number;

    /**
     * 후기 사진 URL 배열 (선택사항)
     * @example ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"]
     */
    @ApiProperty({
        description: '후기 사진 URL 배열',
        example: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
        type: [String],
        required: false,
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    photos?: string[];
}
