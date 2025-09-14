import { Controller, Get, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';

import { Roles } from '../../common/decorator/roles.decorator';
import { CurrentUser } from '../../common/decorator/user.decorator';
import { RolesGuard } from '../../common/guard/roles.guard';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';

import { AdminService } from './admin.service';

import { BreederVerificationRequestDto } from './dto/request/breederVerification-request.dto';
import { UserManagementRequestDto } from './dto/request/userManagement-request.dto';
import { ReportActionRequestDto } from './dto/request/reportAction-request.dto';
import { BreederSearchRequestDto } from './dto/request/breederSearch-request.dto';
import { UserSearchRequestDto } from './dto/request/userSearch-request.dto';
import { StatsFilterRequestDto } from './dto/request/statsFilter-request.dto';
import { AdminStatsResponseDto } from './dto/response/adminStats-response.dto';
import { ApplicationMonitoringRequestDto } from './dto/request/applicationMonitoring-request.dto';
import { BreederVerificationResponseDto } from './dto/response/breederVerification-response.dto';
import { UserManagementResponseDto } from './dto/response/userManagement-response.dto';
import { ReportManagementResponseDto } from './dto/response/reportManagement-response.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @Get('profile')
    async getProfile(@CurrentUser() user: any) {
        return this.adminService.getAdminProfile(user.userId);
    }

    @Get('verification/pending')
    async getPendingBreederVerifications(@CurrentUser() user: any, @Query() filter: BreederSearchRequestDto) {
        return this.adminService.getPendingBreederVerifications(user.userId, filter);
    }

    @Put('verification/:breederId')
    async updateBreederVerification(
        @CurrentUser() user: any,
        @Param('breederId') breederId: string,
        @Body() verificationData: BreederVerificationRequestDto,
    ) {
        return this.adminService.updateBreederVerification(user.userId, breederId, verificationData);
    }

    @Get('users')
    async getUsers(@CurrentUser() user: any, @Query() filter: UserSearchRequestDto) {
        return this.adminService.getUsers(user.userId, filter);
    }

    @Put('users/:userId/status')
    async updateUserStatus(
        @CurrentUser() user: any,
        @Param('userId') userId: string,
        @Query('role') role: 'adopter' | 'breeder',
        @Body() userData: UserManagementRequestDto,
    ) {
        return this.adminService.updateUserStatus(user.userId, userId, role, userData);
    }

    @Get('applications')
    async getApplications(@CurrentUser() user: any, @Query() filter: ApplicationMonitoringRequestDto) {
        return this.adminService.getApplications(user.userId, filter);
    }

    @Get('reports')
    async getReports(
        @CurrentUser() user: any,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
    ) {
        return this.adminService.getReports(user.userId, parseInt(page), parseInt(limit));
    }

    @Put('reports/:breederId/:reportId')
    async updateReportStatus(
        @CurrentUser() user: any,
        @Param('breederId') breederId: string,
        @Param('reportId') reportId: string,
        @Body() reportAction: ReportActionRequestDto,
    ) {
        return this.adminService.updateReportStatus(user.userId, breederId, reportId, reportAction);
    }

    @Delete('reviews/:breederId/:reviewId')
    async deleteReview(
        @CurrentUser() user: any,
        @Param('breederId') breederId: string,
        @Param('reviewId') reviewId: string,
    ) {
        return this.adminService.deleteReview(user.userId, breederId, reviewId);
    }

    @Get('stats')
    async getStats(@CurrentUser() user: any, @Query() filter: StatsFilterRequestDto): Promise<AdminStatsResponseDto> {
        return this.adminService.getStats(user.userId, filter);
    }
}
