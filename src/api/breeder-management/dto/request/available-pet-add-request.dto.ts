import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

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
     * 소개 (선택)
     * @example "건강하고 활발한 아이입니다"
     */
    @ApiPropertyOptional({
        description: '소개 (최대 500자)',
        example: '건강하고 활발한 아이입니다',
        maxLength: 500,
    })
    @IsOptional()
    @IsString()
    description?: string;

    /**
     * 부모 정보 (선택)
     */
    @ApiPropertyOptional({
        description: '부모 정보',
        example: { mother: '507f1f77bcf86cd799439011', father: '507f1f77bcf86cd799439012' },
    })
    @IsOptional()
    parentInfo?: {
        mother?: string;
        father?: string;
    };
}
