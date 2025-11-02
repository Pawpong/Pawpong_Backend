import { Controller, Get, Query, BadRequestException } from '@nestjs/common';

import { ApiEndpoint, ApiController } from '../../common/decorator/swagger.decorator';

import { HomeService } from './home.service';

import { ApiResponseDto } from '../../common/dto/response/api-response.dto';
import { AvailablePetResponseDto } from './dto/response/available-pet-response.dto';
import { BannerResponseDto } from './dto/response/banner-response.dto';
import { FaqResponseDto } from './dto/response/faq-response.dto';

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

    /**
     * 메인 배너 목록 조회
     * GET /api/home/banners
     */
    @Get('banners')
    @ApiEndpoint({
        summary: '메인 배너 목록 조회',
        description: `홈 화면 메인 배너 목록을 조회합니다.

**응답 데이터:**
- 배너 이미지 URL (Signed URL, 1시간 유효)
- 링크 타입 (internal: 서비스 내부, external: 외부 웹)
- 링크 URL
- 정렬 순서

**사용 예시:**
- 홈 화면 최상단 배너 롤링
- 배너 터치 시 linkType에 따라:
  - internal: 앱 내 화면 이동 (예: /explore?animal=dog)
  - external: 외부 웹 브라우저 열기 (예: 인스타그램 링크)

**비즈니스 로직:**
- 활성화된 배너만 조회 (isActive: true)
- 정렬 순서(order) 기준으로 오름차순 정렬`,
        responseType: BannerResponseDto,
        isPublic: true,
    })
    async getBanners(): Promise<ApiResponseDto<BannerResponseDto[]>> {
        const banners = await this.homeService.getBanners();
        return ApiResponseDto.success(banners, '메인 배너 목록 조회 완료');
    }

    /**
     * 자주 묻는 질문 목록 조회
     * GET /api/home/faqs
     */
    @Get('faqs')
    @ApiEndpoint({
        summary: '자주 묻는 질문 목록 조회',
        description: `홈 화면 자주 묻는 질문을 조회합니다.

**Query Parameters:**
- \`userType\`: 사용자 타입 (adopter: 입양자, breeder: 브리더, both: 공통, default: both)
- \`limit\`: 조회할 개수 (default: 10, max: 50)

**응답 데이터:**
- 질문
- 답변
- 카테고리 (service, adoption, breeder, payment, etc)
- 정렬 순서

**사용 예시:**
- 홈 화면 "자주 묻는 질문" 섹션 (3-5개 표시)
- 각 질문 클릭 시 → FAQ 상세 페이지로 이동
- "더보기" 버튼 클릭 시 → FAQ 전체 목록 웹페이지 연결

**비즈니스 로직:**
- 활성화된 FAQ만 조회 (isActive: true)
- userType이 both인 경우 모든 FAQ 조회
- userType이 adopter/breeder인 경우 해당 타입 + both FAQ 조회
- 정렬 순서(order) 기준으로 오름차순 정렬`,
        responseType: FaqResponseDto,
        isPublic: true,
    })
    async getFaqs(
        @Query('userType') userType?: string,
        @Query('limit') limit?: number,
    ): Promise<ApiResponseDto<FaqResponseDto[]>> {
        // Query parameter 검증
        const queryUserType = userType || 'both';
        const validUserTypes = ['adopter', 'breeder', 'both'];
        if (!validUserTypes.includes(queryUserType)) {
            throw new BadRequestException(`userType은 ${validUserTypes.join(', ')} 중 하나여야 합니다.`);
        }

        const queryLimit = limit ? Number(limit) : 10;
        if (isNaN(queryLimit) || queryLimit < 1 || queryLimit > 50) {
            throw new BadRequestException('limit은 1에서 50 사이의 숫자여야 합니다.');
        }

        const faqs = await this.homeService.getFaqs(queryUserType, queryLimit);

        return ApiResponseDto.success(faqs, '자주 묻는 질문 조회 완료');
    }
}
