import { Controller, Get, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';

import { Roles } from '../../../common/decorator/roles.decorator';
import { CurrentUser } from '../../../common/decorator/user.decorator';
import { ApiController, ApiEndpoint } from '../../../common/decorator/swagger.decorator';
import { RolesGuard } from '../../../common/guard/roles.guard';
import { JwtAuthGuard } from '../../../common/guard/jwt-auth.guard';

import { BreederAdminService } from './breeder-admin.service';

import { ReportActionRequestDto } from './dto/request/report-action-request.dto';
import { BreederSearchRequestDto } from './dto/request/breeder-search-request.dto';
import { BreederVerificationRequestDto } from './dto/request/breeder-verification-request.dto';
import { ApplicationMonitoringRequestDto } from './dto/request/application-monitoring-request.dto';
import { ApiResponseDto } from '../../../common/dto/response/api-response.dto';
import { PaginationResponseDto } from '../../../common/dto/pagination/pagination-response.dto';
import { BreederReportItemDto } from './dto/response/breeder-report-list.dto';
import { ReportActionResponseDto } from './dto/response/report-action-response.dto';
import { BreederVerificationResponseDto } from './dto/response/breeder-verification-response.dto';
import { ApplicationMonitoringResponseDto } from './dto/response/application-monitoring-response.dto';

/**
 * 브리더 관리 Admin 컨트롤러
 *
 * 브리더 도메인에 대한 관리자 전용 API를 제공합니다.
 * 모든 엔드포인트는 admin 권한이 필요합니다.
 *
 * 주요 기능:
 * - 브리더 인증 관리 (승인/거절)
 * - 브리더 신고 관리
 * - 입양 신청 모니터링
 */
@ApiController('브리더 관리 (Admin)')
@Controller('breeder-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class BreederAdminController {
    constructor(private readonly breederAdminService: BreederAdminService) {}

    @Get('verification/pending')
    @ApiEndpoint({
        summary: '승인 대기 브리더 목록 조회',
        description: '인증 승인을 대기중인 브리더 목록을 조회합니다.',
        responseType: BreederVerificationResponseDto,
        isPublic: false,
    })
    async getPendingBreederVerifications(
        @CurrentUser() user: any,
        @Query() filter: BreederSearchRequestDto,
    ): Promise<ApiResponseDto<BreederVerificationResponseDto[]>> {
        const result = await this.breederAdminService.getPendingBreederVerifications(user.userId, filter);
        return ApiResponseDto.success(result, '승인 대기 브리더 목록이 조회되었습니다.');
    }

    @Patch('verification/:breederId')
    @ApiEndpoint({
        summary: '브리더 인증 승인/거절',
        description: '브리더의 인증 신청을 승인하거나 거절합니다.',
        responseType: Object,
        isPublic: false,
    })
    async updateBreederVerification(
        @CurrentUser() user: any,
        @Param('breederId') breederId: string,
        @Body() verificationData: BreederVerificationRequestDto,
    ): Promise<ApiResponseDto<any>> {
        const result = await this.breederAdminService.updateBreederVerification(
            user.userId,
            breederId,
            verificationData,
        );
        return ApiResponseDto.success(result, '브리더 인증 처리가 완료되었습니다.');
    }

    @Get('applications')
    @ApiEndpoint({
        summary: '입양 신청 모니터링',
        description: '전체 입양 신청 현황을 모니터링합니다.',
        responseType: ApplicationMonitoringResponseDto,
        isPublic: false,
    })
    async getApplications(
        @CurrentUser() user: any,
        @Query() filter: ApplicationMonitoringRequestDto,
    ): Promise<ApiResponseDto<ApplicationMonitoringResponseDto>> {
        const result = await this.breederAdminService.getApplications(user.userId, filter);
        return ApiResponseDto.success(result, '입양 신청 현황이 조회되었습니다.');
    }

    @Get('reports')
    @ApiEndpoint({
        summary: '브리더 신고 목록 조회',
        description:
            '브리더에 대한 신고 목록을 조회합니다. 입양자가 제출한 브리더 신고들을 관리자가 검토할 수 있습니다.',
        responseType: PaginationResponseDto,
        isPublic: false,
    })
    async getBreederReports(
        @CurrentUser() user: any,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
    ): Promise<ApiResponseDto<PaginationResponseDto<BreederReportItemDto>>> {
        const result = await this.breederAdminService.getBreederReports(user.userId, parseInt(page), parseInt(limit));
        return ApiResponseDto.success(result, '브리더 신고 목록이 조회되었습니다.');
    }

    @Patch('reports/:breederId/:reportId')
    @ApiEndpoint({
        summary: '브리더 신고 처리',
        description: '접수된 브리더 신고를 처리합니다.',
        responseType: ReportActionResponseDto,
        isPublic: false,
    })
    async updateReportStatus(
        @CurrentUser() user: any,
        @Param('breederId') breederId: string,
        @Param('reportId') reportId: string,
        @Body() reportAction: ReportActionRequestDto,
    ): Promise<ApiResponseDto<ReportActionResponseDto>> {
        const result = await this.breederAdminService.updateReportStatus(
            user.userId,
            breederId,
            reportId,
            reportAction,
        );
        return ApiResponseDto.success(result, '신고 처리가 완료되었습니다.');
    }
}
