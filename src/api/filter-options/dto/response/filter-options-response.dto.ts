import { ApiProperty } from '@nestjs/swagger';

/**
 * 브리더 레벨 옵션 DTO
 */
export class BreederLevelOptionDto {
    @ApiProperty({
        description: '브리더 레벨 값',
        example: 'elite',
        enum: ['elite', 'new'],
    })
    value: string;

    @ApiProperty({
        description: '브리더 레벨 레이블',
        example: '엘리트',
    })
    label: string;

    @ApiProperty({
        description: '브리더 레벨 설명',
        example: '인증된 전문 브리더',
    })
    description: string;
}

/**
 * 정렬 옵션 DTO
 */
export class SortOptionDto {
    @ApiProperty({
        description: '정렬 값',
        example: 'latest',
        enum: ['latest', 'favorite', 'review', 'price_asc', 'price_desc'],
    })
    value: string;

    @ApiProperty({
        description: '정렬 레이블',
        example: '최신순',
    })
    label: string;

    @ApiProperty({
        description: '정렬 설명',
        example: '최근 등록된 브리더순',
    })
    description: string;
}

/**
 * 강아지 크기 옵션 DTO
 */
export class DogSizeOptionDto {
    @ApiProperty({
        description: '강아지 크기 값',
        example: 'small',
        enum: ['small', 'medium', 'large'],
    })
    value: string;

    @ApiProperty({
        description: '강아지 크기 레이블',
        example: '소형견',
    })
    label: string;

    @ApiProperty({
        description: '강아지 크기 설명',
        example: '10kg 미만',
    })
    description: string;
}

/**
 * 고양이 털 길이 옵션 DTO
 */
export class CatFurLengthOptionDto {
    @ApiProperty({
        description: '고양이 털 길이 값',
        example: 'short',
        enum: ['short', 'long'],
    })
    value: string;

    @ApiProperty({
        description: '고양이 털 길이 레이블',
        example: '단모',
    })
    label: string;

    @ApiProperty({
        description: '고양이 털 길이 설명',
        example: '짧은 털',
    })
    description: string;
}

/**
 * 입양 가능 여부 옵션 DTO
 */
export class AdoptionStatusOptionDto {
    @ApiProperty({
        description: '입양 가능 여부 값',
        example: true,
    })
    value: boolean;

    @ApiProperty({
        description: '입양 가능 여부 레이블',
        example: '입양 가능',
    })
    label: string;

    @ApiProperty({
        description: '입양 가능 여부 설명',
        example: '현재 입양 가능한 반려동물이 있는 브리더',
    })
    description: string;
}

/**
 * 전체 필터 옵션 응답 DTO
 */
export class AllFilterOptionsResponseDto {
    @ApiProperty({
        description: '브리더 레벨 옵션',
        type: [BreederLevelOptionDto],
    })
    breederLevels: BreederLevelOptionDto[];

    @ApiProperty({
        description: '정렬 옵션',
        type: [SortOptionDto],
    })
    sortOptions: SortOptionDto[];

    @ApiProperty({
        description: '강아지 크기 옵션',
        type: [DogSizeOptionDto],
    })
    dogSizes: DogSizeOptionDto[];

    @ApiProperty({
        description: '고양이 털 길이 옵션',
        type: [CatFurLengthOptionDto],
    })
    catFurLengths: CatFurLengthOptionDto[];

    @ApiProperty({
        description: '입양 가능 여부 옵션',
        type: [AdoptionStatusOptionDto],
    })
    adoptionStatus: AdoptionStatusOptionDto[];
}
