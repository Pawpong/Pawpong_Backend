import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponseDto } from '../../../../common/dto/pagination/pagination-response.dto';

/**
 * 브리더 자신의 개체 간단 정보 DTO (관리용)
 */
export class MyPetItemDto {
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
     * 활성화 여부
     * @example true
     */
    @ApiProperty({
        description: '활성화 여부 (false면 숨김 처리)',
        example: true,
    })
    isActive: boolean;

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
     * 조회수
     * @example 125
     */
    @ApiProperty({
        description: '조회수',
        example: 125,
    })
    viewCount: number;

    /**
     * 입양 신청 수
     * @example 3
     */
    @ApiProperty({
        description: '받은 입양 신청 수',
        example: 3,
    })
    applicationCount: number;

    /**
     * 등록일시
     * @example "2024-01-15T10:30:00.000Z"
     */
    @ApiProperty({
        description: '등록일시',
        example: '2024-01-15T10:30:00.000Z',
        format: 'date-time',
    })
    createdAt: Date;

    /**
     * 최종 수정일시
     * @example "2024-01-20T15:45:00.000Z"
     */
    @ApiProperty({
        description: '최종 수정일시',
        example: '2024-01-20T15:45:00.000Z',
        format: 'date-time',
    })
    updatedAt: Date;
}

/**
 * 브리더 자신의 개체 목록 응답 DTO
 */
export class MyPetsListResponseDto extends PaginationResponseDto<MyPetItemDto> {
    /**
     * 개체 목록
     */
    @ApiProperty({
        description: '개체 목록',
        type: [MyPetItemDto],
    })
    declare items: MyPetItemDto[];

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

    /**
     * 비활성화된 개체 수
     * @example 1
     */
    @ApiProperty({
        description: '비활성화된 개체 수',
        example: 1,
    })
    inactiveCount?: number;
}
