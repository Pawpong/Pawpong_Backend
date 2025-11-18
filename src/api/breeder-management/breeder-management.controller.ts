import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';

import { Roles } from '../../common/decorator/roles.decorator';
import { CurrentUser } from '../../common/decorator/user.decorator';
import { ApiController, ApiEndpoint, ApiPaginatedEndpoint } from '../../common/decorator/swagger.decorator';
import { RolesGuard } from '../../common/guard/roles.guard';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';

import { BreederManagementService } from './breeder-management.service';

import { ParentPetAddDto } from './dto/request/parent-pet-add-request.dto';
import { ParentPetUpdateDto } from './dto/request/parent-pet-update-request.dto';
import { AvailablePetAddDto } from './dto/request/available-pet-add-request.dto';
import { ProfileUpdateRequestDto } from './dto/request/profile-update-request.dto';
import { PetStatusUpdateRequestDto } from './dto/request/pet-status-update-request.dto';
import { ApplicationsGetRequestDto } from './dto/request/applications-fetch-request.dto';
import { VerificationSubmitRequestDto } from './dto/request/verification-submit-request.dto';
import { ApplicationFormUpdateRequestDto } from './dto/request/application-form-update-request.dto';
import { ApplicationStatusUpdateRequestDto } from './dto/request/application-status-update-request.dto';
import { ApiResponseDto } from '../../common/dto/response/api-response.dto';
import { PaginationResponseDto } from '../../common/dto/pagination/pagination-response.dto';
import { PetAddResponseDto } from './dto/response/pet-add-response.dto';
import { PetUpdateResponseDto } from './dto/response/pet-update-response.dto';
import { PetRemoveResponseDto } from './dto/response/pet-remove-response.dto';
import { BreederProfileResponseDto } from '../breeder/dto/response/breeder-profile-response.dto';
import { PetStatusUpdateResponseDto } from './dto/response/pet-status-update-response.dto';
import { ApplicationFormResponseDto } from './dto/response/application-form-response.dto';
import { BreederDashboardResponseDto } from '../breeder/dto/response/breeder-dashboard-response.dto';
import { VerificationSubmitResponseDto } from './dto/response/verification-submit-response.dto';
import { VerificationStatusResponseDto } from './dto/response/verification-status-response.dto';
import { ReceivedApplicationResponseDto } from '../breeder/dto/response/received-application-response.dto';
import { BreederProfileUpdateResponseDto } from './dto/response/profile-update-response.dto';
import { ApplicationFormUpdateResponseDto } from './dto/response/application-form-update-response.dto';
import { ReceivedApplicationListResponseDto } from '../breeder/dto/response/received-application-list-response.dto';
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
        responseType: BreederProfileUpdateResponseDto,
        isPublic: false,
    })
    async updateProfile(
        @CurrentUser() user: any,
        @Body() updateData: ProfileUpdateRequestDto,
    ): Promise<ApiResponseDto<BreederProfileUpdateResponseDto>> {
        const result = await this.breederManagementService.updateProfile(user.userId, updateData);
        return ApiResponseDto.success(result, '프로필이 성공적으로 수정되었습니다.');
    }

    @Get('verification')
    @ApiEndpoint({
        summary: '브리더 인증 상태 조회',
        description:
            '로그인한 브리더의 인증 상태 및 관련 정보를 조회합니다. 인증 문서 URL은 1시간 유효한 Signed URL로 제공됩니다.',
        responseType: VerificationStatusResponseDto,
        isPublic: false,
    })
    async getVerificationStatus(@CurrentUser() user: any): Promise<ApiResponseDto<VerificationStatusResponseDto>> {
        const result = await this.breederManagementService.getVerificationStatus(user.userId);
        return ApiResponseDto.success(result, '인증 상태가 조회되었습니다.');
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

    @Patch('parent-pets/:petId')
    @ApiEndpoint({
        summary: '부모견/부모묘 정보 수정',
        description: '등록된 부모 반려동물의 정보를 수정합니다.',
        responseType: PetUpdateResponseDto,
        isPublic: false,
    })
    async updateParentPet(
        @CurrentUser() user: any,
        @Param('petId') petId: string,
        @Body() updateData: ParentPetUpdateDto,
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

    @Patch('available-pets/:petId')
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

    @Get('applications/:applicationId')
    @ApiEndpoint({
        summary: '받은 입양 신청 상세 조회',
        description: `브리더가 받은 특정 입양 신청의 상세 정보를 조회합니다.

**응답 데이터:**
- 신청 ID, 입양자 정보 (이름, 이메일, 연락처)
- 반려동물 정보 (있는 경우)
- 신청서 전체 내용 (8가지 필수 정보 포함)
- 신청 상태, 신청 일시, 처리 일시
- 브리더 메모

**권한:**
- 본인이 받은 신청만 조회 가능`,
        responseType: ReceivedApplicationResponseDto,
        isPublic: false,
    })
    async getApplicationDetail(
        @CurrentUser() user: any,
        @Param('applicationId') applicationId: string,
    ): Promise<ApiResponseDto<ReceivedApplicationResponseDto>> {
        const result = await this.breederManagementService.getApplicationDetail(user.userId, applicationId);
        return ApiResponseDto.success(result, '입양 신청 상세 정보가 조회되었습니다.');
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
        description:
            '브리더 자신의 모든 개체 목록을 관리 목적으로 조회합니다. 비활성화된 개체, 상태별 필터링, 입양 신청 수 등 상세 정보가 포함됩니다.',
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
        description:
            '브리더 자신에게 작성된 모든 후기를 관리 목적으로 조회합니다. 공개/비공개 후기 모두 확인 가능하며, 신고된 후기 정보도 포함됩니다.',
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

    @Get('application-form')
    @ApiEndpoint({
        summary: '입양 신청 폼 조회',
        description: `브리더가 설정한 입양 신청 폼 전체 구조를 조회합니다.

**응답 데이터:**
- **표준 질문** (14개): 모든 브리더 공통, 수정 불가능
- **커스텀 질문**: 브리더가 추가한 질문들

**표준 질문 목록:**
1. 개인정보 수집 동의
2. 자기소개
3. 가족 구성원 정보
4. 가족 입양 동의
5. 알러지 검사
6. 집 비우는 시간
7. 거주 공간 소개
8. 반려동물 경험
9. 기본 케어 책임
10. 치료비 감당
11. 중성화 동의
12. 선호하는 아이
13. 입양 시기
14. 추가 문의사항

**커스텀 질문:**
- 브리더가 자유롭게 추가/삭제 가능`,
        responseType: ApplicationFormResponseDto,
        isPublic: false,
    })
    async getApplicationForm(@CurrentUser() user: any): Promise<ApiResponseDto<ApplicationFormResponseDto>> {
        const result = await this.breederManagementService.getApplicationForm(user.userId);
        return ApiResponseDto.success(result, '입양 신청 폼이 조회되었습니다.');
    }

    @Patch('application-form')
    @ApiEndpoint({
        summary: '입양 신청 폼 수정',
        description: `브리더가 커스텀 질문을 추가/수정/삭제합니다.

**중요 사항:**
- 표준 14개 질문은 자동으로 포함되며 수정 불가능
- 이 API는 커스텀 질문만 관리합니다
- 전체 커스텀 질문 배열을 전송 (부분 수정 불가)

**Validation 규칙:**
- 질문 ID는 영문, 숫자, 언더스코어만 사용
- 질문 ID는 중복 불가
- 표준 질문 ID와 중복 불가
- select/radio/checkbox 타입은 options 필수

**예시:**
\`\`\`json
{
  "customQuestions": [
    {
      "id": "custom_visit_time",
      "type": "select",
      "label": "방문 가능한 시간대를 선택해주세요",
      "required": true,
      "options": ["오전", "오후", "저녁"],
      "order": 1
    },
    {
      "id": "custom_pet_preference",
      "type": "textarea",
      "label": "선호하는 반려동물의 성격을 알려주세요",
      "required": false,
      "placeholder": "예: 활발하고 사람을 좋아하는 성격",
      "order": 2
    }
  ]
}
\`\`\``,
        responseType: ApplicationFormUpdateResponseDto,
        isPublic: false,
    })
    async updateApplicationForm(
        @CurrentUser() user: any,
        @Body() updateDto: ApplicationFormUpdateRequestDto,
    ): Promise<ApiResponseDto<ApplicationFormUpdateResponseDto>> {
        const result = await this.breederManagementService.updateApplicationForm(user.userId, updateDto);
        return ApiResponseDto.success(result, '입양 신청 폼이 업데이트되었습니다.');
    }
}
