import { Controller, Get, Delete, Param, Query, UseGuards } from '@nestjs/common';

import { Roles } from '../../../common/decorator/roles.decorator';
import { CurrentUser } from '../../../common/decorator/user.decorator';
import { ApiController, ApiEndpoint } from '../../../common/decorator/swagger.decorator';
import { RolesGuard } from '../../../common/guard/roles.guard';
import { JwtAuthGuard } from '../../../common/guard/jwt-auth.guard';

import { AdopterAdminService } from './adopter-admin.service';

import { ApiResponseDto } from '../../../common/dto/response/api-response.dto';
import { PaginationResponseDto } from '../../../common/dto/pagination/pagination-response.dto';
import { ReviewReportItemDto } from './dto/response/review-report-list.dto';
import { ReviewDeleteResponseDto } from './dto/response/review-delete-response.dto';

/**
 * 입양자 관리 Admin 컨트롤러
 *
 * 입양자 도메인에 대한 관리자 전용 API를 제공합니다.
 * 모든 엔드포인트는 admin 권한이 필요합니다.
 *
 * 주요 기능:
 * - 후기 신고 관리
 * - 부적절한 후기 삭제
 */
@ApiController('입양자 관리 (Admin)')
@Controller('adopter-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdopterAdminController {
    constructor(private readonly adopterAdminService: AdopterAdminService) {}

    @Get('reviews/reports')
    @ApiEndpoint({
        summary: '후기 신고 목록 조회',
        description: '신고된 후기 목록을 조회합니다. 입양자가 신고한 부적절한 후기들을 관리자가 검토할 수 있습니다.',
        responseType: PaginationResponseDto,
        isPublic: false,
    })
    async getReviewReports(
        @CurrentUser() user: any,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
    ): Promise<ApiResponseDto<PaginationResponseDto<ReviewReportItemDto>>> {
        const result = await this.adopterAdminService.getReviewReports(user.userId, parseInt(page), parseInt(limit));
        return ApiResponseDto.success(result, '후기 신고 목록이 조회되었습니다.');
    }

    @Delete('reviews/:breederId/:reviewId')
    @ApiEndpoint({
        summary: '부적절한 후기 삭제',
        description: '신고된 부적절한 후기를 삭제합니다.',
        responseType: ReviewDeleteResponseDto,
        isPublic: false,
    })
    async deleteReview(
        @CurrentUser() user: any,
        @Param('breederId') breederId: string,
        @Param('reviewId') reviewId: string,
    ): Promise<ApiResponseDto<ReviewDeleteResponseDto>> {
        const result = await this.adopterAdminService.deleteReview(user.userId, breederId, reviewId);
        return ApiResponseDto.success(result, '부적절한 후기가 삭제되었습니다.');
    }
}
