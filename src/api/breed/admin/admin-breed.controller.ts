import { Controller, Get, Post, Patch, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';

import { ApiController, ApiEndpoint } from '../../../common/decorator/swagger.decorator';

import { AdminBreedService } from './admin-breed.service';

import { ApiResponseDto } from '../../../common/dto/response/api-response.dto';
import { CreateBreedRequestDto } from './dto/request/create-breed-request.dto';
import { UpdateBreedRequestDto } from './dto/request/update-breed-request.dto';
import { BreedResponseDto } from '../dto/response/breed-response.dto';

@ApiController('breeds-admin')
@Controller('breeds-admin')
export class AdminBreedController {
    constructor(private readonly adminBreedService: AdminBreedService) {}

    @Post()
    @ApiEndpoint({
        summary: '품종 카테고리 생성',
        description: '새로운 품종 카테고리를 생성합니다. (관리자 전용)',
        responseType: BreedResponseDto,
    })
    async createBreed(@Body() dto: CreateBreedRequestDto): Promise<ApiResponseDto<BreedResponseDto>> {
        const result = await this.adminBreedService.createBreed(dto);
        return ApiResponseDto.success(result);
    }

    @Get()
    @ApiEndpoint({
        summary: '모든 품종 카테고리 조회',
        description: '모든 품종 카테고리를 조회합니다. (관리자 전용)',
        responseType: BreedResponseDto,
    })
    async getAllBreeds(): Promise<ApiResponseDto<BreedResponseDto[]>> {
        const result = await this.adminBreedService.getAllBreeds();
        return ApiResponseDto.success(result);
    }

    @Get(':id')
    @ApiEndpoint({
        summary: '특정 품종 카테고리 조회',
        description: 'ID로 특정 품종 카테고리를 조회합니다. (관리자 전용)',
        responseType: BreedResponseDto,
    })
    async getBreedById(@Param('id') id: string): Promise<ApiResponseDto<BreedResponseDto>> {
        const result = await this.adminBreedService.getBreedById(id);
        return ApiResponseDto.success(result);
    }

    @Patch(':id')
    @ApiEndpoint({
        summary: '품종 카테고리 수정',
        description: '기존 품종 카테고리를 수정합니다. (관리자 전용)',
        responseType: BreedResponseDto,
    })
    async updateBreed(
        @Param('id') id: string,
        @Body() dto: UpdateBreedRequestDto,
    ): Promise<ApiResponseDto<BreedResponseDto>> {
        const result = await this.adminBreedService.updateBreed(id, dto);
        return ApiResponseDto.success(result);
    }

    @Delete(':id')
    @ApiEndpoint({
        summary: '품종 카테고리 삭제',
        description: '기존 품종 카테고리를 삭제합니다. (관리자 전용)',
    })
    async deleteBreed(@Param('id') id: string): Promise<ApiResponseDto<null>> {
        await this.adminBreedService.deleteBreed(id);
        return ApiResponseDto.success(null, '품종 카테고리가 삭제되었습니다.');
    }
}
