# Platform Admin API

플랫폼 통계 관리자 API 도메인

## 개요

플랫폼 전체 통계 및 분석 데이터를 제공하는 Admin API입니다.

## 주요 기능

### 1. 사용자 통계
- 총 입양자 수 / 신규 입양자 수
- 활성 입양자 수
- 총 브리더 수 / 신규 브리더 수
- 승인된 브리더 수 / 대기 중인 브리더 수

### 2. 입양 신청 통계
- 총 입양 신청 수 / 신규 신청 수
- 완료된 입양 수
- 대기 중인 신청 수
- 거절된 신청 수

### 3. 인기 품종 통계
- 품종별 신청 수
- 품종별 완료된 입양 수
- 평균 분양 가격
- TOP 10 인기 품종

### 4. 지역별 통계
- 지역별 브리더 수
- 지역별 입양 신청 수
- 지역별 완료된 입양 수
- TOP 10 활성 지역

### 5. 브리더 성과 랭킹
- 입양 신청 수 기준 TOP 10 브리더
- 완료된 입양 수
- 평균 평점
- 총 후기 수
- 프로필 조회 수

### 6. 신고 통계
- 총 신고 수 / 신규 신고 수
- 해결된 신고 수
- 대기 중인 신고 수
- 기각된 신고 수

## API 엔드포인트

| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| GET | `/api/platform-admin/stats` | 플랫폼 통계 조회 | Admin |

## 파일 구조

```
src/api/platform/admin/
├── platform-admin.controller.ts  # 컨트롤러
├── platform-admin.service.ts     # 비즈니스 로직
├── platform-admin.module.ts      # 모듈 정의
├── dto/
│   ├── request/
│   │   └── stats-filter-request.dto.ts  # 통계 필터 요청
│   └── response/
│       └── admin-stats-response.dto.ts  # 통계 응답
└── test/
    └── platform-admin.e2e-spec.ts  # E2E 테스트
```

## Request/Response 예시

### 플랫폼 통계 조회

**Request:**
```http
GET /api/platform-admin/stats?statsType=daily&startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer {JWT_TOKEN}
```

**Query Parameters:**
- `statsType` (optional): 'daily' | 'weekly' | 'monthly' (default: 'daily')
- `startDate` (optional): 시작 날짜 (YYYY-MM-DD)
- `endDate` (optional): 종료 날짜 (YYYY-MM-DD)
- `pageNumber` (optional): 페이지 번호 (default: 1)
- `itemsPerPage` (optional): 페이지당 항목 수 (default: 10, max: 100)

**Response:**
```json
{
  "success": true,
  "code": 200,
  "data": {
    "userStatistics": {
      "totalAdopterCount": 1250,
      "newAdopterCount": 45,
      "activeAdopterCount": 1200,
      "totalBreederCount": 320,
      "newBreederCount": 12,
      "approvedBreederCount": 280,
      "pendingBreederCount": 40
    },
    "adoptionStatistics": {
      "totalApplicationCount": 5600,
      "newApplicationCount": 180,
      "completedAdoptionCount": 3200,
      "pendingApplicationCount": 420,
      "rejectedApplicationCount": 1980
    },
    "popularBreeds": [
      {
        "breedName": "푸들",
        "petType": "dog",
        "applicationCount": 850,
        "completedAdoptionCount": 520,
        "averagePrice": 1500000
      },
      {
        "breedName": "웰시코기",
        "petType": "dog",
        "applicationCount": 720,
        "completedAdoptionCount": 450,
        "averagePrice": 2200000
      }
    ],
    "regionalStatistics": [
      {
        "cityName": "서울",
        "districtName": "강남구",
        "breederCount": 85,
        "applicationCount": 1250,
        "completedAdoptionCount": 780
      },
      {
        "cityName": "서울",
        "districtName": "송파구",
        "breederCount": 62,
        "applicationCount": 920,
        "completedAdoptionCount": 580
      }
    ],
    "breederPerformanceRanking": [
      {
        "breederId": "507f1f77bcf86cd799439011",
        "breederName": "행복한 강아지 농장",
        "cityName": "서울",
        "applicationCount": 245,
        "completedAdoptionCount": 180,
        "averageRating": 4.8,
        "totalReviewCount": 95,
        "profileViewCount": 3250
      }
    ],
    "reportStatistics": {
      "totalReportCount": 156,
      "newReportCount": 8,
      "resolvedReportCount": 102,
      "pendingReportCount": 32,
      "dismissedReportCount": 22
    }
  },
  "message": "시스템 통계가 조회되었습니다.",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

## 통계 집계 방식

### MongoDB Aggregation Pipeline
플랫폼 통계는 MongoDB의 강력한 Aggregation Pipeline을 활용하여 실시간으로 계산됩니다:

1. **사용자 통계**: `countDocuments()`로 집계
2. **입양 신청 통계**: `$unwind` + `$group`으로 상태별 집계
3. **인기 품종**: `$unwind` + `$group` + `$sort` + `$limit`
4. **지역 통계**: `$group`으로 지역별 집계
5. **브리더 성과**: `$project` + `$sort` + `$limit`
6. **신고 통계**: `$unwind` + `$group`으로 상태별 집계

### 성능 최적화
- 복합 인덱스 활용
- 필요한 필드만 projection
- 페이지네이션으로 메모리 사용량 제한
- 캐싱 전략 (추후 Redis 도입 예정)

## 권한 관리

- 모든 엔드포인트는 `@Roles('admin')` 데코레이터로 보호됩니다
- JWT 인증 + Role 기반 접근 제어 (RBAC)
- 관리자 권한(`canViewStatistics`)이 필요합니다

## 관련 스키마

- `Admin` - 관리자 정보
- `Adopter` - 입양자 정보
- `Breeder` - 브리더 정보
- `SystemStats` - 시스템 통계 (추후 사전 계산된 통계 저장용)

## 향후 개선 사항

### Phase 1 - SystemStats 스키마 활용
- 일간/주간/월간 통계를 사전 계산하여 저장
- 크론잡으로 정기적 업데이트
- 응답 속도 대폭 향상

### Phase 2 - Redis 캐싱
- 자주 조회되는 통계 데이터 캐싱
- TTL 설정으로 데이터 freshness 유지

### Phase 3 - 실시간 대시보드
- WebSocket 연동
- 실시간 통계 업데이트

## 참고사항

- 현재는 실시간 aggregation으로 통계를 계산합니다
- 대규모 데이터에서는 응답 시간이 길어질 수 있습니다
- 프로덕션에서는 SystemStats 컬렉션을 활용한 사전 계산 방식 권장
- 날짜 필터는 추후 구현 예정 (현재는 전체 데이터 집계)
