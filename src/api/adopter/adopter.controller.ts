import { Controller, Post, Get, Delete, Body, Param, UseGuards, Patch } from '@nestjs/common';

import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { ApiController, ApiEndpoint } from '../../common/decorator/swagger.decorator';
import { Roles } from '../../common/decorator/roles.decorator';
import { RolesGuard } from '../../common/guard/roles.guard';
import { CurrentUser } from '../../common/decorator/user.decorator';
import { ApiResponseDto } from '../../common/dto/response/api-response.dto';

import { AdopterService } from './adopter.service';

import { ApplicationCreateRequestDto } from './dto/request/application-create-request.dto';
import { ReviewCreateRequestDto } from './dto/request/review-create-request.dto';
import { FavoriteAddRequestDto } from './dto/request/favorite-add-request.dto';
import { ReportCreateRequestDto } from './dto/request/report-create-request.dto';
import { AdopterProfileResponseDto } from './dto/response/adopter-profile-response.dto';

@ApiController('입양자')
@Controller('adopter')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('adopter')
export class AdopterController {
    constructor(private readonly adopterService: AdopterService) {}

    @Post('application')
    @ApiEndpoint({
        summary: '입양 신청 제출',
        description: '브리더에게 입양 신청을 제출합니다.',
        isPublic: false,
    })
    async createApplication(@CurrentUser() user: any, @Body() createApplicationDto: ApplicationCreateRequestDto): Promise<ApiResponseDto<any>> {
        const result = await this.adopterService.createApplication(user.userId, createApplicationDto);
        return ApiResponseDto.success(result, '입양 신청이 성공적으로 제출되었습니다.');
    }

    @Post('review')
    @ApiEndpoint({
        summary: '브리더 후기 작성',
        description: '입양 완료 후 브리더에 대한 후기를 작성합니다.',
        isPublic: false,
    })
    async createReview(@CurrentUser() user: any, @Body() createReviewDto: ReviewCreateRequestDto): Promise<ApiResponseDto<any>> {
        const result = await this.adopterService.createReview(user.userId, createReviewDto);
        return ApiResponseDto.success(result, '후기가 성공적으로 작성되었습니다.');
    }

    @Post('favorite')
    @ApiEndpoint({
        summary: '즐겨찾기 브리더 추가',
        description: '관심 있는 브리더를 즐겨찾기에 추가합니다.',
        isPublic: false,
    })
    async addFavorite(@CurrentUser() user: any, @Body() addFavoriteDto: FavoriteAddRequestDto): Promise<ApiResponseDto<any>> {
        const result = await this.adopterService.addFavorite(user.userId, addFavoriteDto);
        return ApiResponseDto.success(result, '즐겨찾기에 성공적으로 추가되었습니다.');
    }

    @Delete('favorite/:breederId')
    @ApiEndpoint({
        summary: '즐겨찾기 브리더 삭제',
        description: '즐겨찾기에서 브리더를 삭제합니다.',
        isPublic: false,
    })
    async removeFavorite(@CurrentUser() user: any, @Param('breederId') breederId: string): Promise<ApiResponseDto<any>> {
        const result = await this.adopterService.removeFavorite(user.userId, breederId);
        return ApiResponseDto.success(result, '즐겨찾기에서 성공적으로 삭제되었습니다.');
    }

    @Post('report')
    @ApiEndpoint({
        summary: '브리더 신고',
        description: '부적절한 사용자나 브리더를 신고합니다.',
        isPublic: false,
    })
    async createReport(@CurrentUser() user: any, @Body() createReportDto: ReportCreateRequestDto): Promise<ApiResponseDto<any>> {
        const result = await this.adopterService.createReport(user.userId, createReportDto);
        return ApiResponseDto.success(result, '신고가 성공적으로 제출되었습니다.');
    }

    @Get('profile')
    @ApiEndpoint({
        summary: '입양자 프로필 조회',
        description: '로그인한 입양자의 프로필 정보를 조회합니다.',
        responseType: AdopterProfileResponseDto,
        isPublic: false,
    })
    async getProfile(@CurrentUser() user: any): Promise<ApiResponseDto<AdopterProfileResponseDto>> {
        const result = await this.adopterService.getProfile(user.userId);
        return ApiResponseDto.success(result, '입양자 프로필이 조회되었습니다.');
    }

    @Patch('profile')
    @ApiEndpoint({
        summary: '입양자 프로필 수정',
        description: '입양자의 프로필 정보를 수정합니다.',
        isPublic: false,
    })
    async updateProfile(
        @CurrentUser() user: any,
        @Body() updateData: { name?: string; phone?: string; profileImage?: string },
    ): Promise<ApiResponseDto<any>> {
        const result = await this.adopterService.updateProfile(user.userId, updateData);
        return ApiResponseDto.success(result, '프로필이 성공적으로 수정되었습니다.');
    }
}
