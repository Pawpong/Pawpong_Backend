import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';

import { RolesGuard } from '../../../common/guard/roles.guard';
import { JwtAuthGuard } from '../../../common/guard/jwt-auth.guard';
import { Roles } from '../../../common/decorator/roles.decorator';
import { ApiController, ApiEndpoint } from '../../../common/decorator/swagger.decorator';

import { DistrictAdminService } from './district-admin.service';

import { ApiResponseDto } from '../../../common/dto/response/api-response.dto';
import { CreateDistrictRequestDto } from './dto/request/create-district-request.dto';
import { UpdateDistrictRequestDto } from './dto/request/update-district-request.dto';
import { DistrictResponseDto } from '../dto/response/district-response.dto';

@ApiController('districts-admin')
@Controller('districts-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class DistrictAdminController {
    constructor(private readonly districtAdminService: DistrictAdminService) {}

    @Post()
    @ApiEndpoint({
        summary: '지역 생성',
        description: '새로운 지역을 생성합니다. (관리자 전용)',
        responseType: DistrictResponseDto,
    })
    async createDistrict(@Body() dto: CreateDistrictRequestDto): Promise<ApiResponseDto<DistrictResponseDto>> {
        const result = await this.districtAdminService.createDistrict(dto);
        return ApiResponseDto.success(result);
    }

    @Get()
    @ApiEndpoint({
        summary: '모든 지역 조회',
        description: '모든 지역을 조회합니다. (관리자 전용)',
        responseType: DistrictResponseDto,
    })
    async getAllDistricts(): Promise<ApiResponseDto<DistrictResponseDto[]>> {
        const result = await this.districtAdminService.getAllDistricts();
        return ApiResponseDto.success(result);
    }

    @Get(':id')
    @ApiEndpoint({
        summary: '특정 지역 조회',
        description: 'ID로 특정 지역을 조회합니다. (관리자 전용)',
        responseType: DistrictResponseDto,
    })
    async getDistrictById(@Param('id') id: string): Promise<ApiResponseDto<DistrictResponseDto>> {
        const result = await this.districtAdminService.getDistrictById(id);
        return ApiResponseDto.success(result);
    }

    @Patch(':id')
    @ApiEndpoint({
        summary: '지역 수정',
        description: '기존 지역을 수정합니다. (관리자 전용)',
        responseType: DistrictResponseDto,
    })
    async updateDistrict(
        @Param('id') id: string,
        @Body() dto: UpdateDistrictRequestDto,
    ): Promise<ApiResponseDto<DistrictResponseDto>> {
        const result = await this.districtAdminService.updateDistrict(id, dto);
        return ApiResponseDto.success(result);
    }

    @Delete(':id')
    @ApiEndpoint({
        summary: '지역 삭제',
        description: '기존 지역을 삭제합니다. (관리자 전용)',
    })
    async deleteDistrict(@Param('id') id: string): Promise<ApiResponseDto<null>> {
        await this.districtAdminService.deleteDistrict(id);
        return ApiResponseDto.success(null, '지역이 삭제되었습니다.');
    }
}
