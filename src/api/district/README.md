# District Module

## 개요

대한민국의 행정구역 정보를 제공하는 모듈입니다. 시/도와 시/군/구 정보를 관리하여 지역 기반 필터링을 지원합니다.

## 주요 기능

### 1. 지역 정보 조회

- 전체 지역 목록 조회 (GET /api/district)
- 특정 시/도의 시/군/구 조회 (GET /api/district/:city)

## 파일 구조

```
district/
├── district.controller.ts
├── district.service.ts
├── district.module.ts
└── dto/
    └── response/
        └── get-districts-response.dto.ts
```

## 스키마 구조

### District Schema

컬렉션명: districts

필드:

- city: 시/도 이름 (예: "서울특별시", "경기도")
- districts: 시/군/구 이름 배열

인덱스:

```
DistrictSchema.index({ city: 1 }, { unique: true });
```

## 지역 데이터 구조

### 광역시/도 (17개)

- 서울특별시, 부산광역시, 대구광역시
- 인천광역시, 광주광역시, 대전광역시
- 울산광역시, 세종특별자치시
- 경기도, 강원도, 충청북도, 충청남도
- 전라북도, 전라남도, 경상북도, 경상남도
- 제주특별자치도

### 시/군/구

각 광역시/도에 속한 시/군/구 목록 (총 250여개)

## API 예시

### 전체 지역 조회

```
GET /api/district

Response:
{
  "success": true,
  "code": 200,
  "item": [
    {
      "city": "서울특별시",
      "districts": ["강남구", "강동구", ...]
    }
  ]
}
```

### 특정 시/도 조회

```
GET /api/district/경기도

Response:
{
  "success": true,
  "code": 200,
  "item": {
    "city": "경기도",
    "districts": ["수원시", "성남시", ...]
  }
}
```

## 데이터 특성

### 정적 데이터

- 행정구역 정보는 거의 변경되지 않는 정적 데이터
- 브리더 위치 필터링을 위한 참조용 데이터
- 초기 데이터는 src/common/data/districts.data.ts에서 관리

### 2단계 계층 구조

```
광역시/도 (city)
  └─ 시/군/구 (districts[])
```

### 임베딩 vs 레퍼런싱

- 독립적인 컬렉션: District는 별도 컬렉션으로 관리
- 임베딩 구조: districts 배열은 District 문서 내에 임베딩
- Breeder 스키마에서는 location.city, location.district로 저장

## 주요 메서드

### DistrictService

```typescript
async getAllDistricts(): Promise<District[]>
async getDistrictsByCity(city: string): Promise<District>
```

## 사용 사례

### 브리더 탐색 필터

```
1. 사용자가 "경기도" 선택
2. "파주시" 선택
3. 쿼리 생성:
{
  'profile.location.city': '경기도',
  'profile.location.district': '파주시'
}
```

## 인증 및 권한

- 모든 API는 인증 불필요 (공개 API)

## 에러 처리

- 400 Bad Request: 잘못된 city 파라미터
- 404 Not Found: 존재하지 않는 시/도

## 성능 최적화

- 유니크 인덱스 (city)로 빠른 조회
- 정적 데이터이므로 캐싱 적용 필수
- 전체 데이터 크기가 작아 메모리 캐싱 적합

## 캐싱 전략

```typescript
// 추천: 앱 시작 시 전체 데이터 메모리 캐싱
const districtCache = new Map<string, District>();

async function initDistrictCache() {
    const districts = await districtService.getAllDistricts();
    districts.forEach((d) => districtCache.set(d.city, d));
}
```

## 연관 모듈

- Breeder: 브리더 위치 정보 저장
- Breeder-Explore: 지역 필터링에 사용
- Breed: 품종 정보와 함께 복합 필터링

## 개선 사항

- [ ] 지역 코드 추가
- [ ] 우편번호 정보 연동
- [ ] 지역별 통계 정보
- [ ] 지도 좌표 정보 추가
- [ ] 인접 지역 추천 기능
