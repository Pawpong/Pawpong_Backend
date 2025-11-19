import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { HomeService } from './home.service';

import { ApiResponseDto } from '../../common/dto/response/api-response.dto';
import { FaqResponseDto } from './dto/response/faq-response.dto';
import { BannerResponseDto } from './dto/response/banner-response.dto';

/**
 * 홈페이지 공개 API 컨트롤러
 */
@ApiTags('홈페이지')
@Controller('home')
export class HomeController {
    constructor(private readonly homeService: HomeService) {}

    /**
     * 활성화된 배너 목록 조회
     * GET /api/home/banners
     */
    @Get('banners')
    @ApiOperation({
        summary: '메인 배너 목록 조회',
        description: '홈페이지에 표시할 활성화된 배너 목록을 정렬 순서대로 반환합니다.',
    })
    @ApiResponse({
        status: 200,
        description: '배너 목록 조회 성공',
        type: [BannerResponseDto],
    })
    async getBanners(): Promise<ApiResponseDto<BannerResponseDto[]>> {
        const banners = await this.homeService.getActiveBanners();
        return ApiResponseDto.success(banners, '배너 목록이 조회되었습니다.');
    }

    /**
     * 일반 사용자용 FAQ 목록 조회
     * GET /api/home/faqs/adopter
     */
    @Get('faqs/adopter')
    @ApiOperation({
        summary: '일반 사용자 FAQ 조회',
        description: '입양자용 또는 공통 FAQ 목록을 정렬 순서대로 반환합니다.',
    })
    @ApiResponse({
        status: 200,
        description: 'FAQ 목록 조회 성공',
        type: [FaqResponseDto],
    })
    async getAdopterFaqs(): Promise<ApiResponseDto<FaqResponseDto[]>> {
        const faqs = await this.homeService.getAdopterFaqs();
        return ApiResponseDto.success(faqs, 'FAQ 목록이 조회되었습니다.');
    }

    /**
     * 브리더용 FAQ 목록 조회
     * GET /api/home/faqs/breeder
     */
    @Get('faqs/breeder')
    @ApiOperation({
        summary: '브리더 FAQ 조회',
        description: '브리더용 또는 공통 FAQ 목록을 정렬 순서대로 반환합니다.',
    })
    @ApiResponse({
        status: 200,
        description: 'FAQ 목록 조회 성공',
        type: [FaqResponseDto],
    })
    async getBreederFaqs(): Promise<ApiResponseDto<FaqResponseDto[]>> {
        const faqs = await this.homeService.getBreederFaqs();
        return ApiResponseDto.success(faqs, 'FAQ 목록이 조회되었습니다.');
    }
}
