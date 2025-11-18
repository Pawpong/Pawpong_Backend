import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';

import { ApiController, ApiEndpoint } from '../../../common/decorator/swagger.decorator';

import { AdminBreedService } from './admin-breed.service';

import { CreateBreedRequestDto } from './dto/request/create-breed-request.dto';
import { UpdateBreedRequestDto } from './dto/request/update-breed-request.dto';
import { ApiResponseDto } from '../../../common/dto/response/api-response.dto';
import { BreedResponseDto } from '../dto/response/breed-response.dto';
import { BreedAdminSwaggerDocs } from './swagger';

@ApiController('품종 관리 (Admin)')
@Controller('breeds-admin')
export class AdminBreedController {
    constructor(private readonly adminBreedService: AdminBreedService) {}

    @Post()
    @ApiEndpoint({
        ...BreedAdminSwaggerDocs.createBreed,
        responseType: BreedResponseDto,
    })
    async createBreed(@Body() dto: CreateBreedRequestDto): Promise<ApiResponseDto<BreedResponseDto>> {
        const result = await this.adminBreedService.createBreed(dto);
        return ApiResponseDto.success(result);
    }

    @Get()
    @ApiEndpoint({
        ...BreedAdminSwaggerDocs.getAllBreeds,
        responseType: [BreedResponseDto],
    })
    async getAllBreeds(): Promise<ApiResponseDto<BreedResponseDto[]>> {
        const result = await this.adminBreedService.getAllBreeds();
        return ApiResponseDto.success(result);
    }

    @Get(':id')
    @ApiEndpoint({
        ...BreedAdminSwaggerDocs.getBreedById,
        responseType: BreedResponseDto,
    })
    async getBreedById(@Param('id') id: string): Promise<ApiResponseDto<BreedResponseDto>> {
        const result = await this.adminBreedService.getBreedById(id);
        return ApiResponseDto.success(result);
    }

    @Patch(':id')
    @ApiEndpoint({
        ...BreedAdminSwaggerDocs.updateBreed,
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
        ...BreedAdminSwaggerDocs.deleteBreed,
    })
    async deleteBreed(@Param('id') id: string): Promise<ApiResponseDto<null>> {
        await this.adminBreedService.deleteBreed(id);
        return ApiResponseDto.success(null, '품종 카테고리가 삭제되었습니다.');
    }
}
