import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SearchBreederRequestDto } from '../dto/request/search-breeder-request.dto';
import { BreederCardResponseDto } from '../dto/response/breeder-card-response.dto';
import { PaginationResponseDto } from '../../../common/dto/pagination/pagination-response.dto';

/**
 * 브리더 탐색 API 스웨거 문서
 */
export class BreederExploreSwaggerDocs {
    static readonly explore = {
        summary: '브리더 탐색',
        description: `
            강아지/고양이 타입별로 브리더를 탐색합니다.
            
            ## 필터 옵션
            - **반려동물 타입**: 강아지(dog) 또는 고양이(cat) - 단일 선택 필수
            - **크기/털길이**: 강아지는 크기별, 고양이는 털길이별 필터 - **중복 선택 가능**
            - **지역**: 광역시/도 + 시군구 단위 필터 - **중복 선택 가능**
            - **입양 가능 여부**: 체크 안 함(전체), 체크(입양 가능한 개체 1마리 이상)
            - **브리더 레벨**: NEW 또는 ELITE - **중복 선택 가능**
            
            ## 정렬 기준
            - latest: 최신 등록순
            - favorite: 찜 많은순
            - review: 리뷰 많은순
            - price_asc: 가격 오름차순
            - price_desc: 가격 내림차순
            
            ## 로그인 시 추가 정보
            - 가격 범위 노출
            - 찜 여부 표시
            
            ## 중복 선택 가능 필터 사용 예시
            - 강아지 크기: ?dogSize[]=small&dogSize[]=medium
            - 지역: ?province[]=경기도&province[]=서울특별시&city[]=파주시&city[]=강남구
            - 브리더 레벨: ?breederLevel[]=new&breederLevel[]=elite
        `,
        responseType: PaginationResponseDto<BreederCardResponseDto>,
    };

    static readonly popular = {
        summary: '인기 브리더 조회',
        description: `
            찜이 많고 평점이 높은 인기 브리더 Top 10을 조회합니다.
            
            ## 정렬 기준
            - 찜 수 + 평균 평점 종합
            - 승인된 활성 브리더만 노출
            
            ## 제한사항
            - 로그인하지 않은 경우 가격 정보 미노출
            - 최대 10개 브리더만 반환
        `,
        responseType: BreederCardResponseDto,
    };

    static readonly profile = {
        summary: '브리더 프로필 상세',
        description: `
            특정 브리더의 상세 프로필을 조회합니다.
            
            ## 포함 정보
            - 기본 정보 (이름, 지역, 레벨, 품종)
            - 대표 사진 (최대 3장)
            - 브리더 소개글
            - 분양 중인 아이들
            - 부모견/부모묘 정보
            - 후기 및 평점
            
            ## 로그인 필수
            - 가격 정보 조회
            - 상담 신청
            - 찜하기/신고하기
        `,
    };

    static readonly search = {
        summary: '브리더 검색 (레거시)',
        description: '기존 브리더 검색 API (하위 호환성 유지)',
    };
}

/**
 * 브리더 탐색 요청 파라미터 예시
 */
export const BREEDER_EXPLORE_EXAMPLES = {
    dogSearch: {
        petType: 'dog',
        dogSize: ['small', 'medium'],
        province: ['경기도', '서울특별시'],
        city: ['파주시', '강남구'],
        isAdoptionAvailable: true,
        breederLevel: ['new'],
        sortBy: 'latest',
        page: 1,
        take: 20,
    },
    catSearch: {
        petType: 'cat',
        catFurLength: ['short', 'long'],
        province: ['서울특별시'],
        city: ['강남구', '서초구'],
        breederLevel: ['new', 'elite'],
        sortBy: 'favorite',
        page: 1,
        take: 20,
    },
    multipleFilters: {
        petType: 'dog',
        dogSize: ['small', 'medium', 'large'],
        province: ['경기도', '서울특별시', '인천광역시'],
        city: ['파주시', '강남구', '연수구'],
        isAdoptionAvailable: true,
        breederLevel: ['new', 'elite'],
        sortBy: 'review',
        page: 1,
        take: 20,
    },
};

/**
 * 브리더 카드 응답 예시
 */
export const BREEDER_CARD_EXAMPLE = {
    breederId: '507f1f77bcf86cd799439011',
    breederName: '해피독 브리더',
    breederLevel: 'new',
    location: '경기도 파주시',
    mainBreed: '말티즈',
    isAdoptionAvailable: true,
    priceRange: {
        min: 1000000,
        max: 2000000,
        display: 'range',
    },
    favoriteCount: 42,
    isFavorited: false,
    representativePhotos: [
        'https://example.com/photo1.jpg',
        'https://example.com/photo2.jpg',
        'https://example.com/photo3.jpg',
    ],
    profileImage: 'https://example.com/profile.jpg',
    totalReviews: 15,
    averageRating: 4.5,
    createdAt: new Date('2024-01-15T09:00:00.000Z'),
};