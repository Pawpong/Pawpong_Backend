import { Controller, Get, Post, Query, Body, Param, UseGuards } from '@nestjs/common';
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
        description: '찜이 많고 평점이 높은 인기 브리더 Top 10을 조회합니다. 로그인 없이도 이용 가능하며, 가격 정보는 제외됩니다.',
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
}
