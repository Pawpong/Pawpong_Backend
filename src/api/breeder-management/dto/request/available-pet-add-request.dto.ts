import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, IsEnum, IsBoolean, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

/**
 * 분양 가능한 반려동물 등록 요청 DTO
 * 브리더가 분양용 반려동물을 등록할 때 사용됩니다.
 */
export class AvailablePetAddDto {
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
    petName: string;

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
    breedName: string;

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
    petType: string;

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
    adoptionPrice: number;

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
    photoUrls: string[];

    /**
     * 건강 정보
     * @example { "isVaccinated": true, "isNeutered": false, "isHealthChecked": true, "healthIssues": "" }
     */
    @ApiProperty({
        description: '건강 정보',
        type: 'object',
        additionalProperties: true,
        example: { isVaccinated: true, isNeutered: false, isHealthChecked: true, healthIssues: '' },
    })
    @IsOptional()
    healthInfo?: {
        isVaccinated: boolean;
        isNeutered: boolean;
        isHealthChecked: boolean;
        healthIssues?: string;
    };
}
