import { ApiProperty } from '@nestjs/swagger';

/**
 * 입양자 프로필 조회 응답 DTO
 * 입양자의 프로필 정보를 제공합니다.
 */
export class AdopterProfileResponseDto {
    /**
     * 입양자 고유 ID
     * @example "507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '입양자 고유 ID',
        example: '507f1f77bcf86cd799439011',
    })
    adopterId: string;

    /**
     * 이메일 주소
     * @example "adopter@example.com"
     */
    @ApiProperty({
        description: '이메일 주소',
        example: 'adopter@example.com',
    })
    emailAddress: string;

    /**
     * 입양자 닉네임
     * @example "행복한입양자"
     */
    @ApiProperty({
        description: '입양자 닉네임',
        example: '행복한입양자',
    })
    nickname: string;

    /**
     * 전화번호
     * @example "010-1234-5678"
     */
    @ApiProperty({
        description: '전화번호',
        example: '010-1234-5678',
    })
    phoneNumber: string;

    /**
     * 프로필 이미지 URL
     * @example "https://example.com/profile.jpg"
     */
    @ApiProperty({
        description: '프로필 이미지 URL',
        example: 'https://example.com/profile.jpg',
        required: false,
    })
    profileImageFileName?: string;

    /**
     * 계정 상태
     * @example "active"
     */
    @ApiProperty({
        description: '계정 상태',
        example: 'active',
        enum: ['active', 'inactive', 'suspended'],
    })
    accountStatus: string;

    /**
     * 즐겨찾기 브리더 목록
     */
    @ApiProperty({
        description: '즐겨찾기 브리더 목록',
        type: 'array',
        items: {
            type: 'object',
            properties: {
                breederId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                breederName: { type: 'string', example: '김브리더' },
                addedAt: { type: 'string', format: 'date-time' },
            },
        },
    })
    favoriteBreederList: Array<{
        breederId: string;
        breederName: string;
        addedAt: Date;
        breederProfileImageUrl?: string;
        breederLocation?: string;
    }>;

    /**
     * 입양 신청 내역
     */
    @ApiProperty({
        description: '입양 신청 내역',
        type: 'array',
        items: {
            type: 'object',
            properties: {
                applicationId: { type: 'string', example: 'app_507f1f77bcf86cd799439011' },
                breederId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                petId: { type: 'string', example: 'pet_507f1f77bcf86cd799439011' },
                applicationStatus: { type: 'string', example: 'pending' },
                appliedAt: { type: 'string', format: 'date-time' },
            },
        },
    })
    adoptionApplicationList: Array<{
        applicationId: string;
        breederId: string;
        petId: string;
        applicationStatus: string;
        appliedAt: Date;
    }>;

    /**
     * 작성한 후기 목록
     */
    @ApiProperty({
        description: '작성한 후기 목록',
        type: 'array',
        items: {
            type: 'object',
            properties: {
                reviewId: { type: 'string', example: 'rev_507f1f77bcf86cd799439011' },
                breederId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                rating: { type: 'number', example: 5 },
                content: { type: 'string', example: '정말 좋은 브리더입니다.' },
                createdAt: { type: 'string', format: 'date-time' },
            },
        },
    })
    writtenReviewList: Array<{
        reviewId: string;
        breederId: string;
        rating: number;
        content: string;
        createdAt: Date;
    }>;

    /**
     * 계정 생성 일시
     * @example "2024-01-10T08:15:00.000Z"
     */
    @ApiProperty({
        description: '계정 생성 일시',
        example: '2024-01-10T08:15:00.000Z',
        format: 'date-time',
    })
    createdAt: Date;

    /**
     * 최종 수정 일시
     * @example "2024-01-15T14:30:00.000Z"
     */
    @ApiProperty({
        description: '최종 수정 일시',
        example: '2024-01-15T14:30:00.000Z',
        format: 'date-time',
    })
    updatedAt: Date;
}
