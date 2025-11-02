import { Controller, Post, Get, Delete, Body, Param, UseGuards, Patch, Query } from '@nestjs/common';

import { RolesGuard } from '../../common/guard/roles.guard';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { Roles } from '../../common/decorator/roles.decorator';
import { CurrentUser } from '../../common/decorator/user.decorator';
import { ApiController, ApiEndpoint, ApiPaginatedEndpoint } from '../../common/decorator/swagger.decorator';

import { AdopterService } from './adopter.service';

import { FavoriteAddRequestDto } from './dto/request/favorite-add-request.dto';
import { ReviewCreateRequestDto } from './dto/request/review-create-request.dto';
import { ReportCreateRequestDto } from './dto/request/report-create-request.dto';
import { ApplicationCreateRequestDto } from './dto/request/application-create-request.dto';
import { ApiResponseDto } from '../../common/dto/response/api-response.dto';
import { PaginationResponseDto } from '../../common/dto/pagination/pagination-response.dto';
import { FavoriteAddResponseDto } from './dto/response/favorite-add-response.dto';
import { ReportCreateResponseDto } from './dto/response/report-create-response.dto';
import { ReviewCreateResponseDto } from './dto/response/review-create-response.dto';
import { AdopterProfileUpdateResponseDto } from './dto/response/profile-update-response.dto';
import { AdopterProfileResponseDto } from './dto/response/adopter-profile-response.dto';
import { FavoriteRemoveResponseDto } from './dto/response/favorite-remove-response.dto';
import { ApplicationCreateResponseDto } from './dto/response/application-create-response.dto';
import { FavoriteListResponseDto, FavoriteBreederDataDto } from './dto/response/favorite-list-response.dto';

@ApiController('입양자')
@Controller('adopter')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('adopter')
export class AdopterController {
    constructor(private readonly adopterService: AdopterService) {}

    @Post('application')
    @ApiEndpoint({
        summary: '입양 상담 신청 제출 (Figma 디자인 기반)',
        description: `브리더에게 입양 상담 신청을 제출합니다.

Figma 상담 신청 폼 기반으로 재설계된 API입니다.

**신청 절차:**
1. 브리더 ID 필수 입력
2. 특정 개체 상담인 경우 petId 입력 (선택)
3. 개인정보 수집 동의 필수 (privacyConsent: true)
4. 8가지 필수 정보 입력:
   - 자기소개 (성별, 연령대, 거주지, 생활 패턴 등, 최대 1500자)
   - 가족 구성원 정보
   - 모든 가족의 동의 여부
   - 알러지 검사 정보
   - 평균적으로 집을 비우는 시간
   - 거주 공간 소개 (최대 1500자)
   - 반려동물 경험 (최대 1500자)

**비즈니스 규칙:**
- 입양자 이름, 이메일, 연락처는 JWT 토큰에서 자동 추출
- 같은 브리더에게 대기 중인 신청이 있으면 중복 신청 불가
- 신청 후 브리더의 검토 대기 상태(consultation_pending)로 변경`,
        responseType: ApplicationCreateResponseDto,
        isPublic: false,
    })
    async createApplication(
        @CurrentUser() user: any,
        @Body() createApplicationDto: ApplicationCreateRequestDto,
    ): Promise<ApiResponseDto<ApplicationCreateResponseDto>> {
        const result = await this.adopterService.createApplication(user.userId, createApplicationDto);
        return ApiResponseDto.success(result, '입양 신청이 성공적으로 제출되었습니다.');
    }

    @Post('review')
    @ApiEndpoint({
        summary: '브리더 후기 작성',
        description: `입양 완료 후 브리더에 대한 후기를 작성합니다.

**작성 가능 조건:**
- 입양 신청 상태가 '상담 완료(consultation_completed)' 이상이어야 함
- 한 번의 입양 신청당 하나의 후기만 작성 가능
- 이미 후기를 작성한 신청에는 재작성 불가

**후기 정보:**
- applicationId: 후기를 작성할 입양 신청 ID (필수)
- reviewType: 후기 유형 (adoption_completed 등)
- rating: 평점 (1-5점)
- content: 후기 내용
- photos: 후기 사진 URL 배열 (선택)

**자동 처리:**
- 입양자의 후기 목록에 추가
- 브리더의 후기 캐시에 추가
- 브리더 평균 평점 및 후기 수 실시간 업데이트`,
        responseType: ReviewCreateResponseDto,
        isPublic: false,
    })
    async createReview(
        @CurrentUser() user: any,
        @Body() createReviewDto: ReviewCreateRequestDto,
    ): Promise<ApiResponseDto<ReviewCreateResponseDto>> {
        const result = await this.adopterService.createReview(user.userId, createReviewDto);
        return ApiResponseDto.success(result, '후기가 성공적으로 작성되었습니다.');
    }

    @Post('favorite')
    @ApiEndpoint({
        summary: '즐겨찾기 브리더 추가',
        description: '관심 있는 브리더를 즐겨찾기에 추가합니다.',
        responseType: FavoriteAddResponseDto,
        isPublic: false,
    })
    async addFavorite(
        @CurrentUser() user: any,
        @Body() addFavoriteDto: FavoriteAddRequestDto,
    ): Promise<ApiResponseDto<FavoriteAddResponseDto>> {
        const result = await this.adopterService.addFavorite(user.userId, addFavoriteDto);
        return ApiResponseDto.success(result, '즐겨찾기에 성공적으로 추가되었습니다.');
    }

    @Delete('favorite/:breederId')
    @ApiEndpoint({
        summary: '즐겨찾기 브리더 삭제',
        description: '즐겨찾기에서 브리더를 삭제합니다.',
        responseType: FavoriteRemoveResponseDto,
        isPublic: false,
    })
    async removeFavorite(
        @CurrentUser() user: any,
        @Param('breederId') breederId: string,
    ): Promise<ApiResponseDto<FavoriteRemoveResponseDto>> {
        const result = await this.adopterService.removeFavorite(user.userId, breederId);
        return ApiResponseDto.success(result, '즐겨찾기에서 성공적으로 삭제되었습니다.');
    }

    @Get('favorites')
    @ApiPaginatedEndpoint({
        summary: '즐겨찾기 브리더 목록 조회',
        description:
            '입양자가 즐겨찾기에 추가한 브리더 목록을 페이지네이션과 함께 조회합니다. 브리더의 최신 정보(평점, 후기 수, 분양 가능 개체 수 등)가 함께 제공됩니다.',
        responseType: FavoriteListResponseDto,
        itemType: FavoriteBreederDataDto,
        isPublic: false,
    })
    async getFavorites(
        @CurrentUser() user: any,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
    ): Promise<ApiResponseDto<PaginationResponseDto<FavoriteBreederDataDto>>> {
        const result = await this.adopterService.getFavoriteList(user.userId, Number(page), Number(limit));
        return ApiResponseDto.success(result, '즐겨찾기 목록이 조회되었습니다.');
    }

    @Post('report')
    @ApiEndpoint({
        summary: '브리더 신고',
        description: '부적절한 사용자나 브리더를 신고합니다.',
        responseType: ReportCreateResponseDto,
        isPublic: false,
    })
    async createReport(
        @CurrentUser() user: any,
        @Body() createReportDto: ReportCreateRequestDto,
    ): Promise<ApiResponseDto<ReportCreateResponseDto>> {
        const result = await this.adopterService.createReport(user.userId, createReportDto);
        return ApiResponseDto.success(result, '신고가 성공적으로 제출되었습니다.');
    }

    @Get('profile')
    @ApiEndpoint({
        summary: '입양자 프로필 조회',
        description: '로그인한 입양자의 프로필 정보를 조회합니다.',
        responseType: AdopterProfileResponseDto,
        isPublic: false,
    })
    async getProfile(@CurrentUser() user: any): Promise<ApiResponseDto<AdopterProfileResponseDto>> {
        const result = await this.adopterService.getProfile(user.userId);
        return ApiResponseDto.success(result, '입양자 프로필이 조회되었습니다.');
    }

    @Patch('profile')
    @ApiEndpoint({
        summary: '입양자 프로필 수정',
        description: '입양자의 프로필 정보를 수정합니다.',
        responseType: AdopterProfileUpdateResponseDto,
        isPublic: false,
    })
    async updateProfile(
        @CurrentUser() user: any,
        @Body() updateData: { name?: string; phone?: string; profileImage?: string },
    ): Promise<ApiResponseDto<AdopterProfileUpdateResponseDto>> {
        const result = await this.adopterService.updateProfile(user.userId, updateData);
        return ApiResponseDto.success(result, '프로필이 성공적으로 수정되었습니다.');
    }

    @Get('reviews')
    @ApiPaginatedEndpoint({
        summary: '내가 작성한 후기 목록 조회',
        description: `입양자가 작성한 후기 목록을 페이지네이션과 함께 조회합니다.

**반환 정보:**
- 브리더 닉네임, 프로필 사진 URL, 레벨, 브리딩 동물 종류
- 후기 내용, 후기 종류, 작성 일자
- 최신순 정렬, 기본 10개씩

**페이지네이션:**
- page: 페이지 번호 (기본값 1)
- limit: 페이지당 항목 수 (기본값 10)`,
        responseType: Object,
        itemType: Object,
        isPublic: false,
    })
    async getMyReviews(
        @CurrentUser() user: any,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
    ): Promise<ApiResponseDto<any>> {
        const result = await this.adopterService.getMyReviews(user.userId, Number(page), Number(limit));
        return ApiResponseDto.success(result, '내가 작성한 후기 목록이 조회되었습니다.');
    }

    @Get('reviews/:id')
    @ApiEndpoint({
        summary: '후기 세부 조회',
        description: `후기 ID로 특정 후기의 세부 정보를 조회합니다.

**반환 정보:**
- 브리더 닉네임, 프로필 사진 URL, 레벨, 브리딩 동물 종류
- 후기 내용, 후기 종류, 작성 일자
- 공개 여부 (isVisible)`,
        responseType: Object,
        isPublic: false,
    })
    async getReviewDetail(@CurrentUser() user: any, @Param('id') reviewId: string): Promise<ApiResponseDto<any>> {
        const result = await this.adopterService.getReviewDetail(user.userId, reviewId);
        return ApiResponseDto.success(result, '후기 세부 정보가 조회되었습니다.');
    }
}
