import { ApiProperty } from '@nestjs/swagger';

/**
 * 백신 접종 정보 DTO
 */
export class VaccinationDto {
    /**
     * 백신 이름
     * @example "DHPPL"
     */
    @ApiProperty({
        description: '백신 이름',
        example: 'DHPPL',
    })
    name: string;

    /**
     * 접종 일자
     * @example "2024-01-15"
     */
    @ApiProperty({
        description: '접종 일자',
        example: '2024-01-15',
        format: 'date',
    })
    date: Date;

    /**
     * 다음 접종 예정일
     * @example "2024-04-15"
     */
    @ApiProperty({
        description: '다음 접종 예정일',
        example: '2024-04-15',
        format: 'date',
        required: false,
    })
    nextDate?: Date;
}

/**
 * 건강 기록 DTO
 */
export class HealthRecordDto {
    /**
     * 기록 타입
     * @example "checkup"
     */
    @ApiProperty({
        description: '기록 타입 (checkup: 건강검진, treatment: 치료)',
        example: 'checkup',
        enum: ['checkup', 'treatment', 'vaccination'],
    })
    type: string;

    /**
     * 기록 내용
     * @example "정기 건강검진 완료"
     */
    @ApiProperty({
        description: '기록 내용',
        example: '정기 건강검진 완료',
    })
    description: string;

    /**
     * 기록 일자
     * @example "2024-01-15"
     */
    @ApiProperty({
        description: '기록 일자',
        example: '2024-01-15',
        format: 'date',
    })
    date: Date;

    /**
     * 수의사 이름
     * @example "김수의사"
     */
    @ApiProperty({
        description: '수의사 이름',
        example: '김수의사',
        required: false,
    })
    veterinarian?: string;
}

/**
 * 부모 정보 DTO
 */
export class ParentInfoDto {
    /**
     * 부모 ID
     * @example "parent-001"
     */
    @ApiProperty({
        description: '부모 ID',
        example: 'parent-001',
    })
    petId: string;

    /**
     * 부모 이름
     * @example "아빠견"
     */
    @ApiProperty({
        description: '부모 이름',
        example: '아빠견',
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
     * 사진 URL
     * @example "https://example.com/parent.jpg"
     */
    @ApiProperty({
        description: '사진 URL',
        example: 'https://example.com/parent.jpg',
        required: false,
    })
    photo?: string;
}

/**
 * 개체 상세 정보 응답 DTO
 */
export class PetDetailResponseDto {
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
     * 개체 설명
     * @example "활발하고 건강한 골든 리트리버입니다."
     */
    @ApiProperty({
        description: '개체 설명',
        example: '활발하고 건강한 골든 리트리버입니다.',
        required: false,
    })
    description?: string;

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
     * 개체 사진 URL 배열
     * @example ["https://example.com/pet1.jpg", "https://example.com/pet2.jpg"]
     */
    @ApiProperty({
        description: '개체 사진 URL 배열',
        example: ['https://example.com/pet1.jpg', 'https://example.com/pet2.jpg'],
        type: [String],
    })
    photos: string[];

    /**
     * 백신 접종 기록
     */
    @ApiProperty({
        description: '백신 접종 기록',
        type: [VaccinationDto],
        required: false,
    })
    vaccinations?: VaccinationDto[];

    /**
     * 건강 기록
     */
    @ApiProperty({
        description: '건강 기록',
        type: [HealthRecordDto],
        required: false,
    })
    healthRecords?: HealthRecordDto[];

    /**
     * 부모견/부모묘 정보
     */
    @ApiProperty({
        description: '부모견/부모묘 정보',
        type: ParentInfoDto,
        required: false,
    })
    father?: ParentInfoDto;

    /**
     * 어미견/어미묘 정보
     */
    @ApiProperty({
        description: '어미견/어미묘 정보',
        type: ParentInfoDto,
        required: false,
    })
    mother?: ParentInfoDto;

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

    /**
     * 마이크로칩 번호
     * @example "123456789012345"
     */
    @ApiProperty({
        description: '마이크로칩 번호',
        example: '123456789012345',
        required: false,
    })
    microchipNumber?: string;

    /**
     * 특이사항
     * @example "활발하고 사람을 좋아합니다."
     */
    @ApiProperty({
        description: '특이사항',
        example: '활발하고 사람을 좋아합니다.',
        required: false,
    })
    specialNotes?: string;

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
}
