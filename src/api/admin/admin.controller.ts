import { Controller, Get, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';

import { Roles } from '../../common/decorator/roles.decorator';
import { CurrentUser } from '../../common/decorator/user.decorator';
import { RolesGuard } from '../../common/guard/roles.guard';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { ApiResponseDto } from '../../common/dto/response/api-response.dto';
import { ApiController, ApiEndpoint } from '../../common/decorator/swagger.decorator';

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

@ApiController('관리자')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @Get('profile')
    @ApiEndpoint({
        summary: '관리자 프로필 조회',
        description: '관리자의 프로필 정보를 조회합니다.',
        isPublic: false,
    })
    async getProfile(@CurrentUser() user: any): Promise<ApiResponseDto<any>> {
        const result = await this.adminService.getAdminProfile(user.userId);
        return ApiResponseDto.success(result, '관리자 프로필이 조회되었습니다.');
    }

    @Get('verification/pending')
    @ApiEndpoint({
        summary: '승인 대기 브리더 목록 조회',
        description: '인증 승인을 대기중인 브리더 목록을 조회합니다.',
        responseType: BreederVerificationResponseDto,
        isPublic: false,
    })
    async getPendingBreederVerifications(@CurrentUser() user: any, @Query() filter: BreederSearchRequestDto): Promise<ApiResponseDto<BreederVerificationResponseDto[]>> {
        const result = await this.adminService.getPendingBreederVerifications(user.userId, filter);
        return ApiResponseDto.success(result, '승인 대기 브리더 목록이 조회되었습니다.');
    }

    @Put('verification/:breederId')
    @ApiEndpoint({
        summary: '브리더 인증 승인/거절',
        description: '브리더의 인증 신청을 승인하거나 거절합니다.',
        isPublic: false,
    })
    async updateBreederVerification(
        @CurrentUser() user: any,
        @Param('breederId') breederId: string,
        @Body() verificationData: BreederVerificationRequestDto,
    ): Promise<ApiResponseDto<any>> {
        const result = await this.adminService.updateBreederVerification(user.userId, breederId, verificationData);
        return ApiResponseDto.success(result, '브리더 인증 처리가 완료되었습니다.');
    }

    @Get('users')
    @ApiEndpoint({
        summary: '사용자 목록 조회',
        description: '전체 사용자 목록을 조회합니다.',
        responseType: UserManagementResponseDto,
        isPublic: false,
    })
    async getUsers(@CurrentUser() user: any, @Query() filter: UserSearchRequestDto): Promise<ApiResponseDto<UserManagementResponseDto[]>> {
        const result = await this.adminService.getUsers(user.userId, filter);
        return ApiResponseDto.success(result, '사용자 목록이 조회되었습니다.');
    }

    @Put('users/:userId/status')
    @ApiEndpoint({
        summary: '사용자 상태 변경',
        description: '사용자의 계정 상태를 변경합니다.',
        isPublic: false,
    })
    async updateUserStatus(
        @CurrentUser() user: any,
        @Param('userId') userId: string,
        @Query('role') role: 'adopter' | 'breeder',
        @Body() userData: UserManagementRequestDto,
    ): Promise<ApiResponseDto<any>> {
        const result = await this.adminService.updateUserStatus(user.userId, userId, role, userData);
        return ApiResponseDto.success(result, '사용자 상태가 변경되었습니다.');
    }

    @Get('applications')
    @ApiEndpoint({
        summary: '입양 신청 모니터링',
        description: '전체 입양 신청 현황을 모니터링합니다.',
        isPublic: false,
    })
    async getApplications(@CurrentUser() user: any, @Query() filter: ApplicationMonitoringRequestDto): Promise<ApiResponseDto<any>> {
        const result = await this.adminService.getApplications(user.userId, filter);
        return ApiResponseDto.success(result, '입양 신청 현황이 조회되었습니다.');
    }

    @Get('reports')
    @ApiEndpoint({
        summary: '신고 목록 조회',
        description: '접수된 신고 목록을 조회합니다.',
        responseType: ReportManagementResponseDto,
        isPublic: false,
    })
    async getReports(
        @CurrentUser() user: any,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
    ): Promise<ApiResponseDto<ReportManagementResponseDto[]>> {
        const result = await this.adminService.getReports(user.userId, parseInt(page), parseInt(limit));
        return ApiResponseDto.success(result, '신고 목록이 조회되었습니다.');
    }

    @Put('reports/:breederId/:reportId')
    @ApiEndpoint({
        summary: '신고 처리',
        description: '접수된 신고를 처리합니다.',
        isPublic: false,
    })
    async updateReportStatus(
        @CurrentUser() user: any,
        @Param('breederId') breederId: string,
        @Param('reportId') reportId: string,
        @Body() reportAction: ReportActionRequestDto,
    ): Promise<ApiResponseDto<any>> {
        const result = await this.adminService.updateReportStatus(user.userId, breederId, reportId, reportAction);
        return ApiResponseDto.success(result, '신고 처리가 완료되었습니다.');
    }

    @Delete('reviews/:breederId/:reviewId')
    @ApiEndpoint({
        summary: '부적절한 후기 삭제',
        description: '신고된 부적절한 후기를 삭제합니다.',
        isPublic: false,
    })
    async deleteReview(
        @CurrentUser() user: any,
        @Param('breederId') breederId: string,
        @Param('reviewId') reviewId: string,
    ): Promise<ApiResponseDto<any>> {
        const result = await this.adminService.deleteReview(user.userId, breederId, reviewId);
        return ApiResponseDto.success(result, '부적절한 후기가 삭제되었습니다.');
    }

    @Get('stats')
    @ApiEndpoint({
        summary: '시스템 통계 조회',
        description: '플랫폼 전체 통계 정보를 조회합니다.',
        responseType: AdminStatsResponseDto,
        isPublic: false,
    })
    async getStats(@CurrentUser() user: any, @Query() filter: StatsFilterRequestDto): Promise<ApiResponseDto<AdminStatsResponseDto>> {
        const result = await this.adminService.getStats(user.userId, filter);
        return ApiResponseDto.success(result, '시스템 통계가 조회되었습니다.');
    }
}
