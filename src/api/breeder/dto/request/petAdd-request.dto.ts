import {
    IsString,
    IsArray,
    IsOptional,
    IsNumber,
    IsEnum,
    IsNotEmpty,
    IsBoolean,
    ValidateNested,
    IsDateString,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

import { PetType, PetGender } from '../../../../common/enum/user.enum';

/**
 * 반려동물 건강 정보 DTO
 */
export class PetHealthInfoDto {
    /**
     * 예방접종 완료 여부
     * @example true
     */
    @ApiProperty({
        description: '예방접종 완료 여부',
        example: true,
    })
    @IsBoolean()
    isVaccinated: boolean;

    /**
     * 중성화 수술 완료 여부
     * @example false
     */
    @ApiProperty({
        description: '중성화 수술 완료 여부',
        example: false,
    })
    @IsBoolean()
    isNeutered: boolean;

    /**
     * 건강 검진 완료 여부
     * @example true
     */
    @ApiProperty({
        description: '건강 검진 완료 여부',
        example: true,
    })
    @IsBoolean()
    isHealthChecked: boolean;

    /**
     * 특이사항 또는 건강 문제 (선택사항)
     * @example "슬개골 탈구 약함"
     */
    @ApiProperty({
        description: '특이사항 또는 건강 문제',
        example: '슬개골 탈구 약함',
        required: false,
    })
    @IsString()
    @IsOptional()
    healthIssues?: string;
}

/**
 * 부모 반려동물 정보 DTO (부모견/부모묘 등록용)
 */
export class ParentPetAddDto {
    /**
     * 부모 반려동물 이름
     * @example "골든맘"
     */
    @ApiProperty({
        description: '부모 반려동물 이름',
        example: '골든맘',
    })
    @IsString()
    @IsNotEmpty()
    petName: string;

    /**
     * 반려동물 종류 (강아지/고양이)
     * @example "dog"
     */
    @ApiProperty({
        description: '반려동물 종류',
        example: 'dog',
        enum: PetType,
    })
    @IsEnum(PetType)
    petType: PetType;

    /**
     * 품종명
     * @example "골든 리트리버"
     */
    @ApiProperty({
        description: '품종명',
        example: '골든 리트리버',
    })
    @IsString()
    @IsNotEmpty()
    breedName: string;

    /**
     * 나이 (개월 수)
     * @example 36
     */
    @ApiProperty({
        description: '나이 (개월 수)',
        example: 36,
        minimum: 0,
    })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    ageInMonths: number;

    /**
     * 성별
     * @example "female"
     */
    @ApiProperty({
        description: '성별',
        example: 'female',
        enum: PetGender,
    })
    @IsEnum(PetGender)
    gender: PetGender;

    /**
     * 반려동물 사진 URL 배열 (선택사항)
     * @example ["https://example.com/pet1.jpg", "https://example.com/pet2.jpg"]
     */
    @ApiProperty({
        description: '반려동물 사진 URL 배열',
        example: ['https://example.com/pet1.jpg', 'https://example.com/pet2.jpg'],
        type: [String],
        required: false,
    })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    photoUrls?: string[];

    /**
     * 건강 정보
     */
    @ApiProperty({
        description: '건강 정보',
        type: PetHealthInfoDto,
    })
    @ValidateNested()
    @Type(() => PetHealthInfoDto)
    @IsNotEmpty()
    healthInfo: PetHealthInfoDto;
}

/**
 * 분양 가능 반려동물 정보 DTO
 */
export class AvailablePetAddDto {
    /**
     * 반려동물 이름
     * @example "골든베이비"
     */
    @ApiProperty({
        description: '반려동물 이름',
        example: '골든베이비',
    })
    @IsString()
    @IsNotEmpty()
    petName: string;

    /**
     * 반려동물 종류 (강아지/고양이)
     * @example "dog"
     */
    @ApiProperty({
        description: '반려동물 종류',
        example: 'dog',
        enum: PetType,
    })
    @IsEnum(PetType)
    petType: PetType;

    /**
     * 품종명
     * @example "골든 리트리버"
     */
    @ApiProperty({
        description: '품종명',
        example: '골든 리트리버',
    })
    @IsString()
    @IsNotEmpty()
    breedName: string;

    /**
     * 출생일
     * @example "2023-12-15"
     */
    @ApiProperty({
        description: '출생일',
        example: '2023-12-15',
        format: 'date',
    })
    @IsDateString()
    birthDate: string;

    /**
     * 성별
     * @example "male"
     */
    @ApiProperty({
        description: '성별',
        example: 'male',
        enum: PetGender,
    })
    @IsEnum(PetGender)
    gender: PetGender;

    /**
     * 반려동물 사진 URL 배열 (선택사항)
     * @example ["https://example.com/baby1.jpg", "https://example.com/baby2.jpg"]
     */
    @ApiProperty({
        description: '반려동물 사진 URL 배열',
        example: ['https://example.com/baby1.jpg', 'https://example.com/baby2.jpg'],
        type: [String],
        required: false,
    })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    photoUrls?: string[];

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
     * 건강 정보
     */
    @ApiProperty({
        description: '건강 정보',
        type: PetHealthInfoDto,
    })
    @ValidateNested()
    @Type(() => PetHealthInfoDto)
    @IsNotEmpty()
    healthInfo: PetHealthInfoDto;

    /**
     * 부모 정보 (선택사항)
     */
    @ApiProperty({
        description: '부모 정보',
        required: false,
    })
    @IsOptional()
    parentInfo?: {
        /**
         * 어미 반려동물 ID
         * @example "507f1f77bcf86cd799439066"
         */
        motherPetId?: string;
        /**
         * 아비 반려동물 ID
         * @example "507f1f77bcf86cd799439077"
         */
        fatherPetId?: string;
    };
}
