import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { VerificationStatus, PetStatus } from '../../common/enum/user.enum';

import { Breeder, BreederDocument } from '../../schema/breeder.schema';
import { Adopter, AdopterDocument } from '../../schema/adopter.schema';
import { BreederReview, BreederReviewDocument } from '../../schema/breeder-review.schema';
import { ParentPet, ParentPetDocument } from '../../schema/parent-pet.schema';

import { BreederSearchRequestDto } from './dto/request/breeder-search-request.dto';
import { BreederSearchResponseDto } from './dto/response/breeder-search-response.dto';
import { BreederProfileResponseDto } from './dto/response/breeder-profile-response.dto';
import { PaginationBuilder } from '../../common/dto/pagination/pagination-builder.dto';

@Injectable()
export class BreederService {
    constructor(
        @InjectModel(Breeder.name) private breederModel: Model<BreederDocument>,
        @InjectModel(Adopter.name) private adopterModel: Model<AdopterDocument>,
        @InjectModel(BreederReview.name) private breederReviewModel: Model<BreederReviewDocument>,
        @InjectModel(ParentPet.name) private parentPetModel: Model<ParentPetDocument>,
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
        // ObjectId 형식 검증
        if (!Types.ObjectId.isValid(breederId)) {
            throw new BadRequestException('올바르지 않은 브리더 ID 형식입니다.');
        }

        const breeder = await this.breederModel
            .findById(breederId)
            .select('-password -socialAuth -receivedApplications -reports')
            .lean();

        if (!breeder) {
            throw new BadRequestException('브리더를 찾을 수 없습니다.');
        }

        // 승인되지 않은 브리더도 프로필 조회 가능 (단, 검색에는 노출되지 않음)
        // 테스트 및 본인 확인 용도로 허용
        // if (breeder.verification?.status !== VerificationStatus.APPROVED) {
        //     throw new BadRequestException('브리더 프로필을 찾을 수 없습니다.');
        // }

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
    /**
     * 브리더 후기 목록 조회 (참조 방식으로 재설계)
     *
     * 변경사항:
     * - BreederReview 컬렉션에서 직접 조회 (임베디드 제거)
     * - populate로 입양자 정보 자동 조회
     * - 페이지네이션 및 최신순 정렬
     *
     * @param breederId 브리더 ID
     * @param page 페이지 번호
     * @param limit 페이지당 항목 수
     * @returns 후기 목록과 페이지네이션 정보
     */
    async getBreederReviews(breederId: string, page: number = 1, limit: number = 10): Promise<any> {
        // ObjectId 형식 검증
        if (!Types.ObjectId.isValid(breederId)) {
            throw new BadRequestException('올바르지 않은 브리더 ID 형식입니다.');
        }

        // 1. 브리더 존재 확인
        const breeder = await this.breederModel.findById(breederId).select('stats').lean();
        if (!breeder) {
            throw new BadRequestException('브리더를 찾을 수 없습니다.');
        }

        // 2. BreederReview 컬렉션에서 조회 (참조 방식)
        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            this.breederReviewModel
                .find({ breederId, isVisible: true })
                .sort({ writtenAt: -1 }) // 최신순 정렬
                .skip(skip)
                .limit(limit)
                .populate('adopterId', 'nickname') // 입양자 닉네임 조회
                .lean()
                .exec(),
            this.breederReviewModel.countDocuments({ breederId, isVisible: true }).exec(),
        ]);

        // 3. 응답 데이터 포맷팅
        const formattedReviews = reviews.map((review: any) => ({
            reviewId: review._id.toString(),
            adopterName: review.adopterId?.nickname || '알 수 없음',
            content: review.content,
            writtenAt: review.writtenAt,
            type: review.type,
        }));

        const totalPages = Math.ceil(total / limit);

        return {
            items: formattedReviews,
            pagination: {
                currentPage: page,
                pageSize: limit,
                totalItems: total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
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
        // ObjectId 형식 검증
        if (!Types.ObjectId.isValid(breederId)) {
            throw new BadRequestException('올바르지 않은 브리더 ID 형식입니다.');
        }

        const breeder = await this.breederModel.findById(breederId).lean();

        if (!breeder) {
            throw new BadRequestException('브리더를 찾을 수 없습니다.');
        }

        const pet = (breeder as any).availablePets?.find((p: any) => p.petId === petId && p.isActive);

        if (!pet) {
            throw new BadRequestException('반려동물을 찾을 수 없습니다.');
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
     * 부모견/부모묘 목록 조회
     *
     * 특정 브리더의 활성화된 부모견/부모묘 목록을 조회합니다.
     * ParentPet은 별도 컬렉션으로 관리되며, 사진은 Signed URL로 변환합니다.
     *
     * @param breederId 브리더 ID
     * @returns 부모견/부모묘 목록
     * @throws BadRequestException 존재하지 않는 브리더
     */
    async getParentPets(breederId: string): Promise<any> {
        // ObjectId 형식 검증
        if (!Types.ObjectId.isValid(breederId)) {
            throw new BadRequestException('올바르지 않은 브리더 ID 형식입니다.');
        }

        // 브리더 존재 확인
        const breeder = await this.breederModel.findById(breederId).select('_id').lean();
        if (!breeder) {
            throw new BadRequestException('브리더를 찾을 수 없습니다.');
        }

        // ParentPet 컬렉션에서 활성화된 부모견/부모묘 조회
        const parentPets = await this.parentPetModel
            .find({ breederId, isActive: true })
            .lean();

        // 데이터 변환 (사진 URL은 fileName 그대로 반환, 필요시 Signed URL 생성은 클라이언트에서 처리)
        const items = parentPets.map((pet: any) => ({
            petId: pet._id.toString(),
            name: pet.name,
            breed: pet.breed,
            gender: pet.gender,
            birthDate: pet.birthDate,
            photoUrl: pet.photoFileName || '', // 파일명 반환
            healthRecords: pet.healthRecords || [],
            description: pet.description || '',
        }));

        return { items };
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
        // ObjectId 형식 검증
        if (!Types.ObjectId.isValid(breederId)) {
            throw new BadRequestException('올바르지 않은 브리더 ID 형식입니다.');
        }

        const breeder = await this.breederModel.findById(breederId).select('availablePets').lean();

        if (!breeder) {
            throw new BadRequestException('브리더를 찾을 수 없습니다.');
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

    /**
     * 표준 입양 신청 폼 질문 14개 (Figma 디자인 기반 - 수정 불가)
     *
     * 모든 브리더에게 자동으로 포함되는 필수 질문들입니다.
     */
    private getStandardQuestions() {
        return [
            { id: 'privacyConsent', type: 'checkbox', label: '개인정보 수집 및 이용에 동의하시나요?', required: true, order: 1, isStandard: true },
            { id: 'selfIntroduction', type: 'textarea', label: '간단하게 자기소개 부탁드려요 (성별, 연령대, 거주지, 생활 패턴 등)', required: true, order: 2, isStandard: true },
            { id: 'familyMembers', type: 'text', label: '함께 거주하는 가족 구성원을 알려주세요', required: true, order: 3, isStandard: true },
            { id: 'allFamilyConsent', type: 'checkbox', label: '모든 가족 구성원들이 입양에 동의하셨나요?', required: true, order: 4, isStandard: true },
            { id: 'allergyTestInfo', type: 'text', label: '본인을 포함한 모든 가족 구성원분들께서 알러지 검사를 마치셨나요?', required: true, order: 5, isStandard: true },
            { id: 'timeAwayFromHome', type: 'text', label: '평균적으로 집을 비우는 시간은 얼마나 되나요?', required: true, order: 6, isStandard: true },
            { id: 'livingSpaceDescription', type: 'textarea', label: '아이와 함께 지내게 될 공간을 소개해 주세요', required: true, order: 7, isStandard: true },
            { id: 'previousPetExperience', type: 'textarea', label: '현재 함께하는, 또는 이전에 함께했던 반려동물에 대해 알려주세요', required: true, order: 8, isStandard: true },
            { id: 'canProvideBasicCare', type: 'checkbox', label: '정기 예방접종·건강검진·훈련 등 기본 케어를 책임지고 해주실 수 있나요?', required: true, order: 9, isStandard: true },
            { id: 'canAffordMedicalExpenses', type: 'checkbox', label: '예상치 못한 질병이나 사고 등으로 치료비가 발생할 경우 감당 가능하신가요?', required: true, order: 10, isStandard: true },
            { id: 'neuteringConsent', type: 'checkbox', label: '모든 아이들은 중성화 후 분양되거나, 입양 후 중성화를 진행해야 합니다. 동의하십니까?', required: true, order: 11, isStandard: true },
            { id: 'preferredPetDescription', type: 'textarea', label: '마음에 두신 아이가 있으신가요? (특징: 성별, 타입, 외모, 컬러패턴, 성격 등)', required: false, order: 12, isStandard: true },
            { id: 'desiredAdoptionTiming', type: 'text', label: '원하시는 입양 시기가 있나요?', required: false, order: 13, isStandard: true },
            { id: 'additionalNotes', type: 'textarea', label: '마지막으로 궁금하신 점이나 남기시고 싶으신 말씀이 있나요?', required: false, order: 14, isStandard: true },
        ];
    }

    /**
     * 입양 신청 폼 조회 (표준 + 커스텀 질문) - 공개 API
     *
     * 입양자가 특정 브리더의 입양 신청 폼 구조를 조회합니다.
     * 표준 14개 질문은 자동으로 포함되며, 브리더가 추가한 커스텀 질문도 함께 반환합니다.
     *
     * @param breederId 브리더 ID
     * @returns 전체 폼 구조 (표준 + 커스텀 질문)
     */
    async getApplicationForm(breederId: string): Promise<any> {
        // ObjectId 형식 검증
        if (!Types.ObjectId.isValid(breederId)) {
            throw new BadRequestException('올바르지 않은 브리더 ID 형식입니다.');
        }

        const breeder = await this.breederModel.findById(breederId).select('applicationForm').lean();
        if (!breeder) {
            throw new BadRequestException('브리더를 찾을 수 없습니다.');
        }

        const standardQuestions = this.getStandardQuestions();

        // 브리더의 커스텀 질문 가져오기
        const customQuestions = ((breeder as any).applicationForm || []).map((q: any, index: number) => ({
            id: q.id,
            type: q.type,
            label: q.label,
            required: q.required,
            options: q.options,
            placeholder: q.placeholder,
            order: standardQuestions.length + index + 1,
            isStandard: false,
        }));

        return {
            standardQuestions,
            customQuestions,
            totalQuestions: standardQuestions.length + customQuestions.length,
        };
    }
}
