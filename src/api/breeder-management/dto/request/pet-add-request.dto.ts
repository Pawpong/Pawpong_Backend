import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, IsEnum, IsBoolean, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

/**
 * 반려동물 등록 요청 DTO
 * 브리더가 새로운 반려동물을 시스템에 등록할 때 사용됩니다.
 */
export class PetAddRequestDto {
    /**
     * 반려동물 이름
     * @example "밀크"
     */
    @ApiProperty({
        description: '반려동물 이름',
        example: '밀크',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    /**
     * 반려동물 품종
     * @example "골든리트리버"
     */
    @ApiProperty({
        description: '반려동물 품종',
        example: '골든리트리버',
    })
    @IsString()
    @IsNotEmpty()
    breed: string;

    /**
     * 반려동물 종류
     * @example "dog"
     */
    @ApiProperty({
        description: '반려동물 종류',
        example: 'dog',
        enum: ['dog', 'cat'],
    })
    @IsEnum(['dog', 'cat'])
    type: string;

    /**
     * 성별
     * @example "male"
     */
    @ApiProperty({
        description: '성별',
        example: 'male',
        enum: ['male', 'female'],
    })
    @IsEnum(['male', 'female'])
    gender: string;

    /**
     * 출생일 (YYYY-MM-DD 형식)
     * @example "2024-01-15"
     */
    @ApiProperty({
        description: '출생일 (YYYY-MM-DD 형식)',
        example: '2024-01-15',
    })
    @IsString()
    @IsNotEmpty()
    birthDate: string;

    /**
     * 분양 가격 (원)
     * @example 1500000
     */
    @ApiProperty({
        description: '분양 가격 (원)',
        example: 1500000,
        minimum: 0,
    })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    price: number;

    /**
     * 반려동물 사진 URL 배열
     * @example ["https://example.com/pet1.jpg", "https://example.com/pet2.jpg"]
     */
    @ApiProperty({
        description: '반려동물 사진 URL 배열',
        type: 'array',
        items: { type: 'string' },
        example: ['https://example.com/pet1.jpg', 'https://example.com/pet2.jpg'],
    })
    @IsArray()
    photos: string[];

    /**
     * 반려동물 상세 설명
     * @example "활발하고 사람을 좋아하는 성격입니다. 기본 훈련이 완료되었습니다."
     */
    @ApiProperty({
        description: '반려동물 상세 설명',
        example: '활발하고 사람을 좋아하는 성격입니다. 기본 훈련이 완료되었습니다.',
        required: false,
    })
    @IsOptional()
    @IsString()
    description?: string;

    /**
     * 접종 기록
     * @example ["광견병 예방접종 (2024-02-01)", "종합백신 1차 (2024-01-20)"]
     */
    @ApiProperty({
        description: '접종 기록',
        type: 'array',
        items: { type: 'string' },
        example: ['광견병 예방접종 (2024-02-01)', '종합백신 1차 (2024-01-20)'],
        required: false,
    })
    @IsOptional()
    @IsArray()
    vaccinations?: string[];

    /**
     * 건강 상태 정보
     * @example "매우 건강하며 유전적 질환 없음"
     */
    @ApiProperty({
        description: '건강 상태 정보',
        example: '매우 건강하며 유전적 질환 없음',
        required: false,
    })
    @IsOptional()
    @IsString()
    healthStatus?: string;

    /**
     * 부모견/부모묘 ID (선택사항)
     * @example "parent_pet_12345"
     */
    @ApiProperty({
        description: '부모견/부모묘 ID',
        example: 'parent_pet_12345',
        required: false,
    })
    @IsOptional()
    @IsString()
    parentPetId?: string;

    /**
     * 중성화 여부
     * @example false
     */
    @ApiProperty({
        description: '중성화 여부',
        example: false,
    })
    @IsBoolean()
    @Transform(({ value }) => {
        if (typeof value === 'string') {
            return value === 'true';
        }
        return value;
    })
    isNeutered: boolean;

    /**
     * 분양 가능 시작일 (YYYY-MM-DD 형식)
     * @example "2024-03-01"
     */
    @ApiProperty({
        description: '분양 가능 시작일 (YYYY-MM-DD 형식)',
        example: '2024-03-01',
        required: false,
    })
    @IsOptional()
    @IsString()
    availableFrom?: string;
}
