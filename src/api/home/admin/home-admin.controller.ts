import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { HomeAdminService } from './home-admin.service';
import { JwtAuthGuard } from '../../../common/guard/jwt-auth.guard';
import { RolesGuard } from '../../../common/guard/roles.guard';
import { Roles } from '../../../common/decorator/roles.decorator';
import { ApiResponseDto } from '../../../common/dto/response/api-response.dto';

import { BannerCreateRequestDto } from './dto/request/banner-create-request.dto';
import { BannerUpdateRequestDto } from './dto/request/banner-update-request.dto';
import { FaqCreateRequestDto } from './dto/request/faq-create-request.dto';
import { FaqUpdateRequestDto } from './dto/request/faq-update-request.dto';
import { BannerResponseDto } from '../dto/response/banner-response.dto';
import { FaqResponseDto } from '../dto/response/faq-response.dto';

/**
 * 홈페이지 Admin 컨트롤러
 * 배너 및 FAQ 관리
 */
@ApiTags('홈페이지 관리자')
@ApiBearerAuth('JWT-Auth')
@Controller('home-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class HomeAdminController {
    constructor(private readonly homeAdminService: HomeAdminService) {}

    // ==================== 배너 관리 ====================

    @Get('banners')
    @ApiOperation({
        summary: '배너 전체 목록 조회 (관리자)',
        description: '활성/비활성 포함 모든 배너를 조회합니다.',
    })
    @ApiResponse({ status: 200, description: '성공', type: [BannerResponseDto] })
    async getAllBanners(): Promise<ApiResponseDto<BannerResponseDto[]>> {
        const banners = await this.homeAdminService.getAllBanners();
        return ApiResponseDto.success(banners, '배너 목록이 조회되었습니다.');
    }

    @Post('banner')
    @ApiOperation({
        summary: '배너 생성',
        description: '새로운 배너를 생성합니다.',
    })
    @ApiResponse({ status: 200, description: '생성 성공', type: BannerResponseDto })
    async createBanner(@Body() data: BannerCreateRequestDto): Promise<ApiResponseDto<BannerResponseDto>> {
        const banner = await this.homeAdminService.createBanner(data);
        return ApiResponseDto.success(banner, '배너가 생성되었습니다.');
    }

    @Put('banner/:bannerId')
    @ApiOperation({
        summary: '배너 수정',
        description: '기존 배너를 수정합니다.',
    })
    @ApiResponse({ status: 200, description: '수정 성공', type: BannerResponseDto })
    async updateBanner(
        @Param('bannerId') bannerId: string,
        @Body() data: BannerUpdateRequestDto,
    ): Promise<ApiResponseDto<BannerResponseDto>> {
        const banner = await this.homeAdminService.updateBanner(bannerId, data);
        return ApiResponseDto.success(banner, '배너가 수정되었습니다.');
    }

    @Delete('banner/:bannerId')
    @ApiOperation({
        summary: '배너 삭제',
        description: '배너를 삭제합니다.',
    })
    @ApiResponse({ status: 200, description: '삭제 성공' })
    async deleteBanner(@Param('bannerId') bannerId: string): Promise<ApiResponseDto<null>> {
        await this.homeAdminService.deleteBanner(bannerId);
        return ApiResponseDto.success(null, '배너가 삭제되었습니다.');
    }

    // ==================== FAQ 관리 ====================

    @Get('faqs')
    @ApiOperation({
        summary: 'FAQ 전체 목록 조회 (관리자)',
        description: '활성/비활성 포함 모든 FAQ를 조회합니다.',
    })
    @ApiResponse({ status: 200, description: '성공', type: [FaqResponseDto] })
    async getAllFaqs(): Promise<ApiResponseDto<FaqResponseDto[]>> {
        const faqs = await this.homeAdminService.getAllFaqs();
        return ApiResponseDto.success(faqs, 'FAQ 목록이 조회되었습니다.');
    }

    @Post('faq')
    @ApiOperation({
        summary: 'FAQ 생성',
        description: '새로운 FAQ를 생성합니다.',
    })
    @ApiResponse({ status: 200, description: '생성 성공', type: FaqResponseDto })
    async createFaq(@Body() data: FaqCreateRequestDto): Promise<ApiResponseDto<FaqResponseDto>> {
        const faq = await this.homeAdminService.createFaq(data);
        return ApiResponseDto.success(faq, 'FAQ가 생성되었습니다.');
    }

    @Put('faq/:faqId')
    @ApiOperation({
        summary: 'FAQ 수정',
        description: '기존 FAQ를 수정합니다.',
    })
    @ApiResponse({ status: 200, description: '수정 성공', type: FaqResponseDto })
    async updateFaq(
        @Param('faqId') faqId: string,
        @Body() data: FaqUpdateRequestDto,
    ): Promise<ApiResponseDto<FaqResponseDto>> {
        const faq = await this.homeAdminService.updateFaq(faqId, data);
        return ApiResponseDto.success(faq, 'FAQ가 수정되었습니다.');
    }

    @Delete('faq/:faqId')
    @ApiOperation({
        summary: 'FAQ 삭제',
        description: 'FAQ를 삭제합니다.',
    })
    @ApiResponse({ status: 200, description: '삭제 성공' })
    async deleteFaq(@Param('faqId') faqId: string): Promise<ApiResponseDto<null>> {
        await this.homeAdminService.deleteFaq(faqId);
        return ApiResponseDto.success(null, 'FAQ가 삭제되었습니다.');
    }
}
