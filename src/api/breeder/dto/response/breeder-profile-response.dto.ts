import { ApiProperty } from '@nestjs/swagger';

/**
 * 브리더 프로필 위치 정보 DTO
 */
export class BreederLocationDto {
    /**
     * 도시명
     * @example "서울"
     */
    @ApiProperty({
        description: '도시명',
        example: '서울'
    })
    cityName: string;

    /**
     * 구/군명
     * @example "강남구"
     */
    @ApiProperty({
        description: '구/군명',
        example: '강남구'
    })
    districtName: string;

    /**
     * 상세 주소 (선택사항)
     * @example "테헤란로 123"
     */
    @ApiProperty({
        description: '상세 주소',
        example: '테헤란로 123',
        required: false
    })
    detailAddress?: string;
}

/**
 * 브리더 가격대 정보 DTO
 */
export class BreederPriceRangeDto {
    /**
     * 최소 가격 (원)
     * @example 500000
     */
    @ApiProperty({
        description: '최소 가격 (원)',
        example: 500000
    })
    minPrice: number;

    /**
     * 최대 가격 (원)
     * @example 2000000
     */
    @ApiProperty({
        description: '최대 가격 (원)',
        example: 2000000
    })
    maxPrice: number;
}

/**
 * 브리더 프로필 정보 DTO
 */
export class BreederProfileInfoDto {
    /**
     * 브리더 소개 설명
     * @example "20년 경력의 전문 브리더입니다"
     */
    @ApiProperty({
        description: '브리더 소개 설명',
        example: '20년 경력의 전문 브리더입니다'
    })
    profileDescription: string;

    /**
     * 위치 정보
     */
    @ApiProperty({
        description: '위치 정보',
        type: BreederLocationDto
    })
    locationInfo: BreederLocationDto;

    /**
     * 브리더 사진 URL 배열
     * @example ["https://example.com/photo1.jpg"]
     */
    @ApiProperty({
        description: '브리더 사진 URL 배열',
        example: ['https://example.com/photo1.jpg'],
        type: [String]
    })
    profilePhotos: string[];

    /**
     * 분양 가격대 정보
     */
    @ApiProperty({
        description: '분양 가격대 정보',
        type: BreederPriceRangeDto
    })
    priceRangeInfo: BreederPriceRangeDto;

    /**
     * 전문 분야 (품종)
     * @example ["골든 리트리버", "래브라도"]
     */
    @ApiProperty({
        description: '전문 분야 (품종)',
        example: ['골든 리트리버', '래브라도'],
        type: [String]
    })
    specializationAreas: string[];

    /**
     * 경력 연수
     * @example 20
     */
    @ApiProperty({
        description: '경력 연수',
        example: 20,
        required: false
    })
    experienceYears?: number;
}

/**
 * 브리더 통계 정보 DTO
 */
export class BreederStatsDto {
    /**
     * 총 신청 수
     * @example 150
     */
    @ApiProperty({
        description: '총 신청 수',
        example: 150
    })
    totalApplicationCount: number;

    /**
     * 성사된 입양 수
     * @example 85
     */
    @ApiProperty({
        description: '성사된 입양 수',
        example: 85
    })
    completedAdoptionCount: number;

    /**
     * 평균 평점
     * @example 4.5
     */
    @ApiProperty({
        description: '평균 평점',
        example: 4.5
    })
    averageRatingScore: number;

    /**
     * 총 후기 수
     * @example 42
     */
    @ApiProperty({
        description: '총 후기 수',
        example: 42
    })
    totalReviewCount: number;

    /**
     * 프로필 조회수
     * @example 1250
     */
    @ApiProperty({
        description: '프로필 조회수',
        example: 1250
    })
    profileViewCount: number;
}

/**
 * 브리더 인증 정보 DTO
 */
export class BreederVerificationDto {
    /**
     * 인증 상태
     * @example "approved"
     */
    @ApiProperty({
        description: '인증 상태',
        example: 'approved',
        enum: ['pending', 'approved', 'rejected']
    })
    verificationStatus: string;
}

/**
 * 브리더 프로필 응답 DTO
 * 브리더 상세 정보 조회 시 반환되는 데이터 구조입니다.
 */
export class BreederProfileResponseDto {
    /**
     * 브리더 고유 ID
     * @example "507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '브리더 고유 ID',
        example: '507f1f77bcf86cd799439011'
    })
    breederId: string;

    /**
     * 브리더 이름
     * @example "김브리더"
     */
    @ApiProperty({
        description: '브리더 이름',
        example: '김브리더'
    })
    breederName: string;

    /**
     * 브리더 이메일
     * @example "breeder@example.com"
     */
    @ApiProperty({
        description: '브리더 이메일',
        example: 'breeder@example.com'
    })
    breederEmail: string;

    /**
     * 프로필 이미지 URL
     * @example "https://example.com/profile.jpg"
     */
    @ApiProperty({
        description: '프로필 이미지 URL',
        example: 'https://example.com/profile.jpg',
        required: false
    })
    profileImageFileName?: string;

    /**
     * 브리더 프로필 상세 정보
     */
    @ApiProperty({
        description: '브리더 프로필 상세 정보',
        type: BreederProfileInfoDto
    })
    profileInfo: BreederProfileInfoDto;

    /**
     * 부모견/부모묘 정보
     * @example []
     */
    @ApiProperty({
        description: '부모견/부모묘 정보',
        type: Array
    })
    parentPetInfo: any[];

    /**
     * 분양 가능한 반려동물 정보
     * @example []
     */
    @ApiProperty({
        description: '분양 가능한 반려동물 정보',
        type: Array
    })
    availablePetInfo: any[];

    /**
     * 후기 정보
     * @example []
     */
    @ApiProperty({
        description: '후기 정보',
        type: Array
    })
    reviewInfo: any[];

    /**
     * 브리더 통계 정보
     */
    @ApiProperty({
        description: '브리더 통계 정보',
        type: BreederStatsDto
    })
    statsInfo: BreederStatsDto;

    /**
     * 브리더 인증 정보
     */
    @ApiProperty({
        description: '브리더 인증 정보',
        type: BreederVerificationDto
    })
    verificationInfo: BreederVerificationDto;
}