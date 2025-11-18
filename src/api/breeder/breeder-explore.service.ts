import { Injectable, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { StorageService } from '../../common/storage/storage.service';

import { Breeder, BreederDocument } from '../../schema/breeder.schema';
import { Adopter, AdopterDocument } from '../../schema/adopter.schema';
import { AvailablePet, AvailablePetDocument } from '../../schema/available-pet.schema';

import { PaginationBuilder } from '../../common/dto/pagination/pagination-builder.dto';
import { SearchBreederRequestDto, BreederSortBy } from './dto/request/search-breeder-request.dto';
import { BreederCardResponseDto } from './dto/response/breeder-card-response.dto';
import { PaginationResponseDto } from '../../common/dto/pagination/pagination-response.dto';

/**
 * 브리더 탐색 서비스
 * 공개 브리더 검색 및 필터링 기능을 제공합니다.
 */
@Injectable()
export class BreederExploreService implements OnModuleInit {
    private readonly logger = new Logger(BreederExploreService.name);

    constructor(
        @InjectModel(Breeder.name) private breederModel: Model<BreederDocument>,
        @InjectModel(Adopter.name) private adopterModel: Model<AdopterDocument>,
        @InjectModel(AvailablePet.name) private availablePetModel: Model<AvailablePetDocument>,
        private readonly storageService: StorageService,
    ) {}

    async onModuleInit() {
        await this.seedMockBreeders();
    }

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
            take = 20,
        } = searchDto;

        // 기본 필터 조건
        const filter: any = {
            'verification.status': 'approved', // 승인된 브리더만
            accountStatus: 'active', // 활성 상태만
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
                { 'profile.location.district': { $in: city } },
            ];
        } else if (province && province.length > 0) {
            filter['profile.location.city'] = { $in: province };
        } else if (city && city.length > 0) {
            filter['profile.location.district'] = { $in: city };
        }

        // 입양 가능 여부 필터
        if (isAdoptionAvailable === true) {
            filter['availablePets'] = {
                $elemMatch: { status: 'available' },
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
        const [breeders, totalCount] = await Promise.all([
            this.breederModel.find(filter).sort(sort).skip(skip).limit(take).lean().exec(),
            this.breederModel.countDocuments(filter),
        ]);
        let totalItems = totalCount;

        // 사용자의 찜 목록 가져오기
        let favoritedBreederIds: string[] = [];
        if (userId) {
            const adopter = await this.adopterModel.findById(userId).lean();
            if (adopter) {
                favoritedBreederIds = adopter.favoriteBreederList?.map((f) => f.favoriteBreederId) || [];
            }
        }

        // 브리더 ID 목록 추출
        const breederIds = breeders.map((b) => b._id);

        // 각 브리더의 분양 가능 애완동물 확인 (별도 컬렉션에서 조회)
        const availablePetsMap = new Map<string, boolean>();
        for (const breederId of breederIds) {
            const hasAvailable = await this.availablePetModel.exists({
                breederId: breederId,
                isActive: true,
                status: 'available',
            });
            availablePetsMap.set(breederId.toString(), !!hasAvailable);
        }

        // 카드 데이터로 변환
        let cards: BreederCardResponseDto[] = breeders.map((breeder) => {
            // 이미지 URL을 Signed URL로 변환
            const representativePhotos = this.storageService.generateSignedUrls(
                breeder.profile?.representativePhotos || [],
                60, // 1시간 유효
            );
            const profileImage = this.storageService.generateSignedUrlSafe(breeder.profileImageFileName, 60);

            return {
                breederId: breeder._id.toString(),
                breederName: breeder.name,
                breederLevel: breeder.verification?.level || 'new',
                location: breeder.profile?.location
                    ? `${breeder.profile.location.city} ${breeder.profile.location.district}`
                    : '',
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

        // 개발 환경에서 데이터가 없을 경우 목업 데이터 반환
        if (cards.length === 0 && process.env.NODE_ENV === 'development') {
            cards = this.getMockBreederCards(petType, take);
            totalItems = cards.length;
        }

        // 페이지네이션 응답 생성
        return new PaginationBuilder<BreederCardResponseDto>()
            .setItems(cards)
            .setTotalCount(totalItems)
            .setPage(page)
            .setTake(take)
            .build();
    }

    /**
     * 목업 브리더 카드 데이터 생성 (개발 환경 전용)
     */
    private getMockBreederCards(petType: string, limit: number): BreederCardResponseDto[] {
        const mockBreeders: BreederCardResponseDto[] = [];

        // 강아지 브리더 목업 데이터
        const dogBreeders = [
            {
                name: '포포네 말티즈',
                breed: '말티즈',
                level: 'elite',
                city: '서울특별시',
                district: '강남구',
                priceMin: 2500000,
                priceMax: 3500000,
                favoriteCount: 245,
                totalReviews: 128,
                averageRating: 4.9,
                profileImage: 'https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?w=200&h=200&fit=crop',
                photos: [
                    'https://images.unsplash.com/photo-1598378856689-e40f18f5c1b7?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=600&fit=crop',
                ],
            },
            {
                name: '해피독 푸들 하우스',
                breed: '푸들',
                level: 'elite',
                city: '경기도',
                district: '성남시',
                priceMin: 2000000,
                priceMax: 3000000,
                favoriteCount: 189,
                totalReviews: 96,
                averageRating: 4.8,
                profileImage: 'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=200&h=200&fit=crop',
                photos: [
                    'https://images.unsplash.com/photo-1564859228273-274232fdb516?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1506755855567-92ff770e8d00?w=800&h=600&fit=crop',
                ],
            },
            {
                name: '코코네 웰시코기',
                breed: '웰시코기',
                level: 'new',
                city: '서울특별시',
                district: '마포구',
                priceMin: 3000000,
                priceMax: 4000000,
                favoriteCount: 156,
                totalReviews: 72,
                averageRating: 4.7,
                profileImage: 'https://images.unsplash.com/photo-1587402092301-725e37c70fd8?w=200&h=200&fit=crop',
                photos: [
                    'https://images.unsplash.com/photo-1612536139280-a61c360c0d1e?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1612536264077-340ff24da544?w=800&h=600&fit=crop',
                ],
            },
            {
                name: '시바 브리더스',
                breed: '시바견',
                level: 'elite',
                city: '경기도',
                district: '용인시',
                priceMin: 2800000,
                priceMax: 3800000,
                favoriteCount: 203,
                totalReviews: 115,
                averageRating: 4.9,
                profileImage: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200&h=200&fit=crop',
                photos: [
                    'https://images.unsplash.com/photo-1600025277863-c2781a6e9e59?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1544986581-efac024faf62?w=800&h=600&fit=crop',
                ],
            },
            {
                name: '뽀미네 포메라니안',
                breed: '포메라니안',
                level: 'new',
                city: '부산광역시',
                district: '해운대구',
                priceMin: 2200000,
                priceMax: 3200000,
                favoriteCount: 134,
                totalReviews: 58,
                averageRating: 4.6,
                profileImage: 'https://images.unsplash.com/photo-1544526226-d4568090ffb8?w=200&h=200&fit=crop',
                photos: [
                    'https://images.unsplash.com/photo-1545321523-7060a113f99e?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1583511655826-05700d7db0d5?w=800&h=600&fit=crop',
                ],
            },
        ];

        // 고양이 브리더 목업 데이터
        const catBreeders = [
            {
                name: '러시안블루 캐터리',
                breed: '러시안블루',
                level: 'elite',
                city: '서울특별시',
                district: '강남구',
                priceMin: 1500000,
                priceMax: 2500000,
                favoriteCount: 178,
                totalReviews: 89,
                averageRating: 4.8,
                profileImage: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=200&h=200&fit=crop',
                photos: [
                    'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=800&h=600&fit=crop',
                ],
            },
            {
                name: '브리티시 키튼하우스',
                breed: '브리티시숏헤어',
                level: 'elite',
                city: '경기도',
                district: '성남시',
                priceMin: 1800000,
                priceMax: 2800000,
                favoriteCount: 215,
                totalReviews: 102,
                averageRating: 4.9,
                profileImage: 'https://images.unsplash.com/photo-1559235038-1b0faeb54a13?w=200&h=200&fit=crop',
                photos: [
                    'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1548366565-6bbab241282d?w=800&h=600&fit=crop',
                ],
            },
            {
                name: '페르시안 궁전',
                breed: '페르시안',
                level: 'new',
                city: '서울특별시',
                district: '마포구',
                priceMin: 2000000,
                priceMax: 3000000,
                favoriteCount: 142,
                totalReviews: 67,
                averageRating: 4.7,
                profileImage: 'https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?w=200&h=200&fit=crop',
                photos: [
                    'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1573865526739-10c1dd7e9e7f?w=800&h=600&fit=crop',
                ],
            },
            {
                name: '스코티시폴드 브리딩',
                breed: '스코티시폴드',
                level: 'elite',
                city: '인천광역시',
                district: '연수구',
                priceMin: 2500000,
                priceMax: 3500000,
                favoriteCount: 198,
                totalReviews: 94,
                averageRating: 4.8,
                profileImage: 'https://images.unsplash.com/photo-1557246565-8a3d3ab5d7f6?w=200&h=200&fit=crop',
                photos: [
                    'https://images.unsplash.com/photo-1606214174585-fe31582dc6ee?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800&h=600&fit=crop',
                ],
            },
            {
                name: '뱅갈 애니멀스',
                breed: '뱅갈',
                level: 'new',
                city: '대구광역시',
                district: '수성구',
                priceMin: 2200000,
                priceMax: 3200000,
                favoriteCount: 167,
                totalReviews: 73,
                averageRating: 4.7,
                profileImage: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&h=200&fit=crop',
                photos: [
                    'https://images.unsplash.com/photo-1579452414917-cabc2a2e7a85?w=800&h=600&fit=crop',
                    'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=800&h=600&fit=crop',
                ],
            },
        ];

        const dataSource = petType === 'dog' ? dogBreeders : catBreeders;

        for (let i = 0; i < Math.min(limit, dataSource.length * 4); i++) {
            const sourceData = dataSource[i % dataSource.length];
            const isAvailable = i % 3 !== 2;

            // 유효한 MongoDB ObjectId 형식으로 목업 ID 생성 (24자리 16진수)
            const mockId = `507f1f77bcf86cd7994390${(i + 1).toString(16).padStart(2, '0')}`;

            mockBreeders.push({
                breederId: mockId,
                breederName: sourceData.name,
                breederLevel: sourceData.level as 'elite' | 'new',
                location: `${sourceData.city} ${sourceData.district}`,
                mainBreed: sourceData.breed,
                isAdoptionAvailable: isAvailable,
                priceRange: {
                    min: sourceData.priceMin,
                    max: sourceData.priceMax,
                    display: 'range',
                },
                favoriteCount: sourceData.favoriteCount + Math.floor(Math.random() * 20),
                isFavorited: false,
                representativePhotos: sourceData.photos,
                profileImage: sourceData.profileImage,
                totalReviews: sourceData.totalReviews + Math.floor(Math.random() * 10),
                averageRating: Math.min(5, sourceData.averageRating + (Math.random() * 0.2 - 0.1)),
                createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
            });
        }

        return mockBreeders;
    }

    /**
     * 개발용 목업 브리더 DB에 생성
     */
    async seedMockBreeders(): Promise<void> {
        this.logger.log('[seedMockBreeders] 시드 함수 시작');

        if (process.env.NODE_ENV !== 'development') {
            this.logger.log('[seedMockBreeders] 프로덕션 환경이므로 스킵');
            return;
        }

        // 이미 브리더가 있으면 스킵
        const existingCount = await this.breederModel.countDocuments();
        this.logger.log(`[seedMockBreeders] 기존 브리더 수: ${existingCount}`);

        if (existingCount > 0) {
            this.logger.log('[seedMockBreeders] 이미 브리더 데이터가 있으므로 스킵');
            return;
        }

        const mockBreeders = [
            // Dog breeders
            {
                emailAddress: 'dog1@example.com',
                nickname: '바람개비 펫',
                phoneNumber: '01012345671',
                userRole: 'breeder',
                accountStatus: 'active',
                termsAgreed: true,
                privacyAgreed: true,
                marketingAgreed: false,
                name: '바람개비 펫',
                petType: 'dog',
                breeds: ['허스키', '말티즈'],
                verification: {
                    status: 'approved',
                    plan: 'basic',
                    level: 'new',
                    documents: [],
                },
                profile: {
                    description: '건강한 강아지 분양합니다',
                    location: { city: '서울특별시', district: '마포구' },
                    representativePhotos: [],
                    specialization: ['dog'],
                },
                stats: {
                    totalFavorites: 15,
                    totalReviews: 8,
                    averageRating: 4.5,
                    profileViews: 120,
                    priceRange: { min: 0, max: 0 },
                    lastUpdated: new Date(),
                },
            },
            {
                emailAddress: 'dog2@example.com',
                nickname: '포포 하우스',
                phoneNumber: '01012345672',
                userRole: 'breeder',
                accountStatus: 'active',
                termsAgreed: true,
                privacyAgreed: true,
                marketingAgreed: false,
                name: '포포 하우스',
                petType: 'dog',
                breeds: ['래브라도 리트리버', '골든 리트리버'],
                verification: {
                    status: 'approved',
                    plan: 'pro',
                    level: 'elite',
                    documents: [],
                },
                profile: {
                    description: '전문 브리더입니다',
                    location: { city: '경기도', district: '성남시' },
                    representativePhotos: [],
                    specialization: ['dog'],
                },
                stats: {
                    totalFavorites: 25,
                    totalReviews: 15,
                    averageRating: 4.8,
                    profileViews: 250,
                    priceRange: { min: 0, max: 0 },
                    lastUpdated: new Date(),
                },
            },
            // Cat breeders
            {
                emailAddress: 'cat1@example.com',
                nickname: '포포 캐터리',
                phoneNumber: '01012345673',
                userRole: 'breeder',
                accountStatus: 'active',
                termsAgreed: true,
                privacyAgreed: true,
                marketingAgreed: false,
                name: '포포 캐터리',
                petType: 'cat',
                breeds: ['페르시안', '샴'],
                verification: {
                    status: 'approved',
                    plan: 'basic',
                    level: 'new',
                    documents: [],
                },
                profile: {
                    description: '건강한 고양이 분양합니다',
                    location: { city: '서울특별시', district: '강남구' },
                    representativePhotos: [],
                    specialization: ['cat'],
                },
                stats: {
                    totalFavorites: 20,
                    totalReviews: 12,
                    averageRating: 4.6,
                    profileViews: 180,
                    priceRange: { min: 0, max: 0 },
                    lastUpdated: new Date(),
                },
            },
        ];

        await this.breederModel.insertMany(mockBreeders);
        this.logger.log('[seedMockBreeders] 목업 브리더 데이터 생성 완료');
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

        // 개발 환경에서 데이터가 없을 경우 목업 데이터 반환
        if (breeders.length === 0 && process.env.NODE_ENV === 'development') {
            const dogMocks = this.getMockBreederCards('dog', Math.ceil(limit / 2));
            const catMocks = this.getMockBreederCards('cat', Math.floor(limit / 2));
            return [...dogMocks, ...catMocks].slice(0, limit).sort((a, b) => b.favoriteCount - a.favoriteCount);
        }

        return Promise.all(
            breeders.map(async (breeder) => {
                // 이미지 URL을 Signed URL로 변환
                const representativePhotos = this.storageService.generateSignedUrls(
                    breeder.profile?.representativePhotos || [],
                    60, // 1시간 유효
                );
                const profileImage = this.storageService.generateSignedUrlSafe(breeder.profileImageFileName, 60);

                // 분양 가능 여부 확인
                const hasAvailable = await this.availablePetModel.exists({
                    breederId: breeder._id,
                    isActive: true,
                    status: 'available',
                });

                return {
                    breederId: breeder._id.toString(),
                    breederName: breeder.name,
                    breederLevel: breeder.verification?.level || 'new',
                    location: breeder.profile?.location
                        ? `${breeder.profile.location.city} ${breeder.profile.location.district}`
                        : '',
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
            }),
        );
    }
}
