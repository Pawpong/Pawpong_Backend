# Breed Module

## 개요

반려동물 품종 정보를 제공하는 모듈입니다. 강아지와 고양이의 품종 카테고리와 품종 목록을 관리합니다.

## 주요 기능

### 1. 품종 목록 조회

- 품종 전체 목록 조회 (GET /api/breed)
- 반려동물 타입별 품종 조회 (GET /api/breed?petType=dog)
- 품종 카테고리별 조회 (GET /api/breed?petType=cat&category=장모)

## 파일 구조

```
breed/
├── breed.controller.ts
├── breed.service.ts
├── breed.module.ts
└── dto/
    └── response/
        └── get-breeds-response.dto.ts
```

## 스키마 구조

### Breed Schema

컬렉션명: breeds

필드:

- petType: 동물 타입 (dog, cat)
- category: 품종 카테고리 (소형견, 중형견, 대형견, 장모, 단모)
- categoryDescription: 카테고리 설명
- breeds: 품종 목록 배열

인덱스:

```
BreedSchema.index({ petType: 1, category: 1 }, { unique: true });
```

## 품종 카테고리

### 강아지 (dog)

- 소형견: 10kg 미만 (치와와, 포메라니안 등)
- 중형견: 10kg-25kg (비글, 코카스파니엘 등)
- 대형견: 25kg 이상 (골든 리트리버, 래브라도 등)

### 고양이 (cat)

- 단모: 털이 짧은 품종 (코리안 숏헤어, 브리티시 숏헤어 등)
- 장모: 털이 긴 품종 (페르시안, 메인쿤 등)

## API 예시

### 전체 품종 조회

```
GET /api/breed

Response:
{
  "success": true,
  "code": 200,
  "item": [...]
}
```

## 데이터 특성

### 정적 데이터

- 품종 정보는 거의 변경되지 않는 정적 데이터
- 브리더 탐색 시 필터링을 위한 참조용 데이터
- 초기 데이터는 src/common/data/breeds.data.ts에서 관리

### 임베딩 vs 레퍼런싱

- 레퍼런싱 사용: Breed는 독립적인 컬렉션으로 관리
- Breeder 스키마에서는 breeds: string[]로 품종명만 저장
- 필터링 시 Breed 컬렉션 참조

## 주요 메서드

### BreedService

```typescript
async getAllBreeds(): Promise<Breed[]>
async getBreedsByPetType(petType: string): Promise<Breed[]>
```

## 인증 및 권한

- 모든 API는 인증 불필요 (공개 API)

## 에러 처리

- 400 Bad Request: 잘못된 petType 파라미터
- 404 Not Found: 조회 결과 없음

## 성능 최적화

- 복합 인덱스 (petType + category)로 빠른 조회
- 정적 데이터이므로 캐싱 적용 권장

## 연관 모듈

- Breeder: 브리더가 분양하는 품종 정보 참조
- Breeder-Explore: 품종 필터링에 사용
- District: 지역 정보와 함께 필터링에 활용

## 테스트 실행

```bash
yarn test:e2e src/api/breed/test/breed.e2e-spec.ts
```
