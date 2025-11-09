import { Controller, Get, Put, Patch, Post, Body, Param, UseGuards } from '@nestjs/common';

import { Roles } from '../../../common/decorator/roles.decorator';
import { CurrentUser } from '../../../common/decorator/user.decorator';
import { ApiController, ApiEndpoint } from '../../../common/decorator/swagger.decorator';
import { RolesGuard } from '../../../common/guard/roles.guard';
import { JwtAuthGuard } from '../../../common/guard/jwt-auth.guard';

import { StandardQuestionAdminService } from './standard-question-admin.service';

import { ApiResponseDto } from '../../../common/dto/response/api-response.dto';

/**
 * 표준 질문 Admin 컨트롤러
 *
 * 표준 입양 신청 질문 관리 관리자 기능을 제공합니다:
 * - 표준 질문 조회 (비활성화 포함)
 * - 표준 질문 수정
 * - 표준 질문 활성화/비활성화
 * - 표준 질문 순서 변경
 * - 표준 질문 재시딩
 */
@ApiController('표준 질문 관리자')
@Controller('standard-question-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class StandardQuestionAdminController {
    constructor(private readonly standardQuestionAdminService: StandardQuestionAdminService) {}

    @Get()
    @ApiEndpoint({
        summary: '표준 질문 목록 조회 (관리자용)',
        description: '모든 표준 질문 목록을 조회합니다 (비활성화 포함).',
        responseType: Array,
        isPublic: false,
    })
    async getAllStandardQuestions(@CurrentUser() user: any): Promise<ApiResponseDto<any>> {
        const result = await this.standardQuestionAdminService.getAllQuestions();
        return ApiResponseDto.success(result, '표준 질문 목록이 조회되었습니다.');
    }

    @Put(':id')
    @ApiEndpoint({
        summary: '표준 질문 수정',
        description: '표준 질문의 내용을 수정합니다.',
        responseType: Object,
        isPublic: false,
    })
    async updateStandardQuestion(
        @CurrentUser() user: any,
        @Param('id') id: string,
        @Body() updateData: any,
    ): Promise<ApiResponseDto<any>> {
        const result = await this.standardQuestionAdminService.updateQuestion(id, updateData);
        return ApiResponseDto.success(result, '표준 질문이 수정되었습니다.');
    }

    @Patch(':id/status')
    @ApiEndpoint({
        summary: '표준 질문 활성화/비활성화',
        description: '표준 질문을 활성화하거나 비활성화합니다.',
        responseType: Object,
        isPublic: false,
    })
    async toggleStandardQuestionStatus(
        @CurrentUser() user: any,
        @Param('id') id: string,
        @Body() statusData: { isActive: boolean },
    ): Promise<ApiResponseDto<any>> {
        const result = await this.standardQuestionAdminService.toggleQuestionStatus(id, statusData.isActive);
        return ApiResponseDto.success(result, '표준 질문 상태가 변경되었습니다.');
    }

    @Post('reorder')
    @ApiEndpoint({
        summary: '표준 질문 순서 변경',
        description: '표준 질문의 순서를 변경합니다.',
        responseType: Object,
        isPublic: false,
    })
    async reorderStandardQuestions(
        @CurrentUser() user: any,
        @Body() reorderData: { reorderData: Array<{ id: string; order: number }> },
    ): Promise<ApiResponseDto<any>> {
        const result = await this.standardQuestionAdminService.reorderQuestions(reorderData.reorderData);
        return ApiResponseDto.success(result, '표준 질문 순서가 변경되었습니다.');
    }

    @Post('reseed')
    @ApiEndpoint({
        summary: '표준 질문 재시딩',
        description: '표준 질문을 초기 상태로 재시딩합니다 (주의: 기존 데이터 삭제).',
        responseType: Object,
        isPublic: false,
    })
    async reseedStandardQuestions(@CurrentUser() user: any): Promise<ApiResponseDto<any>> {
        const result = await this.standardQuestionAdminService.reseedQuestions();
        return ApiResponseDto.success(result, '표준 질문이 재시딩되었습니다.');
    }
}
