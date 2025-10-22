import { ApiProperty } from '@nestjs/swagger';

import { PaginationResponseDto } from '../../../../common/dto/pagination/pagination-response.dto';

/**
 * 개체 간단 정보 DTO
 */
export class PetItemDto {
    /**
     * 개체 ID
     * @example "pet-001"
     */
    @ApiProperty({
        description: '개체 ID',
        example: 'pet-001',
    })
    petId: string;

    /**
     * 개체 이름
     * @example "뽀삐"
     */
    @ApiProperty({
        description: '개체 이름',
        example: '뽀삐',
    })
    name: string;

    /**
     * 품종
     * @example "골든 리트리버"
     */
    @ApiProperty({
        description: '품종',
        example: '골든 리트리버',
    })
    breed: string;

    /**
     * 성별
     * @example "male"
     */
    @ApiProperty({
        description: '성별 (male: 수컷, female: 암컷)',
        example: 'male',
        enum: ['male', 'female'],
    })
    gender: string;

    /**
     * 생년월일
     * @example "2024-01-15"
     */
    @ApiProperty({
        description: '생년월일',
        example: '2024-01-15',
        format: 'date',
    })
    birthDate: Date;

    /**
     * 나이 (개월 수)
     * @example 3
     */
    @ApiProperty({
        description: '나이 (개월 수)',
        example: 3,
    })
    ageInMonths: number;

    /**
     * 분양 가격 (원)
     * @example 1500000
     */
    @ApiProperty({
        description: '분양 가격 (원)',
        example: 1500000,
    })
    price: number;

    /**
     * 상태
     * @example "available"
     */
    @ApiProperty({
        description: '상태 (available: 분양가능, reserved: 예약됨, adopted: 입양완료)',
        example: 'available',
        enum: ['available', 'reserved', 'adopted'],
    })
    status: string;

    /**
     * 대표 사진 URL
     * @example "https://example.com/pet1.jpg"
     */
    @ApiProperty({
        description: '대표 사진 URL',
        example: 'https://example.com/pet1.jpg',
    })
    mainPhoto: string;

    /**
     * 사진 개수
     * @example 5
     */
    @ApiProperty({
        description: '사진 개수',
        example: 5,
    })
    photoCount: number;

    /**
     * 백신 접종 완료 여부
     * @example true
     */
    @ApiProperty({
        description: '백신 접종 완료 여부',
        example: true,
    })
    isVaccinated: boolean;

    /**
     * 마이크로칩 등록 여부
     * @example true
     */
    @ApiProperty({
        description: '마이크로칩 등록 여부',
        example: true,
        required: false,
    })
    hasMicrochip?: boolean;

    /**
     * 분양 가능 시작일
     * @example "2024-03-15"
     */
    @ApiProperty({
        description: '분양 가능 시작일',
        example: '2024-03-15',
        format: 'date',
        required: false,
    })
    availableFrom?: Date;
}

/**
 * 개체 목록 응답 DTO
 */
export class PetsListResponseDto extends PaginationResponseDto<PetItemDto> {
    /**
     * 개체 목록
     */
    @ApiProperty({
        description: '개체 목록',
        type: [PetItemDto],
    })
    declare items: PetItemDto[];

    /**
     * 분양 가능한 개체 수
     * @example 5
     */
    @ApiProperty({
        description: '분양 가능한 개체 수',
        example: 5,
    })
    availableCount?: number;

    /**
     * 예약된 개체 수
     * @example 2
     */
    @ApiProperty({
        description: '예약된 개체 수',
        example: 2,
    })
    reservedCount?: number;

    /**
     * 입양 완료된 개체 수
     * @example 10
     */
    @ApiProperty({
        description: '입양 완료된 개체 수',
        example: 10,
    })
    adoptedCount?: number;
}
