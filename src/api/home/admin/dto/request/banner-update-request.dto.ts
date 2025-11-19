import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 배너 수정 요청 DTO
 */
export class BannerUpdateRequestDto {
    /**
     * 배너 이미지 파일명
     * @example "banners/uuid.png"
     */
    @ApiPropertyOptional({
        description: '배너 이미지 파일명',
        example: 'banners/uuid.png',
    })
    @IsOptional()
    @IsString()
    imageFileName?: string;

    /**
     * 링크 타입
     * @example "internal"
     */
    @ApiPropertyOptional({
        description: '링크 타입',
        enum: ['internal', 'external'],
        example: 'internal',
    })
    @IsOptional()
    @IsEnum(['internal', 'external'])
    linkType?: string;

    /**
     * 링크 URL
     * @example "/explore?animal=dog"
     */
    @ApiPropertyOptional({
        description: '배너 클릭 시 이동할 URL',
        example: '/explore?animal=dog',
    })
    @IsOptional()
    @IsString()
    linkUrl?: string;

    /**
     * 정렬 순서
     * @example 1
     */
    @ApiPropertyOptional({
        description: '정렬 순서',
        example: 1,
        minimum: 0,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    order?: number;

    /**
     * 활성화 여부
     * @example true
     */
    @ApiPropertyOptional({
        description: '활성화 여부',
        example: true,
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isActive?: boolean;

    /**
     * 배너 제목
     * @example "크리스마스 특별 이벤트"
     */
    @ApiPropertyOptional({
        description: '배너 제목',
        example: '크리스마스 특별 이벤트',
    })
    @IsOptional()
    @IsString()
    title?: string;

    /**
     * 배너 설명
     * @example "2025년 1월 말까지"
     */
    @ApiPropertyOptional({
        description: '배너 설명',
        example: '2025년 1월 말까지',
    })
    @IsOptional()
    @IsString()
    description?: string;
}
