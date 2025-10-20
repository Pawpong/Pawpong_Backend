import { Controller, Get, Param } from '@nestjs/common';

import { ApiController, ApiEndpoint } from '../../common/decorator/swagger.decorator';

import { DistrictService } from './district.service';

import { ApiResponseDto } from '../../common/dto/response/api-response.dto';
import { GetDistrictsResponseDto } from './dto/response/get-districts-response.dto';

@ApiController('districts')
@Controller('districts')
export class DistrictController {
    constructor(private readonly districtService: DistrictService) {}

    @Get()
    @ApiEndpoint({
        summary: '모든 시/도 목록 조회',
        description: '대한민국의 모든 시/도 목록을 조회합니다.',
        isPublic: true,
    })
    async getAllCities(): Promise<ApiResponseDto<string[]>> {
        const cities = await this.districtService.getAllCities();
        return ApiResponseDto.success(cities);
    }

    @Get(':city')
    @ApiEndpoint({
        summary: '특정 시/도의 시/군/구 목록 조회',
        description: '선택한 시/도의 시/군/구 목록을 조회합니다.',
        responseType: GetDistrictsResponseDto,
        isPublic: true,
    })
    async getDistricts(@Param('city') city: string): Promise<ApiResponseDto<GetDistrictsResponseDto>> {
        const result = await this.districtService.getDistricts(city);
        return ApiResponseDto.success(result);
    }
}
