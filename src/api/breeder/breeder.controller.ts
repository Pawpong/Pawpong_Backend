import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { CurrentUser } from '../../common/decorator/user.decorator';
import { ApiResponseDto } from '../../common/dto/response/api-response.dto';
import { ApiController, ApiEndpoint, ApiPaginatedEndpoint } from '../../common/decorator/swagger.decorator';

import { BreederService } from './breeder.service';
import { BreederExploreService } from './breeder-explore.service';

import { BreederSearchRequestDto } from './dto/request/breederSearch-request.dto';
import { BreederSearchResponseDto } from './dto/response/breeder-search-response.dto';
import { BreederProfileResponseDto } from './dto/response/breeder-profileresponse.dto';
import { SearchBreederRequestDto } from './dto/request/search-breeder-request.dto';
import { BreederCardResponseDto } from './dto/response/breeder-card-response.dto';
import { PaginationResponseDto } from '../../common/dto/pagination/pagination-response.dto';

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
    async searchBreeders(@Query() searchDto: BreederSearchRequestDto): Promise<ApiResponseDto<BreederSearchResponseDto>> {
        const result = await this.breederService.searchBreeders(searchDto);
        return ApiResponseDto.success(result, '브리더 검색이 완료되었습니다.');
    }

    @Get('explore')
    @ApiPaginatedEndpoint({
        summary: '브리더 탐색',
        description: '강아지/고양이 타입별로 브리더를 탐색하고 필터링합니다.',
        responseType: BreederCardResponseDto,
        isPublic: true,
    })
    async exploreBreeders(
        @Query() searchDto: SearchBreederRequestDto,
        @CurrentUser() user?: any,
    ): Promise<ApiResponseDto<PaginationResponseDto<BreederCardResponseDto>>> {
        const result = await this.breederExploreService.searchBreeders(searchDto, user?.userId);
        return ApiResponseDto.success(result, '브리더 목록이 조회되었습니다.');
    }

    @Get('popular')
    @ApiEndpoint({
        summary: '인기 브리더 조회',
        description: '찜이 많고 평점이 높은 인기 브리더 Top 10',
        responseType: BreederCardResponseDto,
        isPublic: true,
    })
    async getPopularBreeders(): Promise<ApiResponseDto<BreederCardResponseDto[]>> {
        const result = await this.breederExploreService.getPopularBreeders(10);
        return ApiResponseDto.success(result, '인기 브리더 목록이 조회되었습니다.');
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiEndpoint({
        summary: '브리더 프로필 상세',
        description: '특정 브리더의 상세 정보를 조회합니다.',
        responseType: BreederProfileResponseDto,
        isPublic: false,
    })
    async getBreederProfile(
        @Param('id') breederId: string,
        @CurrentUser() user: any,
    ): Promise<ApiResponseDto<BreederProfileResponseDto>> {
        const result = await this.breederService.getBreederProfile(breederId, user.userId);
        return ApiResponseDto.success(result, '브리더 프로필이 조회되었습니다.');
    }
}
