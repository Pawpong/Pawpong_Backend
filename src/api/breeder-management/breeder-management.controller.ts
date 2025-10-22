import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards, Patch } from '@nestjs/common';

import { Roles } from '../../common/decorator/roles.decorator';
import { ApiController, ApiEndpoint, ApiPaginatedEndpoint } from '../../common/decorator/swagger.decorator';
import { CurrentUser } from '../../common/decorator/user.decorator';
import { RolesGuard } from '../../common/guard/roles.guard';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { PaginationResponseDto } from '../../common/dto/pagination/pagination-response.dto';

import { BreederManagementService } from './breeder-management.service';

import { ProfileUpdateRequestDto } from './dto/request/profileu-update-request.dto';
import { VerificationSubmitRequestDto } from './dto/request/verification-submit-request.dto';
import { ParentPetAddDto } from './dto/request/parent-pet-add-request.dto';
import { AvailablePetAddDto } from './dto/request/available-pet-add-request.dto';
import { PetStatusUpdateRequestDto } from './dto/request/pet-status-update-request.dto';
import { ApplicationsGetRequestDto } from './dto/request/applications-fetch-request.dto';
import { ApplicationStatusUpdateRequestDto } from './dto/request/applicationStatusUpdate-request.dto';
import { ApiResponseDto } from '../../common/dto/response/api-response.dto';
import { PetAddResponseDto } from './dto/response/pet-add-response.dto';
import { PetUpdateResponseDto } from './dto/response/pet-update-response.dto';
import { PetRemoveResponseDto } from './dto/response/pet-remove-response.dto';
import { ProfileUpdateResponseDto } from './dto/response/profile-update-response.dto';
import { BreederProfileResponseDto } from '../breeder/dto/response/breeder-profileresponse.dto';
import { BreederDashboardResponseDto } from '../breeder/dto/response/breeder-dashboard-response.dto';
import { ReceivedApplicationListResponseDto } from '../breeder/dto/response/received-application-list-response.dto';
import { VerificationSubmitResponseDto } from './dto/response/verification-submit-response.dto';
import { PetStatusUpdateResponseDto } from './dto/response/pet-status-update-response.dto';
import { ApplicationStatusUpdateResponseDto } from './dto/response/application-status-update-response.dto';
import { MyPetsListResponseDto, MyPetItemDto } from './dto/response/my-pets-list-response.dto';
import { MyReviewsListResponseDto, MyReviewItemDto } from './dto/response/my-reviews-list-response.dto';

@ApiController('브리더 관리')
@Controller('breeder-management')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('breeder')
export class BreederManagementController {
    constructor(private readonly breederManagementService: BreederManagementService) {}

    @Get('dashboard')
    @ApiEndpoint({
        summary: '브리더 대시보드 조회',
        description: '브리더의 통계 정보와 최근 활동을 확인합니다.',
        responseType: BreederDashboardResponseDto,
        isPublic: false,
    })
    async getDashboard(@CurrentUser() user: any): Promise<ApiResponseDto<BreederDashboardResponseDto>> {
        const result = await this.breederManagementService.getDashboard(user.userId);
        return ApiResponseDto.success(result, '대시보드 정보가 조회되었습니다.');
    }

    @Get('profile')
    @ApiEndpoint({
        summary: '브리더 프로필 조회',
        description: '로그인한 브리더의 프로필 정보를 조회합니다.',
        responseType: BreederProfileResponseDto,
        isPublic: false,
    })
    async getProfile(@CurrentUser() user: any): Promise<ApiResponseDto<BreederProfileResponseDto>> {
        const result = await this.breederManagementService.getBreederProfile(user.userId);
        return ApiResponseDto.success(result, '브리더 프로필이 조회되었습니다.');
    }

    @Patch('profile')
    @ApiEndpoint({
        summary: '브리더 프로필 수정',
        description: '브리더의 프로필 정보를 업데이트합니다.',
        responseType: ProfileUpdateResponseDto,
        isPublic: false,
    })
    async updateProfile(
        @CurrentUser() user: any,
        @Body() updateData: ProfileUpdateRequestDto,
    ): Promise<ApiResponseDto<ProfileUpdateResponseDto>> {
        const result = await this.breederManagementService.updateProfile(user.userId, updateData);
        return ApiResponseDto.success(result, '프로필이 성공적으로 수정되었습니다.');
    }

    @Post('verification')
    @ApiEndpoint({
        summary: '브리더 인증 신청',
        description: '브리더 인증을 위한 서류를 제출합니다.',
        responseType: VerificationSubmitResponseDto,
        isPublic: false,
    })
    async submitVerification(
        @CurrentUser() user: any,
        @Body() verificationData: VerificationSubmitRequestDto,
    ): Promise<ApiResponseDto<VerificationSubmitResponseDto>> {
        const result = await this.breederManagementService.submitVerification(user.userId, verificationData);
        return ApiResponseDto.success(result, '인증 신청이 성공적으로 제출되었습니다.');
    }

    @Post('parent-pets')
    @ApiEndpoint({
        summary: '부모견/부모묘 추가',
        description: '새로운 부모 반려동물을 등록합니다.',
        responseType: PetAddResponseDto,
        isPublic: false,
    })
    async addParentPet(
        @CurrentUser() user: any,
        @Body() parentPetDto: ParentPetAddDto,
    ): Promise<ApiResponseDto<PetAddResponseDto>> {
        const result = await this.breederManagementService.addParentPet(user.userId, parentPetDto);
        return ApiResponseDto.success(result, '부모 반려동물이 성공적으로 등록되었습니다.');
    }

    @Put('parent-pets/:petId')
    @ApiEndpoint({
        summary: '부모견/부모묘 정보 수정',
        description: '등록된 부모 반려동물의 정보를 수정합니다.',
        responseType: PetUpdateResponseDto,
        isPublic: false,
    })
    async updateParentPet(
        @CurrentUser() user: any,
        @Param('petId') petId: string,
        @Body() updateData: Partial<ParentPetAddDto>,
    ): Promise<ApiResponseDto<PetUpdateResponseDto>> {
        const result = await this.breederManagementService.updateParentPet(user.userId, petId, updateData);
        return ApiResponseDto.success(result, '부모 반려동물 정보가 성공적으로 수정되었습니다.');
    }

    @Delete('parent-pets/:petId')
    @ApiEndpoint({
        summary: '부모견/부모묘 삭제',
        description: '등록된 부모 반려동물을 삭제합니다.',
        responseType: PetRemoveResponseDto,
        isPublic: false,
    })
    async removeParentPet(
        @CurrentUser() user: any,
        @Param('petId') petId: string,
    ): Promise<ApiResponseDto<PetRemoveResponseDto>> {
        const result = await this.breederManagementService.removeParentPet(user.userId, petId);
        return ApiResponseDto.success(result, '부모 반려동물이 성공적으로 삭제되었습니다.');
    }

    @Post('available-pets')
    @ApiEndpoint({
        summary: '분양 가능한 반려동물 추가',
        description: '새로운 분양 가능한 반려동물을 등록합니다.',
        responseType: PetAddResponseDto,
        isPublic: false,
    })
    async addAvailablePet(
        @CurrentUser() user: any,
        @Body() availablePetDto: AvailablePetAddDto,
    ): Promise<ApiResponseDto<PetAddResponseDto>> {
        const result = await this.breederManagementService.addAvailablePet(user.userId, availablePetDto);
        return ApiResponseDto.success(result, '분양 반려동물이 성공적으로 등록되었습니다.');
    }

    @Put('available-pets/:petId')
    @ApiEndpoint({
        summary: '분양 가능한 반려동물 정보 수정',
        description: '등록된 분양 반려동물의 정보를 수정합니다.',
        responseType: PetUpdateResponseDto,
        isPublic: false,
    })
    async updateAvailablePet(
        @CurrentUser() user: any,
        @Param('petId') petId: string,
        @Body() updateData: Partial<AvailablePetAddDto>,
    ): Promise<ApiResponseDto<PetUpdateResponseDto>> {
        const result = await this.breederManagementService.updateAvailablePet(user.userId, petId, updateData);
        return ApiResponseDto.success(result, '분양 반려동물 정보가 성공적으로 수정되었습니다.');
    }

    @Patch('available-pets/:petId/status')
    @ApiEndpoint({
        summary: '반려동물 상태 변경',
        description: '분양 반려동물의 상태를 변경합니다.',
        responseType: PetStatusUpdateResponseDto,
        isPublic: false,
    })
    async updatePetStatus(
        @CurrentUser() user: any,
        @Param('petId') petId: string,
        @Body() statusData: PetStatusUpdateRequestDto,
    ): Promise<ApiResponseDto<PetStatusUpdateResponseDto>> {
        const result = await this.breederManagementService.updatePetStatus(user.userId, petId, statusData.petStatus);
        return ApiResponseDto.success(result, '반려동물 상태가 성공적으로 변경되었습니다.');
    }

    @Delete('available-pets/:petId')
    @ApiEndpoint({
        summary: '분양 가능한 반려동물 삭제',
        description: '등록된 분양 반려동물을 삭제합니다.',
        responseType: PetRemoveResponseDto,
        isPublic: false,
    })
    async removeAvailablePet(
        @CurrentUser() user: any,
        @Param('petId') petId: string,
    ): Promise<ApiResponseDto<PetRemoveResponseDto>> {
        const result = await this.breederManagementService.removeAvailablePet(user.userId, petId);
        return ApiResponseDto.success(result, '분양 반려동물이 성공적으로 삭제되었습니다.');
    }

    @Get('applications')
    @ApiEndpoint({
        summary: '받은 입양 신청 목록 조회',
        description: '브리더가 받은 입양 신청들을 페이지네이션으로 조회합니다.',
        responseType: ReceivedApplicationListResponseDto,
        isPublic: false,
    })
    async getReceivedApplications(
        @CurrentUser() user: any,
        @Query() queryParams: ApplicationsGetRequestDto,
    ): Promise<ApiResponseDto<ReceivedApplicationListResponseDto>> {
        const result = await this.breederManagementService.getReceivedApplications(
            user.userId,
            queryParams.page || 1,
            queryParams.take || 10,
        );
        return ApiResponseDto.success(result, '입양 신청 목록이 조회되었습니다.');
    }

    @Patch('applications/:applicationId')
    @ApiEndpoint({
        summary: '입양 신청 상태 업데이트',
        description: '받은 입양 신청의 상태를 변경합니다.',
        responseType: ApplicationStatusUpdateResponseDto,
        isPublic: false,
    })
    async updateApplicationStatus(
        @CurrentUser() user: any,
        @Param('applicationId') applicationId: string,
        @Body() updateData: ApplicationStatusUpdateRequestDto,
    ): Promise<ApiResponseDto<ApplicationStatusUpdateResponseDto>> {
        const result = await this.breederManagementService.updateApplicationStatus(
            user.userId,
            applicationId,
            updateData,
        );
        return ApiResponseDto.success(result, '입양 신청 상태가 성공적으로 변경되었습니다.');
    }

    @Get('my-pets')
    @ApiPaginatedEndpoint({
        summary: '내 개체 목록 조회',
        description: '브리더 자신의 모든 개체 목록을 관리 목적으로 조회합니다. 비활성화된 개체, 상태별 필터링, 입양 신청 수 등 상세 정보가 포함됩니다.',
        responseType: MyPetsListResponseDto,
        isPublic: false,
    })
    async getMyPets(
        @CurrentUser() user: any,
        @Query('status') status?: string,
        @Query('includeInactive') includeInactive?: string,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
    ): Promise<ApiResponseDto<PaginationResponseDto<MyPetItemDto>>> {
        const result = await this.breederManagementService.getMyPets(
            user.userId,
            status,
            includeInactive === 'true',
            Number(page),
            Number(limit),
        );
        return ApiResponseDto.success(result, '개체 목록이 조회되었습니다.');
    }

    @Get('my-reviews')
    @ApiPaginatedEndpoint({
        summary: '내게 달린 후기 목록 조회',
        description: '브리더 자신에게 작성된 모든 후기를 관리 목적으로 조회합니다. 공개/비공개 후기 모두 확인 가능하며, 신고된 후기 정보도 포함됩니다.',
        responseType: MyReviewsListResponseDto,
        isPublic: false,
    })
    async getMyReviews(
        @CurrentUser() user: any,
        @Query('visibility') visibility?: string,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
    ): Promise<ApiResponseDto<PaginationResponseDto<MyReviewItemDto>>> {
        const result = await this.breederManagementService.getMyReviews(
            user.userId,
            visibility || 'all',
            Number(page),
            Number(limit),
        );
        return ApiResponseDto.success(result, '후기 목록이 조회되었습니다.');
    }
}
