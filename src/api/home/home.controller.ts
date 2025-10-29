import { Controller, Get, Query, BadRequestException } from '@nestjs/common';

import { ApiEndpoint, ApiController } from '../../common/decorator/swagger.decorator';

import { HomeService } from './home.service';

import { ApiResponseDto } from '../../common/dto/response/api-response.dto';
import { AvailablePetResponseDto } from './dto/response/available-pet-response.dto';

/**
 * Home Controller
 * 홈 화면 관련 API 엔드포인트
 */
@ApiController('홈')
@Controller('home')
export class HomeController {
    constructor(private readonly homeService: HomeService) {}

    /**
     * 분양중인 아이들 조회 (최신 등록순)
     * GET /api/home/available-pets
     */
    @Get('available-pets')
    @ApiEndpoint({
        summary: '분양중인 아이들 조회',
        description: `입양 가능 상태인 반려동물을 최신 등록순으로 조회합니다.

**응답 데이터:**
- 반려동물 정보 (이름, 품종, 성별, 생년월일)
- 사진 URL (Signed URL, 1시간 유효)
- 브리더 정보 (브리더명)
- 입양 상태

**Query Parameters:**
- \`limit\`: 조회할 개수 (default: 10, max: 50)

**사용 예시:**
- 홈 화면 "분양중인 아이들" 섹션
- 카드 클릭 시 → 개체 상세 페이지로 이동`,
        responseType: AvailablePetResponseDto,
        isPublic: true,
    })
    async getAvailablePets(@Query('limit') limit?: number): Promise<ApiResponseDto<AvailablePetResponseDto[]>> {
        // Query parameter 검증
        const queryLimit = limit ? Number(limit) : 10;
        if (isNaN(queryLimit) || queryLimit < 1 || queryLimit > 50) {
            throw new BadRequestException('limit은 1에서 50 사이의 숫자여야 합니다.');
        }

        const pets = await this.homeService.getAvailablePets(queryLimit);

        return ApiResponseDto.success(pets, '분양중인 아이들 조회 완료');
    }
}
