import { Controller, Get, Post, Query, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { CurrentUser } from '../../common/decorator/user.decorator';
import { ApiResponseDto } from '../../common/dto/response/api-response.dto';
import { ApiController, ApiEndpoint, ApiPaginatedEndpoint } from '../../common/decorator/swagger.decorator';

import { BreederService } from './breeder.service';
import { BreederExploreService } from './breeder-explore.service';

import { BreederSearchRequestDto } from './dto/request/breeder-search-request.dto';
import { SearchBreederRequestDto } from './dto/request/search-breeder-request.dto';
import { BreederSearchResponseDto } from './dto/response/breeder-search-response.dto';
import { BreederProfileResponseDto } from './dto/response/breeder-profile-response.dto';
import { BreederCardResponseDto } from './dto/response/breeder-card-response.dto';
import { PaginationResponseDto } from '../../common/dto/pagination/pagination-response.dto';
import { BreederReviewsResponseDto, BreederReviewItemDto } from './dto/response/breeder-reviews-response.dto';
import { PetDetailResponseDto } from './dto/response/pet-detail-response.dto';
import { PetsListResponseDto, PetItemDto } from './dto/response/pets-list-response.dto';

@ApiController('브리더')
@Controller('breeder')
export class BreederController {
    constructor(
        private readonly breederService: BreederService,
        private readonly breederExploreService: BreederExploreService,
    ) {}

    @Get('search')
    @ApiEndpoint({
        summary: '브리더 검색 (레거시)',
        description: '기존 브리더 검색 API (하위 호환성 유지)',
        responseType: BreederSearchResponseDto,
        isPublic: true,
    })
    async searchBreeders(
        @Query() searchDto: BreederSearchRequestDto,
    ): Promise<ApiResponseDto<BreederSearchResponseDto>> {
        const result = await this.breederService.searchBreeders(searchDto);
        return ApiResponseDto.success(result, '브리더 검색이 완료되었습니다.');
    }

    @Post('explore')
    @ApiPaginatedEndpoint({
        summary: '브리더 탐색',
        description: '강아지/고양이 브리더를 검색하고 다양한 조건으로 필터링할 수 있습니다.',
        responseType: BreederCardResponseDto,
        isPublic: true,
    })
    async exploreBreeders(
        @Body() searchDto: SearchBreederRequestDto,
        @CurrentUser() user?: any,
    ): Promise<ApiResponseDto<PaginationResponseDto<BreederCardResponseDto>>> {
        const result = await this.breederExploreService.searchBreeders(searchDto, user?.userId);
        return ApiResponseDto.success(result, '브리더 목록이 조회되었습니다.');
    }

    @Get('popular')
    @ApiEndpoint({
        summary: '인기 브리더 조회',
        description:
            '찜이 많고 평점이 높은 인기 브리더 Top 10을 조회합니다. 로그인 없이도 이용 가능하며, 가격 정보는 제외됩니다.',
        responseType: BreederCardResponseDto,
        isPublic: true,
    })
    async getPopularBreeders(): Promise<ApiResponseDto<BreederCardResponseDto[]>> {
        const result = await this.breederExploreService.getPopularBreeders(10);
        return ApiResponseDto.success(result, '인기 브리더 목록이 조회되었습니다.');
    }

    @Get(':id')
    // @UseGuards(JwtAuthGuard) // 임시로 주석 처리
    @ApiEndpoint({
        summary: '브리더 프로필 상세',
        description: '특정 브리더의 상세 정보를 조회합니다.',
        responseType: BreederProfileResponseDto,
        isPublic: true, // 공개 API로 변경
    })
    async getBreederProfile(
        @Param('id') breederId: string,
        @CurrentUser() user?: any, // 선택적 파라미터로 변경
    ): Promise<ApiResponseDto<BreederProfileResponseDto>> {
        const result = await this.breederService.getBreederProfile(breederId, user?.userId);
        return ApiResponseDto.success(result, '브리더 프로필이 조회되었습니다.');
    }

    @Get(':id/reviews')
    @ApiPaginatedEndpoint({
        summary: '브리더 후기 목록 조회',
        description: '특정 브리더의 후기 목록을 페이지네이션과 함께 조회합니다. 최신 후기부터 정렬되어 반환됩니다.',
        responseType: BreederReviewsResponseDto,
        isPublic: true,
    })
    async getBreederReviews(
        @Param('id') breederId: string,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
    ): Promise<ApiResponseDto<PaginationResponseDto<BreederReviewItemDto>>> {
        const result = await this.breederService.getBreederReviews(breederId, Number(page), Number(limit));
        return ApiResponseDto.success(result, '후기 목록이 조회되었습니다.');
    }

    @Get(':id/pets')
    @ApiPaginatedEndpoint({
        summary: '브리더 개체 목록 조회',
        description:
            '특정 브리더의 개체(반려동물) 목록을 조회합니다. status 파라미터로 분양 가능, 예약, 입양 완료 상태별 필터링이 가능합니다.',
        responseType: PetsListResponseDto,
        isPublic: true,
    })
    async getBreederPets(
        @Param('id') breederId: string,
        @Query('status') status?: string,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
    ): Promise<ApiResponseDto<PaginationResponseDto<PetItemDto>>> {
        const result = await this.breederService.getBreederPets(breederId, status, Number(page), Number(limit));
        return ApiResponseDto.success(result, '개체 목록이 조회되었습니다.');
    }

    @Get(':id/pet/:petId')
    @ApiEndpoint({
        summary: '개체 상세 정보 조회',
        description:
            '특정 개체(반려동물)의 상세 정보를 조회합니다. 백신 접종 기록, 건강 기록, 부모 정보 등이 포함됩니다.',
        responseType: PetDetailResponseDto,
        isPublic: true,
    })
    async getPetDetail(
        @Param('id') breederId: string,
        @Param('petId') petId: string,
    ): Promise<ApiResponseDto<PetDetailResponseDto>> {
        const result = await this.breederService.getPetDetail(breederId, petId);
        return ApiResponseDto.success(result, '개체 상세 정보가 조회되었습니다.');
    }

    @Get(':id/parent-pets')
    @ApiEndpoint({
        summary: '브리더 부모견/부모묘 목록 조회',
        description:
            '특정 브리더의 부모견/부모묘 목록을 조회합니다. 활성화된 부모견/부모묘만 반환되며, 사진 URL은 1시간 유효한 Signed URL로 제공됩니다.',
        responseType: Object,
        isPublic: true,
    })
    async getParentPets(@Param('id') breederId: string): Promise<ApiResponseDto<any>> {
        const result = await this.breederService.getParentPets(breederId);
        return ApiResponseDto.success(result, '부모견/부모묘 목록이 조회되었습니다.');
    }

    @Get(':id/application-form')
    @ApiEndpoint({
        summary: '입양 신청 폼 구조 조회 (공개)',
        description: `입양자가 입양 신청하기 전에 브리더의 입양 신청 폼 구조를 조회합니다.

**응답 데이터:**
- **표준 질문** (14개): 모든 브리더 공통 - 개인정보 동의, 자기소개, 가족 구성원, 가족 동의, 알러지 검사, 집 비우는 시간, 거주 공간, 반려동물 경험, 기본 케어 책임, 치료비 감당, 중성화 동의, 선호하는 아이, 입양 시기, 추가 문의사항
- **커스텀 질문**: 해당 브리더가 추가로 요청하는 질문들

**사용 시나리오:**
1. 입양자가 브리더 프로필 페이지에서 "입양 신청하기" 버튼 클릭
2. 이 API를 호출하여 폼 구조 조회
3. 폼 구조에 맞춰 동적으로 입력 폼 렌더링
4. 입양자가 모든 질문에 답변 작성
5. POST /api/adopter/application으로 입양 신청 제출

**인증 불필요** (공개 API)`,
        responseType: Object,
        isPublic: true,
    })
    async getApplicationForm(@Param('id') breederId: string): Promise<ApiResponseDto<any>> {
        const result = await this.breederService.getApplicationForm(breederId);
        return ApiResponseDto.success(result, '입양 신청 폼 구조가 조회되었습니다.');
    }
}
