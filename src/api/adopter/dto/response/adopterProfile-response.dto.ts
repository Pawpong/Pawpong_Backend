import { ApiProperty } from '@nestjs/swagger';

/**
 * 입양자 즐겨찾기 브리더 정보 DTO
 */
export class FavoriteBreederInfoDto {
    /**
     * 브리더 고유 ID
     * @example "507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '브리더 고유 ID',
        example: '507f1f77bcf86cd799439011',
    })
    breederId: string;

    /**
     * 브리더 이름
     * @example "김브리더"
     */
    @ApiProperty({
        description: '브리더 이름',
        example: '김브리더',
    })
    breederName: string;

    /**
     * 브리더 프로필 이미지 URL
     * @example "https://example.com/profile.jpg"
     */
    @ApiProperty({
        description: '브리더 프로필 이미지 URL',
        example: 'https://example.com/profile.jpg',
    })
    breederProfileImageUrl: string;

    /**
     * 브리더 위치 정보
     * @example "서울 강남구"
     */
    @ApiProperty({
        description: '브리더 위치 정보',
        example: '서울 강남구',
    })
    breederLocation: string;

    /**
     * 즐겨찾기 추가 일시
     * @example "2024-01-15T10:30:00.000Z"
     */
    @ApiProperty({
        description: '즐겨찾기 추가 일시',
        example: '2024-01-15T10:30:00.000Z',
        format: 'date-time',
    })
    addedAt: Date;
}

/**
 * 입양자 신청 내역 정보 DTO
 */
export class AdopterApplicationInfoDto {
    /**
     * 신청 고유 ID
     * @example "507f1f77bcf86cd799439033"
     */
    @ApiProperty({
        description: '신청 고유 ID',
        example: '507f1f77bcf86cd799439033',
    })
    applicationId: string;

    /**
     * 신청한 브리더 ID
     * @example "507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '신청한 브리더 ID',
        example: '507f1f77bcf86cd799439011',
    })
    breederId: string;

    /**
     * 신청한 브리더 이름
     * @example "김브리더"
     */
    @ApiProperty({
        description: '신청한 브리더 이름',
        example: '김브리더',
    })
    breederName: string;

    /**
     * 신청한 반려동물 ID
     * @example "507f1f77bcf86cd799439022"
     */
    @ApiProperty({
        description: '신청한 반려동물 ID',
        example: '507f1f77bcf86cd799439022',
    })
    petId: string;

    /**
     * 신청한 반려동물 이름
     * @example "골든베이비"
     */
    @ApiProperty({
        description: '신청한 반려동물 이름',
        example: '골든베이비',
    })
    petName: string;

    /**
     * 반려동물 종류
     * @example "dog"
     */
    @ApiProperty({
        description: '반려동물 종류',
        example: 'dog',
        enum: ['dog', 'cat'],
    })
    petType: string;

    /**
     * 반려동물 품종
     * @example "골든 리트리버"
     */
    @ApiProperty({
        description: '반려동물 품종',
        example: '골든 리트리버',
    })
    petBreed: string;

    /**
     * 신청 상태
     * @example "consultation_pending"
     */
    @ApiProperty({
        description: '신청 상태',
        example: 'consultation_pending',
        enum: ['consultation_pending', 'consultation_completed', 'adoption_approved', 'adoption_rejected'],
    })
    applicationStatus: string;

    /**
     * 신청 일시
     * @example "2024-01-15T10:30:00.000Z"
     */
    @ApiProperty({
        description: '신청 일시',
        example: '2024-01-15T10:30:00.000Z',
        format: 'date-time',
    })
    appliedAt: Date;

    /**
     * 상태 업데이트 일시
     * @example "2024-01-16T15:45:00.000Z"
     */
    @ApiProperty({
        description: '상태 업데이트 일시',
        example: '2024-01-16T15:45:00.000Z',
        format: 'date-time',
        required: false,
    })
    updatedAt?: Date;

    /**
     * 후기 작성 여부
     * @example false
     */
    @ApiProperty({
        description: '후기 작성 여부',
        example: false,
    })
    isReviewWritten: boolean;
}

/**
 * 입양자 후기 정보 DTO
 */
export class AdopterReviewInfoDto {
    /**
     * 후기 고유 ID
     * @example "507f1f77bcf86cd799439044"
     */
    @ApiProperty({
        description: '후기 고유 ID',
        example: '507f1f77bcf86cd799439044',
    })
    reviewId: string;

    /**
     * 후기 대상 브리더 ID
     * @example "507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '후기 대상 브리더 ID',
        example: '507f1f77bcf86cd799439011',
    })
    breederId: string;

    /**
     * 후기 대상 브리더 이름
     * @example "김브리더"
     */
    @ApiProperty({
        description: '후기 대상 브리더 이름',
        example: '김브리더',
    })
    breederName: string;

    /**
     * 관련 입양 신청 ID
     * @example "507f1f77bcf86cd799439033"
     */
    @ApiProperty({
        description: '관련 입양 신청 ID',
        example: '507f1f77bcf86cd799439033',
    })
    applicationId: string;

    /**
     * 후기 종류
     * @example "adoption_completed"
     */
    @ApiProperty({
        description: '후기 종류',
        example: 'adoption_completed',
        enum: ['adoption_completed', 'experience_sharing'],
    })
    reviewType: string;

    /**
     * 전체 평점
     * @example 5
     */
    @ApiProperty({
        description: '전체 평점',
        example: 5,
        minimum: 1,
        maximum: 5,
    })
    overallRating: number;

    /**
     * 후기 내용
     * @example "정말 좋은 브리더입니다. 반려동물이 건강하고 성격도 좋아요."
     */
    @ApiProperty({
        description: '후기 내용',
        example: '정말 좋은 브리더입니다. 반려동물이 건강하고 성격도 좋아요.',
    })
    reviewContent: string;

    /**
     * 후기 사진 URL 배열
     * @example ["https://example.com/review1.jpg", "https://example.com/review2.jpg"]
     */
    @ApiProperty({
        description: '후기 사진 URL 배열',
        example: ['https://example.com/review1.jpg', 'https://example.com/review2.jpg'],
        type: [String],
    })
    reviewPhotos: string[];

    /**
     * 후기 작성 일시
     * @example "2024-01-20T12:00:00.000Z"
     */
    @ApiProperty({
        description: '후기 작성 일시',
        example: '2024-01-20T12:00:00.000Z',
        format: 'date-time',
    })
    createdAt: Date;

    /**
     * 후기 공개 여부
     * @example true
     */
    @ApiProperty({
        description: '후기 공개 여부',
        example: true,
    })
    isVisible: boolean;
}

/**
 * 입양자 프로필 응답 DTO
 * 입양자의 전체 프로필 정보를 제공합니다.
 */
export class AdopterProfileResponseDto {
    /**
     * 입양자 고유 ID
     * @example "507f1f77bcf86cd799439055"
     */
    @ApiProperty({
        description: '입양자 고유 ID',
        example: '507f1f77bcf86cd799439055',
    })
    adopterId: string;

    /**
     * 입양자 이메일
     * @example "adopter@example.com"
     */
    @ApiProperty({
        description: '입양자 이메일',
        example: 'adopter@example.com',
    })
    emailAddress: string;

    /**
     * 입양자 실명
     * @example "박입양자"
     */
    @ApiProperty({
        description: '입양자 실명',
        example: '박입양자',
    })
    fullName: string;

    /**
     * 연락처 (선택사항)
     * @example "010-1234-5678"
     */
    @ApiProperty({
        description: '연락처',
        example: '010-1234-5678',
        required: false,
    })
    phoneNumber?: string;

    /**
     * 프로필 이미지 URL (선택사항)
     * @example "https://example.com/profile.jpg"
     */
    @ApiProperty({
        description: '프로필 이미지 URL',
        example: 'https://example.com/profile.jpg',
        required: false,
    })
    profileImageUrl?: string;

    /**
     * 계정 상태
     * @example "active"
     */
    @ApiProperty({
        description: '계정 상태',
        example: 'active',
        enum: ['active', 'suspended', 'deactivated'],
    })
    accountStatus: string;

    /**
     * 즐겨찾기 브리더 목록
     */
    @ApiProperty({
        description: '즐겨찾기 브리더 목록',
        type: [FavoriteBreederInfoDto],
    })
    favoriteBreederList: FavoriteBreederInfoDto[];

    /**
     * 입양 신청 내역
     */
    @ApiProperty({
        description: '입양 신청 내역',
        type: [AdopterApplicationInfoDto],
    })
    adoptionApplicationList: AdopterApplicationInfoDto[];

    /**
     * 작성한 후기 목록
     */
    @ApiProperty({
        description: '작성한 후기 목록',
        type: [AdopterReviewInfoDto],
    })
    writtenReviewList: AdopterReviewInfoDto[];
}
