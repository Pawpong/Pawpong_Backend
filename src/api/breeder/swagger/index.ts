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

/**
 * Breeder 도메인 스웨거 문서
 */
export class BreederSwaggerDocs {
    static readonly searchBreeders = {
        summary: '브리더 검색 (레거시)',
        description: `
            **[Deprecated]** 기존 버전의 브리더 검색 API입니다. 하위 호환성을 위해 유지되며, **exploreBreeders** API 사용을 권장합니다.
            
            다양한 조건으로 브리더를 검색합니다.
            
            ## Query Parameters
            - **page, limit**: 페이지네이션
            - **sortBy**: 정렬 기준 (예: 'popular', 'latest')
            - **filterBy**: 필터링 조건
            
            ## 인증 불필요
            - 공개 API로 인증 없이 호출 가능합니다.
        `,
    };

    static readonly exploreBreeders = {
        summary: '브리더 탐색',
        description: `
            강아지 또는 고양이 브리더를 검색하고 다양한 조건으로 필터링합니다.
            
            ## Request Body
            - **animalType**: 'dog' 또는 'cat' (필수)
            - **page, limit**: 페이지네이션
            - **sortBy**: 정렬 기준 ('distance', 'popular', 'latest', 'priceHigh', 'priceLow')
            - **filters**: 상세 필터링 조건 (지역, 품종, 성별, 가격대 등)
            - **userLocation**: 사용자의 현재 위치 (거리순 정렬 시 사용)
            
            ## 주요 기능
            - 로그인 시, 각 브리더에 대한 사용자의 '찜' 여부(isWished)가 포함됩니다.
            - 비로그인 시에도 사용 가능합니다.
        `,
    };

    static readonly getPopularBreeders = {
        summary: '인기 브리더 조회',
        description: `
            '찜'이 많고 평점이 높은 순으로 인기 브리더 목록을 조회합니다.
            
            ## 주요 기능
            - 상위 10명의 브리더를 반환합니다.
            - 가격 정보는 제외된 상태로 반환됩니다.
            
            ## 인증 불필요
            - 공개 API로 인증 없이 호출 가능합니다.
        `,
    };

    static readonly getBreederProfile = {
        summary: '브리더 프로필 상세 조회',
        description: `
            ID를 사용하여 특정 브리더의 상세 프로필 정보를 조회합니다.
            
            ## 주요 기능
            - 브리더 기본 정보, 소개, 연락처, 활동 지역 등을 포함합니다.
            - 로그인 시, 해당 브리더에 대한 사용자의 '찜' 여부(isWished)가 포함됩니다.
            - 비로그인 시에도 사용 가능합니다.
        `,
    };

    static readonly getBreederReviews = {
        summary: '브리더 후기 목록 조회',
        description: `
            특정 브리더에 대한 입양 후기 목록을 페이지네이션과 함께 조회합니다.
            
            ## Query Parameters
            - **page**: 페이지 번호 (기본값: 1)
            - **limit**: 페이지 당 항목 수 (기본값: 10)
            
            ## 정렬
            - 최신 후기부터 내림차순으로 정렬됩니다.
            
            ## 인증 불필요
            - 공개 API로 인증 없이 호출 가능합니다.
        `,
    };

    static readonly getBreederPets = {
        summary: '브리더의 분양 개체 목록 조회',
        description: `
            특정 브리더가 분양 중인 개체(반려동물) 목록을 조회합니다.
            
            ## Query Parameters
            - **status**: 분양 상태 필터링 ('available', 'reserved', 'completed')
            - **page**: 페이지 번호 (기본값: 1)
            - **limit**: 페이지 당 항목 수 (기본값: 20)
            
            ## 인증 불필요
            - 공개 API로 인증 없이 호출 가능합니다.
        `,
    };

    static readonly getPetDetail = {
        summary: '분양 개체 상세 정보 조회',
        description: `
            특정 개체(반려동물)의 상세 정보를 조회합니다.
            
            ## 주요 정보
            - 기본 정보 (이름, 성별, 생년월일 등)
            - 백신 접종 기록
            - 건강 기록
            - 부모 정보 (부모견/묘)
            
            ## 인증 불필요
            - 공개 API로 인증 없이 호출 가능합니다.
        `,
    };

    static readonly getParentPets = {
        summary: '브리더의 부모견/부모묘 목록 조회',
        description: `
            특정 브리더의 부모견 또는 부모묘 목록을 조회합니다.
            
            ## 주요 기능
            - '활성화' 상태인 부모 개체만 반환됩니다.
            - 프로필 사진은 1시간 동안 유효한 임시 URL(Signed URL)로 제공됩니다.
            
            ## 인증 불필요
            - 공개 API로 인증 없이 호출 가능합니다.
        `,
    };

    static readonly getApplicationForm = {
        summary: '입양 신청 폼 구조 조회',
        description: `
            입양 신청 시 필요한 질문 폼의 구조를 조회합니다.
            
            ## 응답 내용
            - **표준 질문 (Standard Questions)**: 모든 브리더에게 공통으로 적용되는 필수 질문 목록입니다.
            - **커스텀 질문 (Custom Questions)**: 해당 브리더가 개별적으로 추가한 질문 목록입니다.
            
            ## 사용 흐름
            1. 입양 희망자가 "입양 신청하기" 버튼을 클릭합니다.
            2. 이 API를 호출하여 질문 목록을 받아옵니다.
            3. 프론트엔드에서 응답 데이터를 기반으로 동적 폼을 생성합니다.
            
            ## 인증 불필요
            - 공개 API로 인증 없이 호출 가능합니다.
        `,
    };
}
