import {
    Controller,
    Post,
    Get,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Patch,
    HttpStatus,
    BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { Roles } from '../../common/decorator/roles.decorator';
import { CurrentUser } from '../../common/decorator/user.decorator';
import { RolesGuard } from '../../common/guard/roles.guard';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';

import { BreederManagementService } from './breeder-management.service';

// Request DTOs
import { ProfileUpdateRequestDto } from './dto/request/profileu-update-request.dto';
import { VerificationSubmitRequestDto } from './dto/request/verification-submit-request.dto';
import { ParentPetAddDto } from './dto/request/parent-pet-add-request.dto';
import { AvailablePetAddDto } from './dto/request/available-pet-add-request.dto';
import { ApplicationStatusUpdateRequestDto } from './dto/request/applicationStatusUpdate-request.dto';
import { PetStatusUpdateRequestDto } from './dto/request/pet-status-update-request.dto';
import { ApplicationsGetRequestDto } from './dto/request/applications-fetch-request.dto';

// Response DTOs
import { BreederDashboardResponseDto } from '../breeder/dto/response/breeder-dashboard-response.dto';
import { BreederProfileResponseDto } from '../breeder/dto/response/breeder-profileresponse.dto';
import { ProfileUpdateResponseDto } from './dto/response/profile-update-response.dto';
import { PetAddResponseDto } from './dto/response/pet-add-response.dto';
import { PetUpdateResponseDto } from './dto/response/pet-update-response.dto';
import { PetRemoveResponseDto } from './dto/response/pet-remove-response.dto';
import { ReceivedApplicationListResponseDto } from '../breeder/dto/response/received-applicationList-response.dto';

@ApiTags('브리더 관리')
@ApiBearerAuth('JWT-Auth')
@Controller('breeder-management') // 글로벌 프리픽스로 /api가 추가되므로 제거
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('breeder')
export class BreederManagementController {
    constructor(private readonly breederManagementService: BreederManagementService) {}

    /**
     * 브리더 대시보드 조회
     * 브리더의 통계 정보와 최근 활동을 확인합니다.
     */
    @Get('dashboard')
    @ApiOperation({ summary: '브리더 대시보드 조회', description: '브리더의 통계 정보와 최근 활동을 확인합니다.' })
    @ApiResponse({ status: 200, description: '대시보드 조회 성공', type: BreederDashboardResponseDto })
    @ApiResponse({ status: 400, description: '잘못된 요청' })
    async getDashboard(@CurrentUser() user: any): Promise<BreederDashboardResponseDto> {
        if (!user?.userId) {
            throw new BadRequestException('사용자 정보가 올바르지 않습니다.');
        }
        return this.breederManagementService.getDashboard(user.userId);
    }

    /**
     * 브리더 프로필 조회
     * 로그인한 브리더의 프로필 정보를 조회합니다.
     */
    @Get('profile')
    @ApiOperation({ summary: '브리더 프로필 조회', description: '로그인한 브리더의 프로필 정보를 조회합니다.' })
    @ApiResponse({ status: 200, description: '프로필 조회 성공', type: BreederProfileResponseDto })
    @ApiResponse({ status: 400, description: '잘못된 요청' })
    async getProfile(@CurrentUser() user: any): Promise<BreederProfileResponseDto> {
        if (!user?.userId) {
            throw new BadRequestException('사용자 정보가 올바르지 않습니다.');
        }
        return this.breederManagementService.getBreederProfile(user.userId);
    }

    /**
     * 브리더 프로필 수정
     * 브리더의 프로필 정보를 업데이트합니다.
     */
    @Patch('profile')
    @ApiOperation({ summary: '브리더 프로필 수정', description: '브리더의 프로필 정보를 업데이트합니다.' })
    @ApiResponse({ status: 200, description: '프로필 수정 성공', type: ProfileUpdateResponseDto })
    @ApiResponse({ status: 400, description: '잘못된 요청' })
    async updateProfile(
        @CurrentUser() user: any,
        @Body() updateData: ProfileUpdateRequestDto,
    ): Promise<ProfileUpdateResponseDto> {
        if (!user?.userId) {
            throw new BadRequestException('사용자 정보가 올바르지 않습니다.');
        }
        return this.breederManagementService.updateProfile(user.userId, updateData);
    }

    /**
     * 브리더 인증 신청
     * 브리더 인증을 위한 서류를 제출합니다.
     */
    @Post('verification')
    @ApiOperation({ summary: '브리더 인증 신청', description: '브리더 인증을 위한 서류를 제출합니다.' })
    @ApiResponse({ status: 200, description: '인증 신청 성공' })
    @ApiResponse({ status: 400, description: '잘못된 요청' })
    async submitVerification(@CurrentUser() user: any, @Body() verificationData: VerificationSubmitRequestDto) {
        if (!user?.userId) {
            throw new BadRequestException('사용자 정보가 올바르지 않습니다.');
        }
        return this.breederManagementService.submitVerification(user.userId, verificationData);
    }

    /**
     * 부모견/부모묘 추가
     * 새로운 부모 반려동물을 등록합니다.
     */
    @Post('parent-pets')
    @ApiOperation({ summary: '부모견/부모묘 추가', description: '새로운 부모 반려동물을 등록합니다.' })
    @ApiResponse({ status: 200, description: '부모 반려동물 등록 성공', type: PetAddResponseDto })
    @ApiResponse({ status: 400, description: '잘못된 요청' })
    async addParentPet(@CurrentUser() user: any, @Body() parentPetDto: ParentPetAddDto): Promise<PetAddResponseDto> {
        if (!user?.userId) {
            throw new BadRequestException('사용자 정보가 올바르지 않습니다.');
        }
        return this.breederManagementService.addParentPet(user.userId, parentPetDto);
    }

    /**
     * 부모견/부모묘 정보 수정
     * 등록된 부모 반려동물의 정보를 수정합니다.
     */
    @Put('parent-pets/:petId')
    @ApiOperation({ summary: '부모견/부모묘 정보 수정', description: '등록된 부모 반려동물의 정보를 수정합니다.' })
    @ApiResponse({ status: 200, description: '부모 반려동물 수정 성공', type: PetUpdateResponseDto })
    @ApiResponse({ status: 400, description: '잘못된 요청' })
    async updateParentPet(
        @CurrentUser() user: any,
        @Param('petId') petId: string,
        @Body() updateData: Partial<ParentPetAddDto>,
    ): Promise<PetUpdateResponseDto> {
        if (!user?.userId) {
            throw new BadRequestException('사용자 정보가 올바르지 않습니다.');
        }
        if (!petId) {
            throw new BadRequestException('반려동물 ID가 필요합니다.');
        }
        return this.breederManagementService.updateParentPet(user.userId, petId, updateData);
    }

    /**
     * 부모견/부모묘 삭제
     * 등록된 부모 반려동물을 삭제합니다.
     */
    @Delete('parent-pets/:petId')
    @ApiOperation({ summary: '부모견/부모묘 삭제', description: '등록된 부모 반려동물을 삭제합니다.' })
    @ApiResponse({ status: 200, description: '부모 반려동물 삭제 성공', type: PetRemoveResponseDto })
    @ApiResponse({ status: 400, description: '잘못된 요청' })
    async removeParentPet(@CurrentUser() user: any, @Param('petId') petId: string): Promise<PetRemoveResponseDto> {
        if (!user?.userId) {
            throw new BadRequestException('사용자 정보가 올바르지 않습니다.');
        }
        if (!petId) {
            throw new BadRequestException('반려동물 ID가 필요합니다.');
        }
        return this.breederManagementService.removeParentPet(user.userId, petId);
    }

    /**
     * 분양 가능한 반려동물 추가
     * 새로운 분양 가능한 반려동물을 등록합니다.
     */
    @Post('available-pets')
    @ApiOperation({ summary: '분양 가능한 반려동물 추가', description: '새로운 분양 가능한 반려동물을 등록합니다.' })
    @ApiResponse({ status: 200, description: '분양 반려동물 등록 성공', type: PetAddResponseDto })
    @ApiResponse({ status: 400, description: '잘못된 요청' })
    async addAvailablePet(
        @CurrentUser() user: any,
        @Body() availablePetDto: AvailablePetAddDto,
    ): Promise<PetAddResponseDto> {
        if (!user?.userId) {
            throw new BadRequestException('사용자 정보가 올바르지 않습니다.');
        }
        return this.breederManagementService.addAvailablePet(user.userId, availablePetDto);
    }

    /**
     * 분양 가능한 반려동물 정보 수정
     * 등록된 분양 반려동물의 정보를 수정합니다.
     */
    @Put('available-pets/:petId')
    @ApiOperation({
        summary: '분양 가능한 반려동물 정보 수정',
        description: '등록된 분양 반려동물의 정보를 수정합니다.',
    })
    @ApiResponse({ status: 200, description: '분양 반려동물 수정 성공', type: PetUpdateResponseDto })
    @ApiResponse({ status: 400, description: '잘못된 요청' })
    async updateAvailablePet(
        @CurrentUser() user: any,
        @Param('petId') petId: string,
        @Body() updateData: Partial<AvailablePetAddDto>,
    ): Promise<PetUpdateResponseDto> {
        if (!user?.userId) {
            throw new BadRequestException('사용자 정보가 올바르지 않습니다.');
        }
        if (!petId) {
            throw new BadRequestException('반려동물 ID가 필요합니다.');
        }
        return this.breederManagementService.updateAvailablePet(user.userId, petId, updateData);
    }

    /**
     * 반려동물 상태 변경
     * 분양 반려동물의 상태를 변경합니다.
     */
    @Patch('available-pets/:petId/status')
    @ApiOperation({ summary: '반려동물 상태 변경', description: '분양 반려동물의 상태를 변경합니다.' })
    @ApiResponse({ status: 200, description: '반려동물 상태 변경 성공' })
    @ApiResponse({ status: 400, description: '잘못된 요청' })
    async updatePetStatus(
        @CurrentUser() user: any,
        @Param('petId') petId: string,
        @Body() statusData: PetStatusUpdateRequestDto,
    ) {
        if (!user?.userId) {
            throw new BadRequestException('사용자 정보가 올바르지 않습니다.');
        }
        if (!petId) {
            throw new BadRequestException('반려동물 ID가 필요합니다.');
        }
        return this.breederManagementService.updatePetStatus(user.userId, petId, statusData.petStatus);
    }

    /**
     * 분양 가능한 반려동물 삭제
     * 등록된 분양 반려동물을 삭제합니다.
     */
    @Delete('available-pets/:petId')
    @ApiOperation({ summary: '분양 가능한 반려동물 삭제', description: '등록된 분양 반려동물을 삭제합니다.' })
    @ApiResponse({ status: 200, description: '분양 반려동물 삭제 성공', type: PetRemoveResponseDto })
    @ApiResponse({ status: 400, description: '잘못된 요청' })
    async removeAvailablePet(@CurrentUser() user: any, @Param('petId') petId: string): Promise<PetRemoveResponseDto> {
        if (!user?.userId) {
            throw new BadRequestException('사용자 정보가 올바르지 않습니다.');
        }
        if (!petId) {
            throw new BadRequestException('반려동물 ID가 필요합니다.');
        }
        return this.breederManagementService.removeAvailablePet(user.userId, petId);
    }

    /**
     * 받은 입양 신청 목록 조회
     * 브리더가 받은 입양 신청들을 페이지네이션으로 조회합니다.
     */
    @Get('applications')
    @ApiOperation({
        summary: '받은 입양 신청 목록 조회',
        description: '브리더가 받은 입양 신청들을 페이지네이션으로 조회합니다.',
    })
    @ApiResponse({ status: 200, description: '입양 신청 목록 조회 성공', type: ReceivedApplicationListResponseDto })
    @ApiResponse({ status: 400, description: '잘못된 요청' })
    async getReceivedApplications(@CurrentUser() user: any, @Query() queryParams: ApplicationsGetRequestDto) {
        if (!user?.userId) {
            throw new BadRequestException('사용자 정보가 올바르지 않습니다.');
        }
        return this.breederManagementService.getReceivedApplications(
            user.userId,
            queryParams.page || 1,
            queryParams.take || 10,
        );
    }

    /**
     * 입양 신청 상태 업데이트
     * 받은 입양 신청의 상태를 변경합니다.
     */
    @Patch('applications/:applicationId')
    @ApiOperation({ summary: '입양 신청 상태 업데이트', description: '받은 입양 신청의 상태를 변경합니다.' })
    @ApiResponse({ status: 200, description: '입양 신청 상태 변경 성공' })
    @ApiResponse({ status: 400, description: '잘못된 요청' })
    async updateApplicationStatus(
        @CurrentUser() user: any,
        @Param('applicationId') applicationId: string,
        @Body() updateData: ApplicationStatusUpdateRequestDto,
    ) {
        if (!user?.userId) {
            throw new BadRequestException('사용자 정보가 올바르지 않습니다.');
        }
        if (!applicationId) {
            throw new BadRequestException('신청 ID가 필요합니다.');
        }
        return this.breederManagementService.updateApplicationStatus(user.userId, applicationId, updateData);
    }
}
