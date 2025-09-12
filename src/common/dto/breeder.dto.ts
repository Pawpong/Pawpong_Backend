import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsArray, IsEnum, Min, Max } from 'class-validator';

/**
 * 임시 호환성을 위한 브리더 검색 DTO 파일
 * 이 파일은 도메인별 DTO로 점진적으로 마이그레이션될 예정입니다.
 */

export class BreederSearchDto {
    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsString()
    breed?: string;

    @IsOptional()
    @IsString()
    petType?: string;

    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    district?: string;

    @IsOptional()
    @IsString()
    immediateAvailable?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    minPrice?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    maxPrice?: number;

    @IsOptional()
    @IsString()
    sortBy?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    page?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(50)
    limit?: number;
}

export class BreederSearchResponseDto {
    @ApiProperty({
        description: '브리더 목록'
    })
    breeders: Array<{
        breederId: string;
        breederName: string;
        location: string;
        specialization: string;
        averageRating: number;
        totalReviews: number;
        profilePhotos: string[];
        verificationStatus: string;
        availablePets: number;
    }>;

    @ApiProperty({
        description: '페이지네이션 정보'
    })
    pageInfo: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

export class BreederProfileResponseDto {
    @ApiProperty({
        description: '브리더 고유 ID'
    })
    breederId: string;

    @ApiProperty({
        description: '브리더 이름'
    })
    breederName: string;

    @ApiProperty({
        description: '이메일 주소'
    })
    emailAddress: string;

    @ApiProperty({
        description: '프로필 설명'
    })
    description: string;

    @ApiProperty({
        description: '위치 정보'
    })
    location: {
        city: string;
        district: string;
        address: string;
    };

    @ApiProperty({
        description: '전문 분야'
    })
    specialization: string;

    @ApiProperty({
        description: '경험 연수'
    })
    experienceYears: number;

    @ApiProperty({
        description: '인증 정보'
    })
    verification: {
        status: string;
        plan: string;
        verifiedAt: Date;
    };

    @ApiProperty({
        description: '프로필 사진들'
    })
    profilePhotos: string[];

    @ApiProperty({
        description: '분양 가능한 반려동물들'
    })
    availablePets: Array<{
        petId: string;
        name: string;
        breed: string;
        type: string;
        age: number;
        price: number;
        photos: string[];
        description: string;
        status: string;
    }>;

    @ApiProperty({
        description: '후기 통계'
    })
    reviewStats: {
        totalReviews: number;
        averageRating: number;
        ratingDistribution: {
            [key: number]: number;
        };
    };

    @ApiProperty({
        description: '최근 후기들'
    })
    recentReviews: Array<{
        reviewId: string;
        adopterName: string;
        rating: number;
        content: string;
        petHealthRating: number;
        communicationRating: number;
        createdAt: Date;
    }>;

    @ApiProperty({
        description: '계정 생성일'
    })
    createdAt: Date;
}