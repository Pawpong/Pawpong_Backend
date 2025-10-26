import { Controller, Get, Param, BadRequestException } from '@nestjs/common';

import { ApiController, ApiEndpoint } from '../../../common/decorator/swagger.decorator';

import { BreedService } from './breed.service';

import { ApiResponseDto } from '../../../common/dto/response/api-response.dto';
import { GetBreedsResponseDto } from '../dto/response/get-breeds-response.dto';

@ApiController('breeds')
@Controller('breeds')
export class BreedController {
    constructor(private readonly breedService: BreedService) {}

    @Get(':petType')
    @ApiEndpoint({
        summary: '특정 동물의 품종 목록 조회',
        description: '강아지(dog) 또는 고양이(cat)의 카테고리별 품종 목록을 조회합니다.',
        responseType: GetBreedsResponseDto,
        isPublic: true,
    })
    async getBreeds(@Param('petType') petType: string): Promise<ApiResponseDto<GetBreedsResponseDto>> {
        if (petType !== 'dog' && petType !== 'cat') {
            throw new BadRequestException('petType은 dog 또는 cat이어야 합니다.');
        }

        const result = await this.breedService.getBreeds(petType);
        return ApiResponseDto.success(result);
    }
}
