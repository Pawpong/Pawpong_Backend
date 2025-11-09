import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 부모견/부모묘 수정 요청 DTO
 * 브리더가 등록된 부모 반려동물 정보를 수정할 때 사용됩니다.
 * 모든 필드는 선택적입니다.
 */
export class ParentPetUpdateDto {
    /**
     * 부모 반려동물 이름
     * @example "챔프"
     */
    @ApiPropertyOptional({
        description: '부모 반려동물 이름',
        example: '챔프',
    })
    @IsOptional()
    @IsString()
    name?: string;

    /**
     * 품종
     * @example "골든리트리버"
     */
    @ApiPropertyOptional({
        description: '품종',
        example: '골든리트리버',
    })
    @IsOptional()
    @IsString()
    breed?: string;

    /**
     * 성별
     * @example "male"
     */
    @ApiPropertyOptional({
        description: '성별',
        example: 'male',
        enum: ['male', 'female'],
    })
    @IsOptional()
    @IsEnum(['male', 'female'])
    gender?: string;

    /**
     * 생년월일
     * @example "2020-05-15"
     */
    @ApiPropertyOptional({
        description: '생년월일 (YYYY-MM-DD 형식)',
        example: '2020-05-15',
    })
    @IsOptional()
    @IsDateString()
    birthDate?: string;

    /**
     * 부모견/부모묘 사진 파일명
     * @example "parents/uuid.jpg"
     */
    @ApiPropertyOptional({
        description: '부모견/부모묘 사진 파일명',
        example: 'parents/uuid.jpg',
    })
    @IsOptional()
    @IsString()
    photoFileName?: string;

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
