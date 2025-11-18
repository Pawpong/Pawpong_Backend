import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FilterOptionsService } from './filter-options.service';
import { ApiResponseDto } from '../../common/dto/response/api-response.dto';
import { ApiController, ApiEndpoint } from '../../common/decorator/swagger.decorator';
import {
    AllFilterOptionsResponseDto,
    BreederLevelOptionDto,
    SortOptionDto,
    DogSizeOptionDto,
    CatFurLengthOptionDto,
    AdoptionStatusOptionDto,
} from './dto/response/filter-options-response.dto';

@ApiController('필터 옵션')
@Controller('filter-options')
export class FilterOptionsController {
    constructor(private readonly filterOptionsService: FilterOptionsService) {}

    /**
     * 전체 필터 옵션 조회 (한번에 모든 옵션 가져오기)
     */
    @Get()
    @ApiEndpoint({
        summary: '전체 필터 옵션 조회',
        description: '브리더 검색에 사용되는 모든 필터 옵션을 한번에 조회합니다.',
        responseType: AllFilterOptionsResponseDto,
        isPublic: true,
    })
    async getAllFilterOptions(): Promise<ApiResponseDto<AllFilterOptionsResponseDto>> {
        const result = await this.filterOptionsService.getAllFilterOptions();
        return ApiResponseDto.success(result, '필터 옵션이 조회되었습니다.');
    }

    /**
     * 브리더 레벨 옵션 조회
     */
    @Get('breeder-levels')
    @ApiEndpoint({
        summary: '브리더 레벨 옵션 조회',
        description: '브리더 레벨 필터 옵션 목록을 조회합니다.',
        responseType: [BreederLevelOptionDto],
        isPublic: true,
    })
    async getBreederLevels(): Promise<ApiResponseDto<BreederLevelOptionDto[]>> {
        const result = await this.filterOptionsService.getBreederLevels();
        return ApiResponseDto.success(result, '브리더 레벨 옵션이 조회되었습니다.');
    }

    /**
     * 정렬 옵션 조회
     */
    @Get('sort-options')
    @ApiEndpoint({
        summary: '정렬 옵션 조회',
        description: '브리더 목록 정렬 옵션을 조회합니다.',
        responseType: [SortOptionDto],
        isPublic: true,
    })
    async getSortOptions(): Promise<ApiResponseDto<SortOptionDto[]>> {
        const result = await this.filterOptionsService.getSortOptions();
        return ApiResponseDto.success(result, '정렬 옵션이 조회되었습니다.');
    }

    /**
     * 강아지 크기 옵션 조회
     */
    @Get('dog-sizes')
    @ApiEndpoint({
        summary: '강아지 크기 옵션 조회',
        description: '강아지 크기 필터 옵션을 조회합니다.',
        responseType: [DogSizeOptionDto],
        isPublic: true,
    })
    async getDogSizes(): Promise<ApiResponseDto<DogSizeOptionDto[]>> {
        const result = await this.filterOptionsService.getDogSizes();
        return ApiResponseDto.success(result, '강아지 크기 옵션이 조회되었습니다.');
    }

    /**
     * 고양이 털 길이 옵션 조회
     */
    @Get('cat-fur-lengths')
    @ApiEndpoint({
        summary: '고양이 털 길이 옵션 조회',
        description: '고양이 털 길이 필터 옵션을 조회합니다.',
        responseType: [CatFurLengthOptionDto],
        isPublic: true,
    })
    async getCatFurLengths(): Promise<ApiResponseDto<CatFurLengthOptionDto[]>> {
        const result = await this.filterOptionsService.getCatFurLengths();
        return ApiResponseDto.success(result, '고양이 털 길이 옵션이 조회되었습니다.');
    }

    /**
     * 입양 가능 여부 옵션 조회
     */
    @Get('adoption-status')
    @ApiEndpoint({
        summary: '입양 가능 여부 옵션 조회',
        description: '입양 가능 여부 필터 옵션을 조회합니다.',
        responseType: [AdoptionStatusOptionDto],
        isPublic: true,
    })
    async getAdoptionStatus(): Promise<ApiResponseDto<AdoptionStatusOptionDto[]>> {
        const result = await this.filterOptionsService.getAdoptionStatus();
        return ApiResponseDto.success(result, '입양 가능 여부 옵션이 조회되었습니다.');
    }
}
