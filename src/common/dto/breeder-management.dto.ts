import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsNumber } from 'class-validator';

/**
 * 임시 호환성을 위한 브리더 관리 DTO 파일
 * 이 파일은 도메인별 DTO로 점진적으로 마이그레이션될 예정입니다.
 */

export class SubmitVerificationDto {
    @IsString()
    @IsNotEmpty()
    businessNumber: string;

    @IsString()
    @IsNotEmpty()
    businessName: string;

    @IsString()
    @IsNotEmpty()
    plan: string;

    @IsArray()
    @IsOptional()
    documents?: string[];

    @IsOptional()
    submittedByEmail?: boolean;
}

export class UpdateApplicationStatusDto {
    @IsEnum(['consultation_pending', 'document_pending', 'approved', 'rejected', 'completed'])
    status: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsString()
    @IsOptional()
    actionTaken?: string;
}

export class AddPetDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    breed: string;

    @IsString()
    @IsNotEmpty()
    type: string;

    @IsNumber()
    @IsOptional()
    price?: number;

    @IsArray()
    @IsOptional()
    photos?: string[];

    @IsString()
    @IsOptional()
    description?: string;
}

export class UpdateProfileDto {
    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    location?: string;

    @IsArray()
    @IsOptional()
    photos?: string[];

    @IsString()
    @IsOptional()
    specialization?: string;

    @IsNumber()
    @IsOptional()
    experienceYears?: number;
}

export class UpdateBreederProfileDto extends UpdateProfileDto {}

export class ParentPetDto {
    @IsString()
    @IsNotEmpty()
    petId: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    breed: string;

    @IsNumber()
    @IsOptional()
    age?: number;

    @IsArray()
    @IsOptional()
    photos?: string[];

    @IsArray()
    @IsOptional()
    healthRecords?: string[];
}

export class AvailablePetDto {
    @IsString()
    @IsNotEmpty()
    petId: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    breed: string;

    @IsString()
    @IsNotEmpty()
    type: string;

    @IsNumber()
    @IsOptional()
    price?: number;

    @IsArray()
    @IsOptional()
    photos?: string[];

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    status?: string;
}

export class ReceivedApplicationResponseDto {
    @ApiProperty({
        description: '받은 입양 신청 목록',
    })
    applications: Array<{
        applicationId: string;
        adopterName: string;
        adopterEmail: string;
        petId: string;
        petName: string;
        status: string;
        appliedAt: Date;
        applicationData: Record<string, any>;
    }>;

    @ApiProperty({
        description: '페이지네이션 정보',
    })
    pageInfo: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

export class BreederDashboardResponseDto {
    @ApiProperty({
        description: '브리더 기본 정보',
    })
    breederInfo: {
        breederId: string;
        breederName: string;
        emailAddress: string;
        verificationStatus: string;
        subscriptionPlan: string;
    };

    @ApiProperty({
        description: '프로필 정보',
    })
    profileInfo: {
        verificationInfo: {
            verificationStatus: string;
            subscriptionPlan: string;
            submittedAt?: Date;
            reviewedAt?: Date;
            rejectionReason?: string;
        };
    };

    @ApiProperty({
        description: '통계 정보',
    })
    statisticsInfo: {
        totalApplicationCount: number;
        pendingApplicationCount: number;
        completedAdoptionCount: number;
        averageRating: number;
        totalReviewCount: number;
        profileViewCount: number;
    };

    @ApiProperty({
        description: '최근 입양 신청 목록',
    })
    recentApplicationList: Array<{
        applicationId: string;
        adopterName: string;
        petName: string;
        applicationStatus: string;
        appliedAt: Date;
    }>;

    @ApiProperty({
        description: '분양 가능한 반려동물 수',
    })
    availablePetCount: number;

    @ApiProperty({
        description: '최근 후기들',
    })
    recentReviews: Array<{
        reviewId: string;
        adopterName: string;
        rating: number;
        content: string;
        createdAt: Date;
    }>;
}
