# 브리더 관리 (Breeder Management) 도메인

## 개요

인증된 브리더가 자신의 정보와 반려동물을 관리하기 위한 전용 API 도메인입니다. 프로필 수정, 인증 관리, 반려동물 등록/수정/삭제, 입양 신청 처리 등 브리더의 모든 관리 기능을 제공합니다.

**핵심 특징:**

- **인증 필수**: 모든 API는 JWT 인증 + breeder 역할 필요
- **완전한 CRUD**: 반려동물(부모견/분양용)과 프로필 전체 관리
- **입양 신청 관리**: 받은 신청 조회 및 상태 업데이트
- **커스텀 폼**: 입양 신청 폼 질문 추가/수정/삭제
- **대시보드**: 통계 정보와 최근 활동 한눈에 확인

## 주요 기능

- 브리더 대시보드 (통계, 최근 활동)
- 프로필 관리 (조회, 수정)
- 인증 관리 (상태 조회, 신청)
- 부모견/부모묘 관리 (추가, 수정, 삭제)
- 분양 가능 반려동물 관리 (추가, 수정, 상태 변경, 삭제)
- 입양 신청 관리 (목록 조회, 상세 조회, 상태 업데이트)
- 개체 목록 조회 (상태 필터링, 비활성화 포함)
- 후기 목록 조회 (공개/비공개 필터링)
- 입양 신청 폼 관리 (조회, 커스텀 질문 추가/수정)

## API 엔드포인트 (19개)

### 1. 브리더 대시보드 조회 GET /api/breeder-management/dashboard

브리더의 통계 정보와 최근 활동을 확인합니다.

**Response:**

```json
{
  "success": true,
  "data": {
    "breederInfo": {
      "breederId": "...",
      "name": "해피독 브리더",
      "level": "elite"
    },
    "statistics": {
      "totalPets": 10,
      "availablePets": 5,
      "totalApplications": 25,
      "pendingApplications": 3
    },
    "recentActivities": [...]
  }
}
```

### 2. 브리더 프로필 조회 GET /api/breeder-management/profile

로그인한 브리더의 프로필 정보를 조회합니다.

### 3. 브리더 프로필 수정 PATCH /api/breeder-management/profile

브리더의 프로필 정보를 업데이트합니다.

**Request:**

```json
{
    "profileDescription": "15년 경력의 전문 브리더입니다",
    "locationInfo": {
        "cityName": "서울특별시",
        "districtName": "강남구",
        "detailAddress": "테헤란로 123"
    },
    "profilePhotos": ["https://...", "https://..."],
    "priceRangeInfo": {
        "minimumPrice": 500000,
        "maximumPrice": 2000000
    },
    "specializationTypes": ["dog", "cat"],
    "experienceYears": 15
}
```

### 4. 브리더 인증 상태 조회 GET /api/breeder-management/verification

로그인한 브리더의 인증 상태 및 관련 정보를 조회합니다. 인증 문서 URL은 1시간 유효한 Signed URL로 제공됩니다.

### 5. 브리더 인증 신청 POST /api/breeder-management/verification

브리더 인증을 위한 서류를 제출합니다.

**Request:**

```json
{
    "businessNumber": "123-45-67890",
    "businessName": "해피독 브리더",
    "representativeName": "홍길동",
    "documentUrls": ["https://example.com/business-license.pdf", "https://example.com/certificate.pdf"]
}
```

### 6. 부모견/부모묘 추가 POST /api/breeder-management/parent-pets

새로운 부모 반려동물을 등록합니다.

**Request:**

```json
{
    "name": "챔프",
    "breed": "골든리트리버",
    "gender": "male",
    "description": "온순하고 건강한 부모견입니다"
}
```

### 7. 부모견/부모묘 정보 수정 PUT /api/breeder-management/parent-pets/:petId

등록된 부모 반려동물의 정보를 수정합니다.

### 8. 부모견/부모묘 삭제 DELETE /api/breeder-management/parent-pets/:petId

등록된 부모 반려동물을 삭제합니다.

### 9. 분양 가능한 반려동물 추가 POST /api/breeder-management/available-pets

새로운 분양 가능한 반려동물을 등록합니다.

**Request:**

```json
{
    "name": "밀크",
    "breed": "골든리트리버",
    "gender": "female",
    "birthDate": "2024-01-15",
    "price": 1500000,
    "description": "건강하고 활발한 아이입니다",
    "parentInfo": {
        "mother": "507f1f77bcf86cd799439011",
        "father": "507f1f77bcf86cd799439012"
    }
}
```

### 10. 분양 가능한 반려동물 정보 수정 PUT /api/breeder-management/available-pets/:petId

등록된 분양 반려동물의 정보를 수정합니다.

### 11. 반려동물 상태 변경 PATCH /api/breeder-management/available-pets/:petId/status

분양 반려동물의 상태를 변경합니다 (available, reserved, adopted).

**Request:**

```json
{
    "petStatus": "reserved"
}
```

### 12. 분양 가능한 반려동물 삭제 DELETE /api/breeder-management/available-pets/:petId

등록된 분양 반려동물을 삭제합니다.

### 13. 받은 입양 신청 목록 조회 GET /api/breeder-management/applications

브리더가 받은 입양 신청들을 페이지네이션으로 조회합니다.

**Query Parameters:**

- `page`: 페이지 번호 (기본값: 1)
- `take`: 페이지당 항목 수 (기본값: 10)

### 14. 받은 입양 신청 상세 조회 GET /api/breeder-management/applications/:applicationId

브리더가 받은 특정 입양 신청의 상세 정보를 조회합니다.

**Response 데이터:**

- 신청 ID, 입양자 정보 (이름, 이메일, 연락처)
- 반려동물 정보 (있는 경우)
- 신청서 전체 내용 (8가지 필수 정보 포함)
- 신청 상태, 신청 일시, 처리 일시
- 브리더 메모

### 15. 입양 신청 상태 업데이트 PATCH /api/breeder-management/applications/:applicationId

받은 입양 신청의 상태를 변경합니다.

**Request:**

```json
{
    "applicationStatus": "approved",
    "breederMemo": "검토 완료, 승인합니다"
}
```

**가능한 상태:** pending, reviewing, approved, rejected, cancelled

### 16. 내 개체 목록 조회 GET /api/breeder-management/my-pets

브리더 자신의 모든 개체 목록을 관리 목적으로 조회합니다.

**Query Parameters:**

- `status`: 상태 필터 (available, reserved, adopted)
- `includeInactive`: 비활성화된 개체 포함 여부 (true/false)
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 20)

**Response 포함 정보:**

- 비활성화된 개체
- 상태별 필터링
- 입양 신청 수 등 상세 정보

### 17. 내게 달린 후기 목록 조회 GET /api/breeder-management/my-reviews

브리더 자신에게 작성된 모든 후기를 관리 목적으로 조회합니다.

**Query Parameters:**

- `visibility`: 공개 여부 필터 (all, public, private)
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 10)

**Response 포함 정보:**

- 공개/비공개 후기 모두 확인 가능
- 신고된 후기 정보 포함

### 18. 입양 신청 폼 조회 GET /api/breeder-management/application-form

브리더가 설정한 입양 신청 폼 전체 구조를 조회합니다.

**Response 데이터:**

- **표준 질문 (14개)**: 모든 브리더 공통, 수정 불가능
    1. 개인정보 수집 동의
    2. 자기소개
    3. 가족 구성원 정보
    4. 가족 입양 동의
    5. 알러지 검사
    6. 집 비우는 시간
    7. 거주 공간 소개
    8. 반려동물 경험
    9. 기본 케어 책임
    10. 치료비 감당
    11. 중성화 동의
    12. 선호하는 아이
    13. 입양 시기
    14. 추가 문의사항

- **커스텀 질문**: 브리더가 자유롭게 추가/삭제 가능

### 19. 입양 신청 폼 수정 PUT /api/breeder-management/application-form

브리더가 커스텀 질문을 추가/수정/삭제합니다.

**중요 사항:**

- 표준 14개 질문은 자동으로 포함되며 수정 불가능
- 이 API는 커스텀 질문만 관리합니다
- 전체 커스텀 질문 배열을 전송 (부분 수정 불가)

**Validation 규칙:**

- 질문 ID는 영문, 숫자, 언더스코어만 사용
- 질문 ID는 중복 불가
- 표준 질문 ID와 중복 불가
- select/radio/checkbox 타입은 options 필수

**Request:**

```json
{
    "customQuestions": [
        {
            "id": "custom_visit_time",
            "type": "select",
            "label": "방문 가능한 시간대를 선택해주세요",
            "required": true,
            "options": ["오전", "오후", "저녁"],
            "order": 1
        },
        {
            "id": "custom_pet_preference",
            "type": "textarea",
            "label": "선호하는 반려동물의 성격을 알려주세요",
            "required": false,
            "placeholder": "예: 활발하고 사람을 좋아하는 성격",
            "order": 2
        }
    ]
}
```

## E2E 테스트 (65개 케이스)

테스트 파일: `test/breeder-management.e2e-spec.ts` (1019 lines)

- GET /api/breeder-management/dashboard: 3개 테스트
- GET /api/breeder-management/profile: 2개 테스트
- PATCH /api/breeder-management/profile: 3개 테스트
- GET /api/breeder-management/verification: 2개 테스트
- POST /api/breeder-management/verification: 3개 테스트
- POST /api/breeder-management/parent-pets: 3개 테스트
- PUT /api/breeder-management/parent-pets/:petId: 3개 테스트
- DELETE /api/breeder-management/parent-pets/:petId: 3개 테스트
- POST /api/breeder-management/available-pets: 4개 테스트
- PUT /api/breeder-management/available-pets/:petId: 3개 테스트
- PATCH /api/breeder-management/available-pets/:petId/status: 3개 테스트
- DELETE /api/breeder-management/available-pets/:petId: 3개 테스트
- GET /api/breeder-management/applications: 3개 테스트
- GET /api/breeder-management/applications/:applicationId: 3개 테스트
- PATCH /api/breeder-management/applications/:applicationId: 3개 테스트
- GET /api/breeder-management/my-pets: 4개 테스트
- GET /api/breeder-management/my-reviews: 4개 테스트
- GET /api/breeder-management/application-form: 2개 테스트
- PUT /api/breeder-management/application-form: 4개 테스트
- 통합 시나리오: 1개 테스트 (전체 플로우 검증)

```bash
# 테스트 실행
yarn test:e2e breeder-management.e2e-spec
```

## 권한 및 보안

**인증 요구사항:**

- 모든 API는 JWT 토큰 필수
- `breeder` 역할만 접근 가능
- 본인의 데이터만 조회/수정 가능

**보안 정책:**

- 브리더는 자신의 정보만 관리
- 다른 브리더의 데이터 접근 불가
- 입양 신청은 자신에게 온 것만 조회

## 비즈니스 로직

### 반려동물 상태 관리

- `available`: 분양 가능
- `reserved`: 예약됨
- `adopted`: 입양 완료

### 입양 신청 상태 관리

- `pending`: 접수 대기
- `reviewing`: 검토 중
- `approved`: 승인
- `rejected`: 거절
- `cancelled`: 취소됨

### 인증 상태

- `pending`: 승인 대기
- `approved`: 승인됨
- `rejected`: 거절됨

## 테스트 실행

```bash
yarn test:e2e src/api/breeder-management/test/breeder-management.e2e-spec.ts
```

## 관련 문서

- [Adopter 도메인](../adopter/README.md)
- [Breeder 도메인](../breeder/README.md)
- [API 명세서](../../../API_SPECIFICATION.md)
