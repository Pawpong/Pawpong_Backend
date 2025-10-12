import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Breeder, BreederDocument } from '../../schema/breeder.schema';
import { Adopter, AdopterDocument } from '../../schema/adopter.schema';
import { AvailablePet, AvailablePetDocument } from '../../schema/available-pet.schema';
import { SearchBreederRequestDto, BreederSortBy } from './dto/request/search-breeder-request.dto';
import { BreederCardResponseDto } from './dto/response/breeder-card-response.dto';
import { PaginationResponseDto } from '../../common/dto/pagination/pagination-response.dto';
import { PaginationBuilder } from '../../common/dto/pagination/pagination-builder.dto';
import { StorageService } from '../../common/storage/storage.service';

/**
 * 브리더 탐색 서비스
 * 공개 브리더 검색 및 필터링 기능을 제공합니다.
 */
@Injectable()
export class BreederExploreService {
    constructor(
        @InjectModel(Breeder.name) private breederModel: Model<BreederDocument>,
        @InjectModel(Adopter.name) private adopterModel: Model<AdopterDocument>,
        @InjectModel(AvailablePet.name) private availablePetModel: Model<AvailablePetDocument>,
        private readonly storageService: StorageService,
    ) {}

    /**
     * 브리더 탐색/검색 기능
     */
    async searchBreeders(
        searchDto: SearchBreederRequestDto,
        userId?: string,
    ): Promise<PaginationResponseDto<BreederCardResponseDto>> {
        const { 
            petType, 
            dogSize, 
            catFurLength, 
            province, 
            city, 
            isAdoptionAvailable, 
            breederLevel, 
            sortBy, 
            page = 1, 
            take = 20 
        } = searchDto;

        // 기본 필터 조건
        const filter: any = {
            'verification.status': 'approved', // 승인된 브리더만
            status: 'active', // 활성 상태만
            petType: petType, // 반려동물 타입
        };

        // 강아지 크기 필터 (강아지일 때만)
        if (petType === 'dog' && dogSize && dogSize.length > 0) {
            filter['availablePets.size'] = { $in: dogSize };
        }

        // 고양이 털 길이 필터 (고양이일 때만)  
        if (petType === 'cat' && catFurLength && catFurLength.length > 0) {
            filter['availablePets.furLength'] = { $in: catFurLength };
        }

        // 지역 필터
        if (province && province.length > 0 && city && city.length > 0) {
            filter['$and'] = [
                { 'profile.location.city': { $in: province } },
                { 'profile.location.district': { $in: city } }
            ];
        } else if (province && province.length > 0) {
            filter['profile.location.city'] = { $in: province };
        } else if (city && city.length > 0) {
            filter['profile.location.district'] = { $in: city };
        }

        // 입양 가능 여부 필터
        if (isAdoptionAvailable === true) {
            filter['availablePets'] = {
                $elemMatch: { status: 'available' }
            };
        }

        // 브리더 레벨 필터
        if (breederLevel && breederLevel.length > 0) {
            filter['verification.level'] = { $in: breederLevel };
        }

        // 정렬 옵션
        let sort: any = {};
        switch (sortBy) {
            case BreederSortBy.LATEST:
                sort = { createdAt: -1 };
                break;
            case BreederSortBy.FAVORITE:
                sort = { 'stats.totalFavorites': -1 };
                break;
            case BreederSortBy.REVIEW:
                sort = { 'stats.totalReviews': -1 };
                break;
            case BreederSortBy.PRICE_ASC:
                sort = { 'profile.priceRange.min': 1 };
                break;
            case BreederSortBy.PRICE_DESC:
                sort = { 'profile.priceRange.max': -1 };
                break;
            default:
                sort = { createdAt: -1 };
        }

        // 페이지네이션 계산
        const skip = (page - 1) * take;

        // 데이터 조회
        const [breeders, totalItems] = await Promise.all([
            this.breederModel
                .find(filter)
                .sort(sort)
                .skip(skip)
                .limit(take)
                .lean()
                .exec(),
            this.breederModel.countDocuments(filter),
        ]);

        // 사용자의 찜 목록 가져오기
        let favoritedBreederIds: string[] = [];
        if (userId) {
            const adopter = await this.adopterModel.findById(userId).lean();
            if (adopter) {
                favoritedBreederIds = adopter.favoriteBreederList?.map(f => f.favoriteBreederId) || [];
            }
        }

        // 브리더 ID 목록 추출
        const breederIds = breeders.map(b => b._id);

        // 각 브리더의 분양 가능 애완동물 확인 (별도 컬렉션에서 조회)
        const availablePetsMap = new Map<string, boolean>();
        for (const breederId of breederIds) {
            const hasAvailable = await this.availablePetModel.exists({
                breederId: breederId,
                isActive: true,
                status: 'available'
            });
            availablePetsMap.set(breederId.toString(), !!hasAvailable);
        }

        // 카드 데이터로 변환
        const cards: BreederCardResponseDto[] = breeders.map(breeder => {
            // 이미지 URL을 Signed URL로 변환
            const representativePhotos = this.storageService.generateSignedUrls(
                breeder.profile?.representativePhotos || [],
                60 // 1시간 유효
            );
            const profileImage = this.storageService.generateSignedUrlSafe(
                breeder.profileImageUrl,
                60
            );

            return {
                breederId: breeder._id.toString(),
                breederName: breeder.name,
                breederLevel: breeder.verification?.level || 'new',
                location: breeder.profile?.location ?
                    `${breeder.profile.location.city} ${breeder.profile.location.district}` : '',
                mainBreed: breeder.breeds?.[0] || '',
                isAdoptionAvailable: availablePetsMap.get(breeder._id.toString()) || false,
                priceRange: {
                    min: breeder.stats?.priceRange?.min || 0,
                    max: breeder.stats?.priceRange?.max || 0,
                    display: 'range',
                },
                favoriteCount: breeder.stats?.totalFavorites || 0,
                isFavorited: favoritedBreederIds.includes(breeder._id.toString()),
                representativePhotos: representativePhotos,
                profileImage: profileImage,
                totalReviews: breeder.stats?.totalReviews || 0,
                averageRating: breeder.stats?.averageRating || 0,
                createdAt: (breeder as any).createdAt || new Date(),
            };
        });

        // 페이지네이션 응답 생성
        return new PaginationBuilder<BreederCardResponseDto>()
            .setItems(cards)
            .setTotalCount(totalItems)
            .setPage(page)
            .setTake(take)
            .build();
    }

    /**
     * 인기 브리더 목록 조회
     */
    async getPopularBreeders(limit: number = 10): Promise<BreederCardResponseDto[]> {
        const breeders = await this.breederModel
            .find({
                'verification.status': 'approved',
                status: 'active',
            })
            .sort({ 'stats.totalFavorites': -1, 'stats.averageRating': -1 })
            .limit(limit)
            .lean()
            .exec();

        return Promise.all(breeders.map(async breeder => {
            // 이미지 URL을 Signed URL로 변환
            const representativePhotos = this.storageService.generateSignedUrls(
                breeder.profile?.representativePhotos || [],
                60 // 1시간 유효
            );
            const profileImage = this.storageService.generateSignedUrlSafe(
                breeder.profileImageUrl,
                60
            );

            // 분양 가능 여부 확인
            const hasAvailable = await this.availablePetModel.exists({
                breederId: breeder._id,
                isActive: true,
                status: 'available'
            });

            return {
                breederId: breeder._id.toString(),
                breederName: breeder.name,
                breederLevel: breeder.verification?.level || 'new',
                location: breeder.profile?.location ?
                    `${breeder.profile.location.city} ${breeder.profile.location.district}` : '',
                mainBreed: breeder.breeds?.[0] || '',
                isAdoptionAvailable: !!hasAvailable,
                priceRange: undefined, // 로그인 필요
                favoriteCount: breeder.stats?.totalFavorites || 0,
                isFavorited: false,
                representativePhotos: representativePhotos,
                profileImage: profileImage,
                totalReviews: breeder.stats?.totalReviews || 0,
                averageRating: breeder.stats?.averageRating || 0,
                createdAt: (breeder as any).createdAt || new Date(),
            };
        }));
    }
}