# Standard Question Admin API

표준 질문 관리 Admin API 도메인

## 개요

입양 신청 시 사용되는 표준 질문을 관리하는 Admin API입니다.
브리더들이 입양 신청 폼에 추가할 수 있는 표준화된 질문 템플릿을 제공하고 관리합니다.

## 주요 기능

### 1. 표준 질문 조회

- 모든 표준 질문 목록 조회 (비활성화된 질문 포함)
- 활성/비활성 상태 구분

### 2. 표준 질문 수정

- 질문 제목, 설명, 타입, 옵션 등 수정
- 필수/선택 여부 변경

### 3. 표준 질문 활성화/비활성화

- 브리더에게 노출 여부 제어
- 비활성화 시 브리더가 선택할 수 없음

### 4. 표준 질문 순서 변경

- 질문 표시 순서 관리
- 드래그 앤 드롭 방식 지원을 위한 순서 업데이트

### 5. 표준 질문 재시딩

- 시스템 초기 상태로 질문 목록 복구
- 모든 커스터마이징 초기화

## API 엔드포인트

| 메서드 | 경로                                      | 설명                | 권한  |
| ------ | ----------------------------------------- | ------------------- | ----- |
| GET    | `/api/standard-question-admin`            | 표준 질문 목록 조회 | Admin |
| PUT    | `/api/standard-question-admin/:id`        | 표준 질문 수정      | Admin |
| PATCH  | `/api/standard-question-admin/:id/status` | 활성화/비활성화     | Admin |
| POST   | `/api/standard-question-admin/reorder`    | 순서 변경           | Admin |
| POST   | `/api/standard-question-admin/reseed`     | 재시딩              | Admin |

## 파일 구조

```
src/api/standard-question/
├── standard-question.service.ts       # Public 서비스 (브리더용)
├── standard-question.module.ts        # 모듈 정의
└── admin/
    ├── standard-question-admin.controller.ts  # Admin 컨트롤러
    ├── standard-question-admin.service.ts     # Admin 서비스
    └── test/
        └── standard-question-admin.e2e-spec.ts  # E2E 테스트
```

## Request/Response 예시

### 1. 표준 질문 목록 조회

**Request:**

```http
GET /api/standard-question-admin
Authorization: Bearer {JWT_TOKEN}
```

**Response:**

```json
{
    "success": true,
    "code": 200,
    "data": [
        {
            "id": "sq_001",
            "title": "반려동물을 키워본 경험이 있으신가요?",
            "description": "이전 반려동물 양육 경험 확인",
            "type": "radio",
            "options": ["예", "아니오"],
            "isRequired": true,
            "isActive": true,
            "order": 1
        },
        {
            "id": "sq_002",
            "title": "가족 구성원은 몇 명인가요?",
            "description": "가구 구성원 수 확인",
            "type": "number",
            "options": [],
            "isRequired": true,
            "isActive": true,
            "order": 2
        }
    ],
    "message": "표준 질문 목록이 조회되었습니다.",
    "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### 2. 표준 질문 수정

**Request:**

```http
PUT /api/standard-question-admin/sq_001
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "title": "반려동물 양육 경험이 있으신가요?",
  "description": "과거 반려동물 양육 경험 여부 확인",
  "isRequired": false
}
```

**Response:**

```json
{
    "success": true,
    "code": 200,
    "data": {
        "id": "sq_001",
        "title": "반려동물 양육 경험이 있으신가요?",
        "description": "과거 반려동물 양육 경험 여부 확인",
        "type": "radio",
        "options": ["예", "아니오"],
        "isRequired": false,
        "isActive": true,
        "order": 1
    },
    "message": "표준 질문이 수정되었습니다.",
    "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### 3. 표준 질문 활성화/비활성화

**Request:**

```http
PATCH /api/standard-question-admin/sq_001/status
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "isActive": false
}
```

**Response:**

```json
{
    "success": true,
    "code": 200,
    "data": {
        "id": "sq_001",
        "title": "반려동물 양육 경험이 있으신가요?",
        "isActive": false,
        "order": 1
    },
    "message": "표준 질문 상태가 변경되었습니다.",
    "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### 4. 표준 질문 순서 변경

**Request:**

```http
POST /api/standard-question-admin/reorder
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "reorderData": [
    { "id": "sq_001", "order": 2 },
    { "id": "sq_002", "order": 1 },
    { "id": "sq_003", "order": 3 }
  ]
}
```

**Response:**

```json
{
    "success": true,
    "code": 200,
    "data": {
        "message": "질문 순서가 성공적으로 변경되었습니다."
    },
    "message": "표준 질문 순서가 변경되었습니다.",
    "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### 5. 표준 질문 재시딩

**Request:**

```http
POST /api/standard-question-admin/reseed
Authorization: Bearer {JWT_TOKEN}
```

**Response:**

```json
{
    "success": true,
    "code": 200,
    "data": {
        "message": "15개의 표준 질문이 재시딩되었습니다."
    },
    "message": "표준 질문이 재시딩되었습니다.",
    "timestamp": "2025-01-15T10:30:00.000Z"
}
```

## 표준 질문 타입

### 지원되는 질문 타입

- `text`: 단일 텍스트 입력
- `textarea`: 여러 줄 텍스트 입력
- `number`: 숫자 입력
- `radio`: 단일 선택 (라디오 버튼)
- `checkbox`: 다중 선택 (체크박스)
- `select`: 드롭다운 선택
- `date`: 날짜 선택
- `file`: 파일 업로드

## 초기 시딩 데이터

앱 시작 시 자동으로 다음 카테고리의 표준 질문이 생성됩니다:

1. **양육 경험**
    - 반려동물 양육 경험 여부
    - 이전 반려동물 품종

2. **가족 환경**
    - 가족 구성원 수
    - 동거인의 반려동물 알레르기 여부
    - 가족 구성원의 동의 여부

3. **주거 환경**
    - 주거 형태 (아파트/주택)
    - 실내/실외 사육 계획
    - 반려동물 허용 여부

4. **경제 능력**
    - 월 평균 소득
    - 의료비 지출 가능 여부

5. **입양 목적**
    - 입양 동기
    - 선호하는 품종 및 성격

## 기술적 특징

### 자동 시딩 (OnModuleInit)

- 앱 시작 시 표준 질문이 없으면 자동으로 시딩
- 기존 데이터가 있으면 건너뜀
- Lazy Loading 방식으로 성능 최적화

### Bulk Write 최적화

- 순서 변경 시 MongoDB의 `bulkWrite()` 사용
- 여러 업데이트를 한 번의 쿼리로 처리
- 네트워크 왕복 횟수 최소화

## 권한 관리

- 모든 엔드포인트는 `@Roles('admin')` 데코레이터로 보호됩니다
- JWT 인증 + Role 기반 접근 제어 (RBAC)
- 관리자만 표준 질문을 관리할 수 있습니다

## 관련 스키마

- `StandardQuestion` - 표준 질문 정보
    - `id`: 질문 고유 ID
    - `title`: 질문 제목
    - `description`: 질문 설명
    - `type`: 질문 타입
    - `options`: 선택지 배열
    - `isRequired`: 필수 여부
    - `isActive`: 활성화 여부
    - `order`: 표시 순서

## 브리더 사용 방법

브리더는 Public API를 통해 활성화된 표준 질문만 조회할 수 있습니다:

```http
GET /api/standard-question/active
```

브리더는 이 질문들을 입양 신청 폼에 추가하여 사용합니다.

## 주의사항

- **재시딩 주의**: 재시딩은 모든 기존 질문을 삭제하고 초기 상태로 되돌립니다
- **ID 불변성**: 질문의 `id`는 수정할 수 없습니다
- **순서 관리**: 순서는 1부터 시작하며, 중복되지 않아야 합니다
- **비활성화 vs 삭제**: 질문은 삭제하지 않고 비활성화하여 관리합니다

## 향후 개선 사항

- 질문 카테고리 분류 기능
- 질문 템플릿 저장 기능
- 질문 사용 통계 (어떤 질문이 가장 많이 사용되는지)
- 브리더별 맞춤 질문 추천
