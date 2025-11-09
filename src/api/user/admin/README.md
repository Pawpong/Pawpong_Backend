# User Admin API

사용자 관리 관리자 API 도메인

## 개요

플랫폼 전체 사용자 관리 및 관리자 프로필 관련 기능을 제공하는 Admin API입니다.

## 주요 기능

### 1. 관리자 프로필 관리
- 관리자 본인의 프로필 정보 조회
- 활동 로그 확인 (최근 10개)

### 2. 통합 사용자 관리
- 입양자(Adopter)와 브리더(Breeder)를 통합하여 조회
- 사용자 검색 및 필터링 (role, status, keyword)
- 페이지네이션 지원

### 3. 사용자 상태 변경
- 사용자 계정 활성화/정지 처리
- 입양자 및 브리더의 상태 관리
- 관리자 활동 로그 자동 기록

## API 엔드포인트

| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| GET | `/api/user-admin/profile` | 관리자 프로필 조회 | Admin |
| GET | `/api/user-admin/users` | 통합 사용자 목록 조회 | Admin |
| PUT | `/api/user-admin/users/:userId/status` | 사용자 상태 변경 | Admin |

## 파일 구조

```
src/api/user/admin/
├── user-admin.controller.ts    # 컨트롤러
├── user-admin.service.ts        # 비즈니스 로직
├── user-admin.module.ts         # 모듈 정의
├── dto/
│   ├── request/
│   │   ├── user-search-request.dto.ts       # 사용자 검색 필터
│   │   └── user-management-request.dto.ts   # 사용자 관리 요청
│   └── response/
│       ├── admin-profile-response.dto.ts    # 관리자 프로필 응답
│       ├── user-management-response.dto.ts  # 사용자 관리 응답
│       └── user-status-update-response.dto.ts # 상태 변경 응답
└── test/
    └── user-admin.e2e-spec.ts   # E2E 테스트
```

## Request/Response 예시

### 1. 관리자 프로필 조회

**Request:**
```http
GET /api/user-admin/profile
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "success": true,
  "code": 200,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "김관리자",
    "email": "admin@pawpong.com",
    "status": "active",
    "adminLevel": "super_admin",
    "permissions": {
      "canManageUsers": true,
      "canManageBreeders": true,
      "canManageReports": true,
      "canViewStatistics": true
    },
    "activityLogs": [...]
  },
  "message": "관리자 프로필이 조회되었습니다.",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### 2. 사용자 목록 조회

**Request:**
```http
GET /api/user-admin/users?userRole=adopter&accountStatus=active&searchKeyword=김&pageNumber=1&itemsPerPage=10
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "success": true,
  "code": 200,
  "data": {
    "users": [
      {
        "userId": "507f1f77bcf86cd799439012",
        "userName": "김입양자",
        "emailAddress": "adopter@example.com",
        "userRole": "adopter",
        "accountStatus": "active",
        "lastLoginAt": "2025-01-14T15:20:00.000Z",
        "createdAt": "2025-01-01T10:00:00.000Z"
      }
    ],
    "total": 100,
    "page": 1,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  },
  "message": "사용자 목록이 조회되었습니다.",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### 3. 사용자 상태 변경

**Request:**
```http
PUT /api/user-admin/users/507f1f77bcf86cd799439012/status?role=adopter
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "accountStatus": "suspended",
  "actionReason": "부적절한 활동으로 인한 계정 정지"
}
```

**Response:**
```json
{
  "success": true,
  "code": 200,
  "data": {
    "message": "adopter status updated to suspended"
  },
  "message": "사용자 상태가 변경되었습니다.",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

## 주요 기능 설명

### 통합 사용자 조회 로직
- 입양자와 브리더를 하나의 목록으로 통합 조회
- 각 모델의 필드 차이를 통일된 DTO로 변환
- 역할별 필터링 지원 (userRole: 'adopter' | 'breeder' | undefined)

### 활동 로그 자동 기록
- 모든 관리자 작업은 자동으로 로그에 기록됩니다
- 작업 유형: `SUSPEND_USER`, `ACTIVATE_USER`
- 로그에는 대상, 사유, 시간이 포함됩니다

## 권한 관리

- 모든 엔드포인트는 `@Roles('admin')` 데코레이터로 보호됩니다
- JWT 인증 + Role 기반 접근 제어 (RBAC)
- 관리자 권한(`canManageUsers`)이 필요합니다

## 관련 스키마

- `Admin` - 관리자 정보
- `Adopter` - 입양자 정보
- `Breeder` - 브리더 정보

## 참고사항

- 관리자 활동 로그는 최근 10개만 응답에 포함됩니다
- 사용자 상태 변경 시 반드시 `actionReason`을 제공해야 합니다
- 페이지네이션 기본값: `pageNumber=1, itemsPerPage=10`
