import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Banner, BannerDocument } from '../../../schema/banner.schema';
import { Faq, FaqDocument } from '../../../schema/faq.schema';
import { StorageService } from '../../../common/storage/storage.service';

import { BannerCreateRequestDto } from './dto/request/banner-create-request.dto';
import { BannerUpdateRequestDto } from './dto/request/banner-update-request.dto';
import { FaqCreateRequestDto } from './dto/request/faq-create-request.dto';
import { FaqUpdateRequestDto } from './dto/request/faq-update-request.dto';
import { BannerResponseDto } from '../dto/response/banner-response.dto';
import { FaqResponseDto } from '../dto/response/faq-response.dto';

/**
 * 홈페이지 Admin 서비스
 * 배너 및 FAQ 관리 기능
 */
@Injectable()
export class HomeAdminService {
    private readonly logger = new Logger(HomeAdminService.name);

    constructor(
        @InjectModel(Banner.name) private bannerModel: Model<BannerDocument>,
        @InjectModel(Faq.name) private faqModel: Model<FaqDocument>,
        private readonly storageService: StorageService,
    ) {}

    // ==================== 배너 관리 ====================

    /**
     * 모든 배너 조회 (활성/비활성 모두)
     */
    async getAllBanners(): Promise<BannerResponseDto[]> {
        this.logger.log('[getAllBanners] 전체 배너 목록 조회');

        const banners = await this.bannerModel.find().sort({ order: 1 }).lean().exec();

        return banners.map((banner) => ({
            bannerId: banner._id.toString(),
            imageUrl: this.storageService.generateSignedUrl(banner.imageFileName, 60 * 24),
            linkType: banner.linkType,
            linkUrl: banner.linkUrl,
            title: banner.title,
            description: banner.description,
            order: banner.order,
        }));
    }

    /**
     * 배너 생성
     */
    async createBanner(data: BannerCreateRequestDto): Promise<BannerResponseDto> {
        this.logger.log('[createBanner] 배너 생성 시작', data);

        const newBanner = await this.bannerModel.create(data);

        this.logger.log('[createBanner] 배너 생성 완료', { bannerId: String(newBanner._id) });

        return {
            bannerId: String(newBanner._id),
            imageUrl: this.storageService.generateSignedUrl(newBanner.imageFileName, 60 * 24),
            linkType: newBanner.linkType,
            linkUrl: newBanner.linkUrl,
            title: newBanner.title,
            description: newBanner.description,
            order: newBanner.order,
        };
    }

    /**
     * 배너 수정
     */
    async updateBanner(bannerId: string, data: BannerUpdateRequestDto): Promise<BannerResponseDto> {
        this.logger.log('[updateBanner] 배너 수정 시작', { bannerId, data });

        const banner = await this.bannerModel.findByIdAndUpdate(bannerId, data, { new: true }).lean().exec();

        if (!banner) {
            throw new BadRequestException('배너를 찾을 수 없습니다.');
        }

        this.logger.log('[updateBanner] 배너 수정 완료', { bannerId });

        return {
            bannerId: banner._id.toString(),
            imageUrl: this.storageService.generateSignedUrl(banner.imageFileName, 60 * 24),
            linkType: banner.linkType,
            linkUrl: banner.linkUrl,
            title: banner.title,
            description: banner.description,
            order: banner.order,
        };
    }

    /**
     * 배너 삭제
     */
    async deleteBanner(bannerId: string): Promise<void> {
        this.logger.log('[deleteBanner] 배너 삭제 시작', { bannerId });

        const result = await this.bannerModel.findByIdAndDelete(bannerId).exec();

        if (!result) {
            throw new BadRequestException('배너를 찾을 수 없습니다.');
        }

        this.logger.log('[deleteBanner] 배너 삭제 완료', { bannerId });
    }

    // ==================== FAQ 관리 ====================

    /**
     * 모든 FAQ 조회 (활성/비활성 모두)
     */
    async getAllFaqs(): Promise<FaqResponseDto[]> {
        this.logger.log('[getAllFaqs] 전체 FAQ 목록 조회');

        const faqs = await this.faqModel.find().sort({ order: 1 }).lean().exec();

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
     * FAQ 생성
     */
    async createFaq(data: FaqCreateRequestDto): Promise<FaqResponseDto> {
        this.logger.log('[createFaq] FAQ 생성 시작', data);

        const newFaq = await this.faqModel.create(data);

        this.logger.log('[createFaq] FAQ 생성 완료', { faqId: String(newFaq._id) });

        return {
            faqId: String(newFaq._id),
            question: newFaq.question,
            answer: newFaq.answer,
            category: newFaq.category,
            userType: newFaq.userType,
            order: newFaq.order,
        };
    }

    /**
     * FAQ 수정
     */
    async updateFaq(faqId: string, data: FaqUpdateRequestDto): Promise<FaqResponseDto> {
        this.logger.log('[updateFaq] FAQ 수정 시작', { faqId, data });

        const faq = await this.faqModel.findByIdAndUpdate(faqId, data, { new: true }).lean().exec();

        if (!faq) {
            throw new BadRequestException('FAQ를 찾을 수 없습니다.');
        }

        this.logger.log('[updateFaq] FAQ 수정 완료', { faqId });

        return {
            faqId: faq._id.toString(),
            question: faq.question,
            answer: faq.answer,
            category: faq.category,
            userType: faq.userType,
            order: faq.order,
        };
    }

    /**
     * FAQ 삭제
     */
    async deleteFaq(faqId: string): Promise<void> {
        this.logger.log('[deleteFaq] FAQ 삭제 시작', { faqId });

        const result = await this.faqModel.findByIdAndDelete(faqId).exec();

        if (!result) {
            throw new BadRequestException('FAQ를 찾을 수 없습니다.');
        }

        this.logger.log('[deleteFaq] FAQ 삭제 완료', { faqId });
    }
}
