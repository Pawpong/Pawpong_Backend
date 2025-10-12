import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { VerificationStatus, PetStatus } from '../../common/enum/user.enum';

import { Breeder, BreederDocument } from '../../schema/breeder.schema';

import { BreederSearchRequestDto } from './dto/request/breederSearch-request.dto';
import { BreederSearchResponseDto } from './dto/response/breeder-search-response.dto';
import { BreederProfileResponseDto } from './dto/response/breeder-profileresponse.dto';
import { PaginationBuilder } from '../../common/dto/pagination/pagination-builder.dto';

@Injectable()
export class BreederService {
    constructor(@InjectModel(Breeder.name) private breederModel: Model<BreederDocument>) {}

    async searchBreeders(searchDto: BreederSearchRequestDto): Promise<BreederSearchResponseDto> {
        const {
            petType,
            breedName,
            cityName,
            districtName,
            isImmediatelyAvailable,
            minPrice,
            maxPrice,
            page = 1,
            take: limit = 10,
            sortCriteria = 'rating',
        } = searchDto;

        // Build filter query
        const filter: any = {
            'verification.status': VerificationStatus.APPROVED,
            status: 'active',
        };

        if (petType) {
            filter['profile.specialization'] = petType;
        }

        if (cityName) {
            filter['profile.location.city'] = cityName;
        }

        if (districtName) {
            filter['profile.location.district'] = districtName;
        }

        if (isImmediatelyAvailable) {
            filter['availablePets.status'] = PetStatus.AVAILABLE;
        }

        if (breedName) {
            filter['availablePets.breed'] = new RegExp(breedName, 'i');
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            const priceFilter: any = {};
            if (minPrice !== undefined) {
                priceFilter.$gte = minPrice;
            }
            if (maxPrice !== undefined) {
                priceFilter.$lte = maxPrice;
            }
            filter['profile.priceRange.min'] = priceFilter;
        }

        // Build sort criteria
        let sortOrder: any = {};
        switch (sortCriteria) {
            case 'rating':
                sortOrder = { 'stats.averageRating': -1 };
                break;
            case 'experience':
                sortOrder = { 'profile.experienceYears': -1 };
                break;
            case 'recent':
                sortOrder = { createdAt: -1 };
                break;
            case 'applications':
                sortOrder = { 'stats.totalApplications': -1 };
                break;
        }

        const skip = (page - 1) * limit;

        // Execute query with pagination
        const [breeders, total] = await Promise.all([
            this.breederModel
                .find(filter)
                .select('-password -socialAuth -receivedApplications -reports')
                .sort(sortOrder)
                .skip(skip)
                .limit(limit)
                .lean(),
            this.breederModel.countDocuments(filter),
        ]);

        // 브리더 데이터 변환
        const transformedBreeders = breeders.map((breeder: any) => ({
            breederId: (breeder._id as any).toString(),
            breederName: breeder.name,
            location: breeder.profile?.location?.city || 'Unknown',
            specialization: breeder.profile?.specialization || '',
            averageRating: breeder.stats?.averageRating || 0,
            totalReviews: breeder.stats?.totalReviews || 0,
            profilePhotos: breeder.profile?.photos || [],
            verificationStatus: breeder.verification?.status || 'pending',
            availablePets: breeder.availablePets?.length || 0,
        }));

        // PaginationBuilder를 사용하여 응답 생성
        return new PaginationBuilder<any>()
            .setItems(transformedBreeders as any[])
            .setPage(page)
            .setTake(limit)
            .setTotalCount(total)
            .build();
    }

    async getBreederProfile(breederId: string, userId?: string): Promise<BreederProfileResponseDto> {
        const breeder = await this.breederModel
            .findById(breederId)
            .select('-password -socialAuth -receivedApplications -reports')
            .lean();

        if (!breeder) {
            throw new NotFoundException('Breeder not found');
        }

        if (breeder.verification?.status !== VerificationStatus.APPROVED) {
            throw new NotFoundException('Breeder profile not available');
        }

        // Increment profile view count if user is logged in
        if (userId) {
            await this.breederModel.findByIdAndUpdate(breederId, { $inc: { 'stats.profileViews': 1 } });
        }

        return this.transformToResponseDto(breeder);
    }

    private transformToResponseDto(breeder: any): any {
        return {
            breederId: breeder._id.toString(),
            breederName: breeder.name,
            breederLevel: breeder.verification?.level || 'new',
            detailBreed: breeder.detailBreed,
            location: breeder.profile?.location ? 
                `${breeder.profile.location.city} ${breeder.profile.location.district}` : '',
            priceRange: breeder.priceDisplay === 'range' ? breeder.priceRange : undefined,
            profileImage: breeder.profileImage,
            favoriteCount: breeder.stats?.totalFavorites || 0,
            isFavorited: false, // 로그인 상태에서 설정 필요
            description: breeder.profile?.description || '',
            representativePhotos: breeder.profile?.representativePhotos || [],
            availablePets: (breeder.availablePets?.filter((pet: any) => pet.isActive) || []).map((pet: any) => ({
                petId: pet.petId,
                name: pet.name,
                breed: pet.breed,
                gender: pet.gender,
                birthDate: pet.birthDate,
                price: pet.price,
                status: pet.status,
                photo: pet.photos?.[0] || '', // 첫 번째 사진만
            })),
            parentPets: (breeder.parentPets?.filter((pet: any) => pet.isActive) || []).map((pet: any) => ({
                petId: pet.petId,
                name: pet.name,
                breed: pet.breed,
                gender: pet.gender,
                birthDate: this.calculateBirthDateFromAge(pet.age),
            })),
            reviews: (breeder.reviews?.filter((review: any) => review.isVisible) || [])
                .slice(-5)
                .map((review: any) => ({
                    reviewId: review.reviewId,
                    writtenAt: review.writtenAt,
                    type: review.type,
                    adopterName: review.adopterName,
                    rating: review.rating,
                    content: review.content,
                    photo: review.photos?.[0] || undefined, // 첫 번째 사진만
                })),
            reviewStats: {
                totalReviews: breeder.stats?.totalReviews || 0,
                averageRating: breeder.stats?.averageRating || 0,
            },
            createdAt: breeder.createdAt,
        };
    }

    private calculateBirthDateFromAge(age: number): Date {
        const now = new Date();
        return new Date(now.getFullYear() - age, now.getMonth(), now.getDate());
    }
}
