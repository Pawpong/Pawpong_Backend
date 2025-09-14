import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsArray, IsBoolean } from 'class-validator';

/**
 * 임시 호환성을 위한 공통 입양자 DTO 파일
 * 이 파일은 도메인별 DTO로 점진적으로 마이그레이션될 예정입니다.
 */

export class CreateApplicationDto {
    @IsString()
    @IsNotEmpty()
    breederId: string;

    @IsString()
    @IsNotEmpty()
    petId: string;

    @IsOptional()
    applicationForm?: Record<string, any>;
}

export class CreateReviewDto {
    @IsString()
    @IsNotEmpty()
    applicationId: string;

    @IsString()
    @IsNotEmpty()
    reviewType: string;

    @IsNumber()
    rating: number;

    @IsString()
    @IsNotEmpty()
    content: string;

    @IsArray()
    @IsOptional()
    photos?: string[];
}

export class AddFavoriteDto {
    @IsString()
    @IsNotEmpty()
    breederId: string;
}

export class CreateReportDto {
    @IsString()
    @IsNotEmpty()
    breederId: string;

    @IsString()
    @IsNotEmpty()
    type: string;

    @IsString()
    @IsNotEmpty()
    description: string;
}

export class AdopterProfileResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    email: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    phone?: string;

    @ApiProperty()
    profileImage?: string;

    @ApiProperty()
    status: string;

    @ApiProperty()
    favoriteBreeder: any[];

    @ApiProperty()
    adoptionApplications: any[];

    @ApiProperty()
    reviews: any[];
}
