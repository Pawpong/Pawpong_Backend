import { Controller, Get, Patch, Post, Body, Param, UseGuards } from '@nestjs/common';

import { Roles } from '../../../common/decorator/roles.decorator';
import { CurrentUser } from '../../../common/decorator/user.decorator';
import { ApiController, ApiEndpoint } from '../../../common/decorator/swagger.decorator';
import { RolesGuard } from '../../../common/guard/roles.guard';
import { JwtAuthGuard } from '../../../common/guard/jwt-auth.guard';

import { StandardQuestionAdminService } from './standard-question-admin.service';

import { ApiResponseDto } from '../../../common/dto/response/api-response.dto';
import { StandardQuestionResponseDto } from './dto/response/standard-question-response.dto';
import { UpdateStandardQuestionDto } from './dto/request/update-standard-question.dto';
import { ToggleStandardQuestionStatusDto } from './dto/request/toggle-standard-question-status.dto';
import { ReorderStandardQuestionsDto } from './dto/request/reorder-standard-questions.dto';
import { STANDARD_QUESTION_ADMIN_REQUEST_EXAMPLES, StandardQuestionAdminSwaggerDocs } from './swagger';

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
@ApiController('입양 신청 질문 (Admin)')
@Controller('standard-question-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class StandardQuestionAdminController {
    constructor(private readonly standardQuestionAdminService: StandardQuestionAdminService) {}

    @Get()
    @ApiEndpoint({
        ...StandardQuestionAdminSwaggerDocs.getAllStandardQuestions,
        responseType: [StandardQuestionResponseDto],
    })
    async getAllStandardQuestions(@CurrentUser() user: any): Promise<ApiResponseDto<StandardQuestionResponseDto[]>> {
        const questions = await this.standardQuestionAdminService.getAllQuestions();
        const result = questions.map((q) => new StandardQuestionResponseDto(q));
        return ApiResponseDto.success(result, '표준 질문 목록이 조회되었습니다.');
    }

    @Patch(':id')
    @ApiEndpoint({
        ...StandardQuestionAdminSwaggerDocs.updateStandardQuestion,
        responseType: StandardQuestionResponseDto,
    })
    async updateStandardQuestion(
        @CurrentUser() user: any,
        @Param('id') id: string,
        @Body() updateData: UpdateStandardQuestionDto,
    ): Promise<ApiResponseDto<StandardQuestionResponseDto>> {
        const question = await this.standardQuestionAdminService.updateQuestion(id, updateData);
        const result = new StandardQuestionResponseDto(question);
        return ApiResponseDto.success(result, '표준 질문이 수정되었습니다.');
    }

    @Patch(':id/status')
    @ApiEndpoint({
        ...StandardQuestionAdminSwaggerDocs.toggleStandardQuestionStatus,
        responseType: StandardQuestionResponseDto,
    })
    async toggleStandardQuestionStatus(
        @CurrentUser() user: any,
        @Param('id') id: string,
        @Body() statusData: ToggleStandardQuestionStatusDto,
    ): Promise<ApiResponseDto<StandardQuestionResponseDto>> {
        const question = await this.standardQuestionAdminService.toggleQuestionStatus(id, statusData.isActive);
        const result = new StandardQuestionResponseDto(question);
        return ApiResponseDto.success(result, '표준 질문 상태가 변경되었습니다.');
    }

    @Post('reorder')
    @ApiEndpoint({
        ...StandardQuestionAdminSwaggerDocs.reorderStandardQuestions,
        responseType: Boolean,
    })
    async reorderStandardQuestions(
        @CurrentUser() user: any,
        @Body() reorderData: ReorderStandardQuestionsDto,
    ): Promise<ApiResponseDto<boolean>> {
        await this.standardQuestionAdminService.reorderQuestions(reorderData.reorderData);
        return ApiResponseDto.success(true, '표준 질문 순서가 변경되었습니다.');
    }

    @Post('reseed')
    @ApiEndpoint({
        ...StandardQuestionAdminSwaggerDocs.reseedStandardQuestions,
        responseType: Boolean,
    })
    async reseedStandardQuestions(@CurrentUser() user: any): Promise<ApiResponseDto<boolean>> {
        await this.standardQuestionAdminService.reseedQuestions();
        return ApiResponseDto.success(true, '표준 질문이 재시딩되었습니다.');
    }
}
