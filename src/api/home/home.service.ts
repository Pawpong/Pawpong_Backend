import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Banner, BannerDocument } from '../../schema/banner.schema';
import { Faq, FaqDocument } from '../../schema/faq.schema';
import { StorageService } from '../../common/storage/storage.service';
import { BannerResponseDto } from './dto/response/banner-response.dto';
import { FaqResponseDto } from './dto/response/faq-response.dto';

/**
 * 홈페이지 서비스
 * 배너, FAQ 등 홈페이지 공개 API
 */
@Injectable()
export class HomeService {
    private readonly logger = new Logger(HomeService.name);

    constructor(
        @InjectModel(Banner.name) private bannerModel: Model<BannerDocument>,
        @InjectModel(Faq.name) private faqModel: Model<FaqDocument>,
        private readonly storageService: StorageService,
    ) {}

    /**
     * 활성화된 배너 목록 조회
     * 정렬 순서대로 반환
     */
    async getActiveBanners(): Promise<BannerResponseDto[]> {
        this.logger.log('[getActiveBanners] 배너 목록 조회 시작');

        const banners = await this.bannerModel
            .find({ isActive: true })
            .sort({ order: 1 })
            .lean()
            .exec();

        this.logger.log(`[getActiveBanners] ${banners.length}개의 배너 조회 완료`);

        return banners.map((banner) => ({
            bannerId: banner._id.toString(),
            imageUrl: this.storageService.generateSignedUrl(banner.imageFileName, 60 * 24), // 24시간 유효
            linkType: banner.linkType,
            linkUrl: banner.linkUrl,
            title: banner.title,
            description: banner.description,
            order: banner.order,
        }));
    }

    /**
     * 일반 사용자용 FAQ 목록 조회
     * userType이 'adopter' 또는 'both'인 FAQ만 반환
     */
    async getAdopterFaqs(): Promise<FaqResponseDto[]> {
        this.logger.log('[getAdopterFaqs] 일반 사용자 FAQ 조회 시작');

        const faqs = await this.faqModel
            .find({
                isActive: true,
                userType: { $in: ['adopter', 'both'] },
            })
            .sort({ order: 1 })
            .lean()
            .exec();

        this.logger.log(`[getAdopterFaqs] ${faqs.length}개의 FAQ 조회 완료`);

        return faqs.map((faq) => ({
            faqId: faq._id.toString(),
            question: faq.question,
            answer: faq.answer,
            category: faq.category,
            userType: faq.userType,
            order: faq.order,
        }));
    }

    /**
     * 브리더용 FAQ 목록 조회
     * userType이 'breeder' 또는 'both'인 FAQ만 반환
     */
    async getBreederFaqs(): Promise<FaqResponseDto[]> {
        this.logger.log('[getBreederFaqs] 브리더 FAQ 조회 시작');

        const faqs = await this.faqModel
            .find({
                isActive: true,
                userType: { $in: ['breeder', 'both'] },
            })
            .sort({ order: 1 })
            .lean()
            .exec();

        this.logger.log(`[getBreederFaqs] ${faqs.length}개의 FAQ 조회 완료`);

        return faqs.map((faq) => ({
            faqId: faq._id.toString(),
            question: faq.question,
            answer: faq.answer,
            category: faq.category,
            userType: faq.userType,
            order: faq.order,
        }));
    }
}
