import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { AvailablePetRepository } from './repository/available-pet.repository';
import { StorageService } from '../../common/storage/storage.service';

import { AvailablePetResponseDto } from './dto/response/available-pet-response.dto';
import { BannerResponseDto } from './dto/response/banner-response.dto';
import { FaqResponseDto } from './dto/response/faq-response.dto';

import { AvailablePetDocument } from '../../schema/available-pet.schema';
import { Banner, BannerDocument } from '../../schema/banner.schema';
import { Faq, FaqDocument } from '../../schema/faq.schema';

/**
 * Home Service
 * 홈 화면 관련 비즈니스 로직
 */
@Injectable()
export class HomeService {
    private readonly logger = new Logger(HomeService.name);

    constructor(
        private readonly availablePetRepository: AvailablePetRepository,
        private readonly storageService: StorageService,
        @InjectModel(Banner.name) private readonly bannerModel: Model<BannerDocument>,
        @InjectModel(Faq.name) private readonly faqModel: Model<FaqDocument>,
    ) {}

    /**
     * 분양중인 아이들 조회 (최신 등록순)
     * @param limit 조회할 개수 (default: 10)
     * @returns AvailablePetResponseDto 배열
     */
    async getAvailablePets(limit: number = 10): Promise<AvailablePetResponseDto[]> {
        this.logger.log(`[getAvailablePets] 분양중인 아이들 조회 시작: limit=${limit}`);

        // 1. DB에서 입양 가능한 반려동물 조회
        const pets = await this.availablePetRepository.findAvailablePets(limit);

        this.logger.log(`[getAvailablePets] ${pets.length}개의 반려동물 조회 완료`);

        // 2. DTO로 변환 (Signed URL 동적 생성)
        const petDtos = pets.map((pet) => this.mapPetToDto(pet));

        this.logger.log(`[getAvailablePets] DTO 변환 완료`);

        return petDtos;
    }

    /**
     * AvailablePet Document를 AvailablePetResponseDto로 변환
     * @param pet AvailablePet Document
     * @returns AvailablePetResponseDto
     */
    private mapPetToDto(pet: AvailablePetDocument): AvailablePetResponseDto {
        // 대표 사진 (photos 배열의 첫 번째) - 동적으로 Signed URL 생성 (1시간 유효)
        const photoFileName = pet.photos && pet.photos.length > 0 ? pet.photos[0] : '';
        const photoUrl = photoFileName ? this.storageService.generateSignedUrl(photoFileName, 60) : '';

        return {
            petId: pet._id.toString(),
            name: pet.name,
            breed: pet.breed,
            gender: pet.gender,
            birthDate: pet.birthDate.toISOString().split('T')[0], // "2024-12-01" 형식
            photoUrl, // Signed URL (대표 사진)
            breeder: {
                breederId: (pet.breederId as any)._id?.toString() || pet.breederId.toString(),
                breederName: (pet.breederId as any).name || '알 수 없음',
            },
            status: pet.status,
            createdAt: (pet as any).createdAt?.toISOString() || new Date().toISOString(),
        };
    }

    /**
     * 메인 배너 목록 조회
     * @returns BannerResponseDto 배열
     */
    async getBanners(): Promise<BannerResponseDto[]> {
        this.logger.log('[getBanners] 메인 배너 목록 조회 시작');

        // 활성화된 배너를 정렬 순서대로 조회
        const banners = await this.bannerModel.find({ isActive: true }).sort({ order: 1 }).lean().exec();

        this.logger.log(`[getBanners] ${banners.length}개의 배너 조회 완료`);

        // DTO로 변환 (Signed URL 동적 생성)
        const bannerDtos = banners.map((banner) => ({
            id: banner._id.toString(),
            imageUrl: this.storageService.generateSignedUrl(banner.imageFileName, 60), // 1시간 유효
            linkType: banner.linkType,
            linkUrl: banner.linkUrl,
            order: banner.order,
            title: banner.title,
        }));

        return bannerDtos;
    }

    /**
     * 자주 묻는 질문 목록 조회
     * @param userType 사용자 타입 (adopter, breeder, both)
     * @param limit 조회할 개수
     * @returns FaqResponseDto 배열
     */
    async getFaqs(userType: string = 'both', limit: number = 10): Promise<FaqResponseDto[]> {
        this.logger.log(`[getFaqs] FAQ 조회 시작: userType=${userType}, limit=${limit}`);

        // userType에 맞는 FAQ 조회 (both 포함)
        const query = userType === 'both' ? { isActive: true } : { isActive: true, userType: { $in: [userType, 'both'] } };

        const faqs = await this.faqModel.find(query).sort({ order: 1 }).limit(limit).lean().exec();

        this.logger.log(`[getFaqs] ${faqs.length}개의 FAQ 조회 완료`);

        // DTO로 변환
        const faqDtos = faqs.map((faq) => ({
            id: faq._id.toString(),
            question: faq.question,
            answer: faq.answer,
            category: faq.category,
            order: faq.order,
        }));

        return faqDtos;
    }
}
