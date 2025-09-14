import { Controller, Post, Get, Delete, Body, Param, UseGuards, Patch } from '@nestjs/common';

import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { Roles } from '../../common/decorator/roles.decorator';
import { RolesGuard } from '../../common/guard/roles.guard';
import { CurrentUser } from '../../common/decorator/user.decorator';

import { AdopterService } from './adopter.service';

import { ApplicationCreateRequestDto } from './dto/request/application-create-request.dto';
import { ReviewCreateRequestDto } from './dto/request/review-create-request.dto';
import { FavoriteAddRequestDto } from './dto/request/favorite-add-request.dto';
import { ReportCreateRequestDto } from './dto/request/report-create-request.dto';
import { AdopterProfileResponseDto } from './dto/response/adopter-profile-response.dto';

@Controller('adopter')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('adopter')
export class AdopterController {
    constructor(private readonly adopterService: AdopterService) {}

    @Post('application')
    async createApplication(@CurrentUser() user: any, @Body() createApplicationDto: ApplicationCreateRequestDto) {
        return this.adopterService.createApplication(user.userId, createApplicationDto);
    }

    @Post('review')
    async createReview(@CurrentUser() user: any, @Body() createReviewDto: ReviewCreateRequestDto) {
        return this.adopterService.createReview(user.userId, createReviewDto);
    }

    @Post('favorite')
    async addFavorite(@CurrentUser() user: any, @Body() addFavoriteDto: FavoriteAddRequestDto) {
        return this.adopterService.addFavorite(user.userId, addFavoriteDto);
    }

    @Delete('favorite/:breederId')
    async removeFavorite(@CurrentUser() user: any, @Param('breederId') breederId: string) {
        return this.adopterService.removeFavorite(user.userId, breederId);
    }

    @Post('report')
    async createReport(@CurrentUser() user: any, @Body() createReportDto: ReportCreateRequestDto) {
        return this.adopterService.createReport(user.userId, createReportDto);
    }

    @Get('profile')
    async getProfile(@CurrentUser() user: any): Promise<AdopterProfileResponseDto> {
        return this.adopterService.getProfile(user.userId);
    }

    @Patch('profile')
    async updateProfile(
        @CurrentUser() user: any,
        @Body() updateData: { name?: string; phone?: string; profileImage?: string },
    ) {
        return this.adopterService.updateProfile(user.userId, updateData);
    }
}
