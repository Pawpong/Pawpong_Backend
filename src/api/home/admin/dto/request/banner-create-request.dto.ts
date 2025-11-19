import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 배너 생성 요청 DTO
 */
export class BannerCreateRequestDto {
    /**
     * 배너 이미지 파일명
     * @example "banners/uuid.png"
     */
    @ApiProperty({
        description: '배너 이미지 파일명 (업로드된 파일 경로)',
        example: 'banners/uuid.png',
    })
    @IsString()
    imageFileName: string;

    /**
     * 링크 타입
     * @example "internal"
     */
    @ApiProperty({
        description: '링크 타입',
        enum: ['internal', 'external'],
        example: 'internal',
    })
    @IsEnum(['internal', 'external'])
    linkType: string;

    /**
     * 링크 URL
     * @example "/explore?animal=dog"
     */
    @ApiProperty({
        description: '배너 클릭 시 이동할 URL',
        example: '/explore?animal=dog',
    })
    @IsString()
    linkUrl: string;

    /**
     * 정렬 순서
     * @example 1
     */
    @ApiPropertyOptional({
        description: '정렬 순서 (낮을수록 먼저 표시)',
        example: 1,
        minimum: 0,
        default: 0,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    order?: number = 0;

    /**
     * 활성화 여부
     * @example true
     */
    @ApiPropertyOptional({
        description: '활성화 여부',
        example: true,
        default: true,
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isActive?: boolean = true;

    /**
     * 배너 제목 (선택)
     * @example "크리스마스 특별 이벤트"
     */
    @ApiPropertyOptional({
        description: '배너 제목 (관리용)',
        example: '크리스마스 특별 이벤트',
    })
    @IsOptional()
    @IsString()
    title?: string;

    /**
     * 배너 설명 (선택)
     * @example "2025년 1월 말까지"
     */
    @ApiPropertyOptional({
        description: '배너 설명 (관리용)',
        example: '2025년 1월 말까지',
    })
    @IsOptional()
    @IsString()
    description?: string;
}
