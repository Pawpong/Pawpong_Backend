import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * 부모견/부모묘 등록 요청 DTO
 * 브리더가 번식용 부모 반려동물을 등록할 때 사용됩니다.
 */
export class ParentPetAddDto {
    /**
     * 부모 반려동물 이름
     * @example "챔프"
     */
    @ApiProperty({
        description: '부모 반려동물 이름',
        example: '챔프',
    })
    @IsString()
    @IsNotEmpty()
    petName: string;

    /**
     * 품종
     * @example "골든리트리버"
     */
    @ApiProperty({
        description: '품종',
        example: '골든리트리버',
    })
    @IsString()
    @IsNotEmpty()
    breedName: string;

    /**
     * 성별
     * @example "male"
     */
    @ApiProperty({
        description: '성별',
        example: 'male',
        enum: ['male', 'female'],
    })
    @IsString()
    @IsNotEmpty()
    gender: string;

    /**
     * 나이 (개월)
     * @example 36
     */
    @ApiProperty({
        description: '나이 (개월)',
        example: 36,
        minimum: 0,
    })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    ageInMonths: number;

    /**
     * 반려동물 종류
     * @example "dog"
     */
    @ApiProperty({
        description: '반려동물 종류',
        example: 'dog',
        enum: ['dog', 'cat'],
    })
    @IsString()
    @IsNotEmpty()
    petType: string;

    /**
     * 부모 반려동물 사진 URL 배열
     * @example ["https://example.com/parent1.jpg"]
     */
    @ApiProperty({
        description: '부모 반려동물 사진 URL 배열',
        type: 'array',
        items: { type: 'string' },
        example: ['https://example.com/parent1.jpg'],
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
