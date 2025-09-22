# 브리더 도메인 (Breeder Domain)

## 개요

브리더 도메인은 반려동물 브리더들의 공개 프로필과 탐색 기능을 제공합니다.  
입양자들이 브리더를 검색하고, 필터링하며, 상세 정보를 조회할 수 있는 API를 포함합니다.

## 도메인 구조

```
src/api/breeder/
├── breeder.controller.ts         # 브리더 API 컨트롤러
├── breeder.service.ts            # 브리더 비즈니스 로직
├── breeder-explore.service.ts    # 브리더 탐색 전용 서비스
├── breeder.module.ts              # 브리더 모듈 정의
├── dto/
│   ├── request/                  # 요청 DTO
│   │   ├── search-breeder-request.dto.ts
│   │   └── breederSearch-request.dto.ts (레거시)
│   └── response/                 # 응답 DTO
│       ├── breeder-card-response.dto.ts
│       ├── breeder-search-response.dto.ts
│       └── breeder-profileresponse.dto.ts
├── swagger/                      # 스웨거 문서
│   └── index.ts
└── README.md
```

## 주요 기능

### 1. 브리더 탐색 (`GET /api/breeder/explore`)
- **설명**: 반려동물 타입별로 브리더를 탐색하고 필터링
- **인증**: 선택적 (로그인 시 추가 정보 제공)
- **필터 옵션**:
  - 반려동물 타입 (강아지/고양이)
  - 크기/털길이 필터
  - 지역 (광역시도 + 시군구)
  - 입양 가능 여부
  - 브리더 레벨 (NEW/ELITE)
- **정렬 옵션**: 최신순, 찜순, 리뷰순, 가격순

### 2. 인기 브리더 조회 (`GET /api/breeder/popular`)
- **설명**: 찜과 평점이 높은 인기 브리더 Top 10
- **인증**: 불필요
- **특징**: 캐시된 통계 데이터 활용

### 3. 브리더 프로필 상세 (`GET /api/breeder/:id`)
- **설명**: 특정 브리더의 상세 정보 조회
- **인증**: 필수
- **포함 정보**:
  - 기본 정보 및 인증 상태
  - 대표 사진 (최대 3장)
  - 분양 중인 아이들
  - 부모견/부모묘 정보
  - 후기 및 평점

### 4. 브리더 검색 - 레거시 (`GET /api/breeder/search`)
- **설명**: 하위 호환성을 위한 기존 검색 API
- **인증**: 불필요
- **상태**: Deprecated (새로운 API는 `/explore` 사용 권장)

## 데이터 모델

### BreederCardResponseDto
```typescript
{
  breederId: string;           // 브리더 ID
  breederName: string;          // 브리더명
  breederLevel: string;         // 레벨 (new/elite)
  location: string;             // 지역
  mainBreed: string;            // 대표 품종
  isAdoptionAvailable: boolean; // 입양 가능 여부
  priceRange?: {                // 가격 범위 (로그인 시)
    min: number;
    max: number;
    display: string;
  };
  favoriteCount: number;        // 찜 개수
  isFavorited: boolean;         // 현재 사용자 찜 여부
  representativePhotos: string[]; // 대표 사진
  profileImage?: string;        // 프로필 이미지
  totalReviews: number;         // 총 리뷰 수
  averageRating: number;        // 평균 평점
  createdAt: Date;              // 등록일
}
```

## 필터링 전략

### 반려동물 타입별 필터
- **강아지**: 크기별 (소형/중형/대형)
- **고양이**: 털 길이별 (단모/장모)

### 지역 필터
- 2단계 계층 구조: 광역시/도 → 시/군/구
- 예: "경기도" → "파주시"

### 가격 표시 정책
- **로그인 전**: 가격 정보 미노출
- **로그인 후**: 
  - `range`: 가격 범위 표시
  - `consultation`: "상담 후 공개" 표시

## API 예시

### 브리더 탐색
```http
GET /api/breeder/explore?petType=dog&dogSize=small&province=경기도&city=파주시&sortBy=latest&page=1&take=20

Response:
{
  "success": true,
  "code": 200,
  "item": {
    "item": [...],
    "pageInfo": {
      "currentPage": 1,
      "pageSize": 20,
      "totalItems": 100,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "message": "브리더 목록이 조회되었습니다.",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 성능 최적화

### 인덱싱 전략
```javascript
// 복합 인덱스로 검색 성능 최적화
{
  'verification.status': 1,
  'status': 1,
  'petType': 1,
  'profile.location.city': 1,
  'createdAt': -1
}
```

### 캐싱 전략
- 브리더 통계 정보 임베딩
- 인기 브리더 목록 주기적 갱신

## 보안 고려사항

1. **가격 정보 보호**: 로그인한 사용자에게만 노출
2. **개인정보 보호**: 연락처 등 민감정보 제외
3. **인증 상태 검증**: 승인된 브리더만 노출

## 테스트

```bash
# 단위 테스트
yarn test src/api/breeder

# E2E 테스트
yarn test:e2e test/breeder
```

## 연관 도메인

- **Breeder-Management**: 브리더 자체 관리 기능
- **Adopter**: 입양자의 찜, 신청 기능
- **Admin**: 브리더 승인 및 관리

## 참고사항

- 브리더 탐색은 공개 API이지만 상세 정보는 인증 필요
- 모든 응답은 `ApiResponseDto` 형식으로 통일
- 페이지네이션은 `PaginationResponseDto` 사용