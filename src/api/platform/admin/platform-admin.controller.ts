import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { Roles } from '../../../common/decorator/roles.decorator';
import { CurrentUser } from '../../../common/decorator/user.decorator';
import { ApiController, ApiEndpoint } from '../../../common/decorator/swagger.decorator';
import { RolesGuard } from '../../../common/guard/roles.guard';
import { JwtAuthGuard } from '../../../common/guard/jwt-auth.guard';

import { PlatformAdminService } from './platform-admin.service';

import { StatsFilterRequestDto } from './dto/request/stats-filter-request.dto';
import { AdminStatsResponseDto } from './dto/response/admin-stats-response.dto';
import { ApiResponseDto } from '../../../common/dto/response/api-response.dto';

/**
 * 플랫폼 Admin 컨트롤러
 *
 * 플랫폼 전체 통계 관련 관리자 기능을 제공합니다:
 * - 플랫폼 통계 조회
 */
@ApiController('플랫폼 관리자')
@Controller('platform-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class PlatformAdminController {
    constructor(private readonly platformAdminService: PlatformAdminService) {}

    @Get('stats')
    @ApiEndpoint({
        summary: '플랫폼 통계 조회',
        description: '플랫폼 전체 통계 정보를 조회합니다.',
        responseType: AdminStatsResponseDto,
        isPublic: false,
    })
    async getStats(
        @CurrentUser() user: any,
        @Query() filter: StatsFilterRequestDto,
    ): Promise<ApiResponseDto<AdminStatsResponseDto>> {
        const result = await this.platformAdminService.getStats(user.userId, filter);
        return ApiResponseDto.success(result, '시스템 통계가 조회되었습니다.');
    }
}
