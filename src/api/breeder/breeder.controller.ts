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
import { ParentPetListResponseDto } from './dto/response/parent-pet-list.dto';
import { PublicApplicationFormResponseDto } from './dto/response/public-application-form.dto';
import { BreederSwaggerDocs } from './swagger';
import { BreederExploreResponseDto } from './dto/response/breeder-explore-response.dto';

@ApiController('브리더')
@Controller('breeder')
export class BreederController {
    constructor(
        private readonly breederService: BreederService,
        private readonly breederExploreService: BreederExploreService,
    ) {}

    @Get('search')
    @ApiEndpoint({
        ...BreederSwaggerDocs.searchBreeders,
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
        ...BreederSwaggerDocs.exploreBreeders,
        responseType: BreederExploreResponseDto,
        itemType: BreederCardResponseDto,
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
        ...BreederSwaggerDocs.getPopularBreeders,
        responseType: [BreederCardResponseDto],
        isPublic: true,
    })
    async getPopularBreeders(): Promise<ApiResponseDto<BreederCardResponseDto[]>> {
        const result = await this.breederExploreService.getPopularBreeders(10);
        return ApiResponseDto.success(result, '인기 브리더 목록이 조회되었습니다.');
    }

    @Get(':id')
    // @UseGuards(JwtAuthGuard) // 임시로 주석 처리
    @ApiEndpoint({
        ...BreederSwaggerDocs.getBreederProfile,
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
        ...BreederSwaggerDocs.getBreederReviews,
        responseType: BreederReviewsResponseDto,
        itemType: BreederReviewItemDto,
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
        ...BreederSwaggerDocs.getBreederPets,
        responseType: PetsListResponseDto,
        itemType: PetItemDto,
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
        ...BreederSwaggerDocs.getPetDetail,
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
        ...BreederSwaggerDocs.getParentPets,
        responseType: [ParentPetListResponseDto],
        isPublic: true,
    })
    async getParentPets(@Param('id') breederId: string): Promise<ApiResponseDto<ParentPetListResponseDto[]>> {
        const result = await this.breederService.getParentPets(breederId);
        return ApiResponseDto.success(result, '부모견/부모묘 목록이 조회되었습니다.');
    }

    @Get(':id/application-form')
    @ApiEndpoint({
        ...BreederSwaggerDocs.getApplicationForm,
        responseType: PublicApplicationFormResponseDto,
        isPublic: true,
    })
    async getApplicationForm(@Param('id') breederId: string): Promise<ApiResponseDto<PublicApplicationFormResponseDto>> {
        const result = await this.breederService.getApplicationForm(breederId);
        return ApiResponseDto.success(result, '입양 신청 폼 구조가 조회되었습니다.');
    }
}
