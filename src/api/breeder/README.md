# 브리더 (Breeder) 도메인

## 개요

브리더 검색 및 조회를 위한 공개 API 도메인입니다. 인증 없이도 브리더 검색, 프로필 조회, 후기 확인, 반려동물 정보 조회 등이 가능합니다.

**핵심 특징:**
- 🌐 **공개 API**: 인증 없이 모든 API 사용 가능 (일부 기능은 인증 시 추가 정보 제공)
- 🔍 **강력한 검색**: 다양한 필터링 및 정렬 옵션 제공
- 📊 **페이지네이션**: 모든 목록 조회 API에서 페이지네이션 지원
- 💾 **성능 최적화**: MongoDB 임베딩 구조로 단일 쿼리 조회

## 주요 기능

- 브리더 탐색 (필터링, 정렬, 페이지네이션)
- 인기 브리더 조회 (찜/평점 기반 Top 10)
- 브리더 프로필 상세 조회
- 브리더 후기 목록 조회
- 브리더 반려동물 목록/상세 조회
- 부모견/부모묘 정보 조회
- 입양 신청 폼 구조 조회
- 레거시 검색 API (하위 호환성)

## API 엔드포인트 (9개)

### 1. 브리더 탐색 POST /api/breeder/explore

강아지/고양이 브리더를 검색하고 다양한 조건으로 필터링할 수 있습니다.

**Request:**
```json
{
  "petType": "dog",
  "dogSize": ["small", "medium"],
  "province": ["서울특별시", "경기도"],
  "city": ["강남구", "파주시"],
  "isAdoptionAvailable": true,
  "breederLevel": ["elite"],
  "sortBy": "latest",
  "page": 1,
  "take": 20
}
```

**정렬 옵션:** latest, favorite, review, price_asc, price_desc

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {...}
  }
}
```

### 2. 인기 브리더 조회 GET /api/breeder/popular

찜이 많고 평점이 높은 인기 브리더 Top 10 조회

### 3. 브리더 프로필 상세 GET /api/breeder/:id

특정 브리더의 상세 정보, 통계, 인증 정보 조회

### 4. 브리더 후기 목록 GET /api/breeder/:id/reviews

페이지네이션 지원 후기 목록

### 5. 브리더 반려동물 목록 GET /api/breeder/:id/pets

상태 필터링 가능 (available, reserved, adopted)

### 6. 반려동물 상세 GET /api/breeder/:id/pet/:petId

백신 접종, 건강 기록, 부모 정보 포함

### 7. 부모견/부모묘 목록 GET /api/breeder/:id/parent-pets

브리더의 부모견/부모묘 정보 조회

### 8. 입양 신청 폼 GET /api/breeder/:id/application-form

표준 14개 질문 + 커스텀 질문 구조 조회

### 9. 레거시 검색 GET /api/breeder/search

하위 호환성 유지를 위한 기존 API

## E2E 테스트 (35개 케이스)

테스트 파일: `test/breeder.e2e-spec.ts` (773 lines)

- POST /api/breeder/explore: 17개 테스트
- GET /api/breeder/popular: 2개 테스트
- GET /api/breeder/:id: 3개 테스트
- GET /api/breeder/:id/reviews: 3개 테스트
- GET /api/breeder/:id/pets: 3개 테스트
- GET /api/breeder/:id/pet/:petId: 2개 테스트
- GET /api/breeder/:id/parent-pets: 2개 테스트
- GET /api/breeder/:id/application-form: 3개 테스트
- GET /api/breeder/search: 2개 테스트
- 통합 시나리오: 1개 테스트

```bash
# 테스트 실행
yarn test:e2e breeder.e2e-spec
```

## 관련 문서

- [Adopter 도메인](../adopter/README.md)
- [Breeder Management 도메인](../breeder-management/README.md)
- [API 명세서](../../../API_SPECIFICATION.md)
