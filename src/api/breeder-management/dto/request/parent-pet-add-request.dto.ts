import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
    name: string;

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
     * 소개 (선택)
     * @example "온순하고 건강한 부모견입니다"
     */
    @ApiPropertyOptional({
        description: '소개 (최대 500자)',
        example: '온순하고 건강한 부모견입니다',
        maxLength: 500,
    })
    @IsOptional()
    @IsString()
    description?: string;
}
