import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { VerificationStatus, PetStatus } from '../../common/enum/user.enum';

import { Breeder, BreederDocument } from '../../schema/breeder.schema';
import { Adopter, AdopterDocument } from '../../schema/adopter.schema';

import { BreederSearchRequestDto } from './dto/request/breeder-search-request.dto';
import { BreederSearchResponseDto } from './dto/response/breeder-search-response.dto';
import { BreederProfileResponseDto } from './dto/response/breeder-profile-response.dto';
import { PaginationBuilder } from '../../common/dto/pagination/pagination-builder.dto';

@Injectable()
export class BreederService {
    constructor(
        @InjectModel(Breeder.name) private breederModel: Model<BreederDocument>,
        @InjectModel(Adopter.name) private adopterModel: Model<AdopterDocument>,
    ) {}

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

        // Check if user has favorited this breeder
        let isFavorited = false;
        if (userId) {
            const adopter = await this.adopterModel.findById(userId).select('favorite_breeder_list').lean();

            if (adopter && adopter.favoriteBreederList) {
                isFavorited = adopter.favoriteBreederList.some((fav: any) => fav.favoriteBreederId === breederId);
            }

            // Increment profile view count if user is logged in
            await this.breederModel.findByIdAndUpdate(breederId, { $inc: { 'stats.profileViews': 1 } });
        }

        return this.transformToResponseDto(breeder, isFavorited);
    }

    private transformToResponseDto(breeder: any, isFavorited: boolean = false): any {
        return {
            breederId: breeder._id.toString(),
            breederName: breeder.name,
            breederLevel: breeder.verification?.level || 'new',
            detailBreed: breeder.detailBreed,
            location: breeder.profile?.location
                ? `${breeder.profile.location.city} ${breeder.profile.location.district}`
                : '',
            priceRange: breeder.priceDisplay === 'range' ? breeder.priceRange : undefined,
            profileImage: breeder.profileImage,
            favoriteCount: breeder.stats?.totalFavorites || 0,
            isFavorited: isFavorited,
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

    /**
     * 브리더 후기 목록 조회 (페이지네이션)
     *
     * @param breederId 브리더 ID
     * @param page 페이지 번호
     * @param limit 페이지당 항목 수
     * @returns 페이지네이션된 후기 목록
     */
    async getBreederReviews(breederId: string, page: number = 1, limit: number = 10): Promise<any> {
        const breeder = await this.breederModel.findById(breederId).select('reviews stats').lean();

        if (!breeder) {
            throw new NotFoundException('Breeder not found');
        }

        const allReviews = (breeder as any).reviews?.filter((review: any) => review.isVisible) || [];
        const total = allReviews.length;

        // 최신순 정렬 및 페이지네이션
        const skip = (page - 1) * limit;
        const reviews = allReviews
            .sort((a: any, b: any) => new Date(b.writtenAt).getTime() - new Date(a.writtenAt).getTime())
            .slice(skip, skip + limit)
            .map((review: any) => ({
                reviewId: review.reviewId,
                adopterName: review.adopterName,
                petName: review.petName || '',
                rating: review.rating || 0,
                petHealthRating: review.petHealthRating,
                communicationRating: review.communicationRating,
                content: review.content,
                photos: review.photos || [],
                writtenAt: review.writtenAt,
                type: review.type || 'adoption',
            }));

        const totalPages = Math.ceil(total / limit);

        return {
            items: reviews,
            pagination: {
                currentPage: page,
                pageSize: limit,
                totalItems: total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
            averageRating: (breeder as any).stats?.averageRating || 0,
            totalReviews: total,
        };
    }

    /**
     * 개체 상세 정보 조회
     *
     * @param breederId 브리더 ID
     * @param petId 개체 ID
     * @returns 개체 상세 정보
     */
    async getPetDetail(breederId: string, petId: string): Promise<any> {
        const breeder = await this.breederModel.findById(breederId).lean();

        if (!breeder) {
            throw new NotFoundException('Breeder not found');
        }

        const pet = (breeder as any).availablePets?.find((p: any) => p.petId === petId && p.isActive);

        if (!pet) {
            throw new NotFoundException('Pet not found');
        }

        // 부모견/부모묘 정보 찾기
        const parentPets = (breeder as any).parentPets || [];
        const father = pet.fatherId ? parentPets.find((p: any) => p.petId === pet.fatherId) : null;
        const mother = pet.motherId ? parentPets.find((p: any) => p.petId === pet.motherId) : null;

        return {
            petId: pet.petId,
            name: pet.name,
            breed: pet.breed,
            gender: pet.gender,
            birthDate: pet.birthDate,
            description: pet.description || '',
            price: pet.price,
            status: pet.status,
            photos: pet.photos || [],
            vaccinations: pet.vaccinations || [],
            healthRecords: pet.healthRecords || [],
            father: father
                ? {
                      petId: father.petId,
                      name: father.name,
                      breed: father.breed,
                      photo: father.photos?.[0] || '',
                  }
                : undefined,
            mother: mother
                ? {
                      petId: mother.petId,
                      name: mother.name,
                      breed: mother.breed,
                      photo: mother.photos?.[0] || '',
                  }
                : undefined,
            availableFrom: pet.availableFrom,
            microchipNumber: pet.microchipNumber,
            specialNotes: pet.specialNotes,
            createdAt: pet.createdAt,
        };
    }

    /**
     * 브리더 개체 목록 조회 (필터링)
     *
     * @param breederId 브리더 ID
     * @param status 상태 필터 (available, reserved, adopted)
     * @param page 페이지 번호
     * @param limit 페이지당 항목 수
     * @returns 페이지네이션된 개체 목록
     */
    async getBreederPets(breederId: string, status?: string, page: number = 1, limit: number = 20): Promise<any> {
        const breeder = await this.breederModel.findById(breederId).select('availablePets').lean();

        if (!breeder) {
            throw new NotFoundException('Breeder not found');
        }

        let allPets = (breeder as any).availablePets?.filter((pet: any) => pet.isActive) || [];

        // 상태별 카운트 계산
        const availableCount = allPets.filter((p: any) => p.status === 'available').length;
        const reservedCount = allPets.filter((p: any) => p.status === 'reserved').length;
        const adoptedCount = allPets.filter((p: any) => p.status === 'adopted').length;

        // 상태 필터링
        if (status) {
            allPets = allPets.filter((pet: any) => pet.status === status);
        }

        const total = allPets.length;

        // 페이지네이션
        const skip = (page - 1) * limit;
        const pets = allPets.slice(skip, skip + limit).map((pet: any) => {
            const birthDate = new Date(pet.birthDate);
            const now = new Date();
            const ageInMonths = Math.floor((now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

            return {
                petId: pet.petId,
                name: pet.name,
                breed: pet.breed,
                gender: pet.gender,
                birthDate: pet.birthDate,
                ageInMonths,
                price: pet.price,
                status: pet.status,
                mainPhoto: pet.photos?.[0] || '',
                photoCount: pet.photos?.length || 0,
                isVaccinated: (pet.vaccinations?.length || 0) > 0,
                hasMicrochip: !!pet.microchipNumber,
                availableFrom: pet.availableFrom,
            };
        });

        const totalPages = Math.ceil(total / limit);

        return {
            items: pets,
            pagination: {
                currentPage: page,
                pageSize: limit,
                totalItems: total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
            availableCount,
            reservedCount,
            adoptedCount,
        };
    }
}
