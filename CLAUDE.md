# Pawpong Backend 프로젝트 메모리

## 1. 프로젝트 요약

### 프로젝트 개요

- **프로젝트명**: Pawpong Backend (펫 입양 플랫폼 백엔드)
- **프레임워크**: NestJS + TypeScript
- **데이터베이스**: MongoDB (Mongoose)
- **인증**: JWT + Passport.js
- **로거**: Winston
- **테스트**: Jest + Supertest
- **문서화**: Swagger/OpenAPI
- **패키지 매니저**: Yarn (필수)
- **포트**: 8082

### MVP 기능 범위

1. **입양자 (Adopter)**: 회원가입/로그인, 브리더 검색/필터링, 입양 신청, 후기 작성, 즐겨찾기, 신고
2. **브리더 (Breeder)**: 인증 신청, 프로필 관리, 반려동물 등록, 입양 신청 관리, 대시보드
3. **관리자 (Admin)**: 브리더 승인, 사용자 관리, 통계 조회, 신고 처리, 시스템 모니터링

### 아키텍처 설계 철학

- **도메인 독립성**: 각 도메인은 완전히 독립적이며 중복 기능 금지
- **단일 책임 원칙**: 하나의 모듈은 하나의 책임만 담당
- **성능 우선**: MongoDB 임베딩 구조로 읽기 성능 극대화
- **타입 안전성**: TypeScript strict 모드로 런타임 에러 최소화
- **테스트 커버리지**: 모든 API는 E2E 테스트 필수

## 2. 프로젝트 구조

### 디렉토리 구조

```
src/
├── api/                           # API 도메인 모듈들
│   ├── auth/                      # 인증 (JWT + 소셜)
│   │   ├── auth.controller.ts     # 인증 컨트롤러
│   │   ├── auth.service.ts        # 인증 비즈니스 로직
│   │   ├── auth.module.ts         # 인증 모듈
│   │   └── README.md              # 인증 도메인 설명서
│   ├── user/                      # 공통 사용자 관리
│   ├── adopter/                   # 입양자 전용 기능
│   ├── breeder/                   # 브리더 검색 (공개)
│   ├── breeder-management/        # 브리더 관리 (인증된 브리더만)
│   ├── admin/                     # 관리자 기능
│   └── health/                    # 시스템 헬스체크
├── common/
│   ├── database/                  # DB 연결 모듈들
│   ├── guard/                     # 인증 가드들
│   ├── decorator/                 # 커스텀 데코레이터
│   ├── dto/                       # DTO 구조
│   │   ├── request/               # 요청 DTO들
│   │   │   ├── auth-login-request.dto.ts
│   │   │   ├── auth-register-adopter-request.dto.ts
│   │   │   └── ...
│   │   ├── response/              # 응답 DTO들
│   │   │   ├── auth-login-response.dto.ts
│   │   │   └── ...
│   │   └── common/                # 공통 DTO들
│   │       ├── api-response.dto.ts
│   │       ├── pagination-request.dto.ts
│   │       ├── pagination-response.dto.ts
│   │       ├── pagination-builder.dto.ts
│   │       └── page-info.dto.ts
│   ├── logger/                    # Winston 로거 설정
│   │   ├── winston.config.ts      # Winston 설정
│   │   └── custom-logger.service.ts # 커스텀 로거 서비스
│   └── enum/                      # 열거형 타입들
└── schema/                        # MongoDB 스키마들
    ├── adopter.schema.ts          # 입양자 스키마
    ├── breeder.schema.ts          # 브리더 스키마
    ├── admin.schema.ts            # 관리자 스키마
    └── system-stats.schema.ts     # 시스템 통계 스키마

test/                              # E2E 테스트 디렉토리
├── auth.e2e-spec.ts               # 인증 API 테스트
├── adopter.e2e-spec.ts            # 입양자 API 테스트
├── breeder.e2e-spec.ts            # 브리더 API 테스트
├── admin.e2e-spec.ts              # 관리자 API 테스트
└── app.e2e-spec.ts                # 헬스체크 테스트

logs/                              # Winston 로그 파일들
├── error.log                      # 에러 로그
├── combined.log                   # 전체 로그
├── debug.log                      # 디버그 로그 (개발환경)
├── exceptions.log                 # 예외 로그
└── rejections.log                 # Rejection 로그
```

## 3. DTO 설계 원칙 (최고의 모범 사례)

### 🏆 도메인별 DTO 분리 패턴 (Best Practice)

**각 도메인은 완전히 독립적인 DTO 구조를 가져야 합니다.**

```
src/api/[domain]/dto/
├── request/                    # 도메인별 요청 DTO들
│   ├── [action]-request.dto.ts
│   └── ...
└── response/                   # 도메인별 응답 DTO들
    ├── [action]-response.dto.ts
    └── ...

src/common/dto/common/          # 진짜 공통 DTO만
├── api-response.dto.ts         # 전역 API 응답 형식
├── pagination-request.dto.ts   # 페이지네이션 요청
├── pagination-response.dto.ts  # 페이지네이션 응답
└── pagination-builder.dto.ts   # 페이지네이션 빌더
```

### 네이밍 컨벤션 (완벽한 표준)

- **요청 DTO**: `[행위]-request.dto.ts`
- **응답 DTO**: `[행위]-response.dto.ts`
- **클래스명**: `[행위][Request|Response]Dto`

#### 🎯 실제 적용 예시:

```typescript
// Auth 도메인
src/api/auth/dto/request/login-request.dto.ts
→ export class LoginRequestDto

src/api/auth/dto/response/auth-response.dto.ts
→ export class AuthResponseDto

// Adopter 도메인
src/api/adopter/dto/request/applicationCreate-request.dto.ts
→ export class ApplicationCreateRequestDto

src/api/adopter/dto/response/applicationCreate-response.dto.ts
→ export class ApplicationCreateResponseDto

// Breeder 도메인
src/api/breeder/dto/request/profileUpdate-request.dto.ts
→ export class ProfileUpdateRequestDto

// Admin 도메인
src/api/admin/dto/request/breederVerification-request.dto.ts
→ export class BreederVerificationRequestDto
```

### DTO 필드 네이밍 표준

- **모든 필드는 camelCase**: `emailAddress`, `phoneNumber`, `profileImageUrl`
- **boolean 필드는 is/has 접두사**: `isVisible`, `hasNextPage`, `isVerified`
- **배열 필드는 복수형**: `photoUrls`, `documentUrls`, `reviewList`
- **날짜 필드는 명확한 의미**: `createdAt`, `updatedAt`, `submittedAt`

### class-validator/transformer 활용 (완벽한 패턴)

```typescript
export class ApplicationCreateRequestDto {
  /**
   * 브리더 고유 ID
   * @example "507f1f77bcf86cd799439011"
   */
  @ApiProperty({
    description: '브리더 고유 ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  targetBreederId: string;

  /**
   * 분양 가격 (원)
   * @example 1500000
   */
  @ApiProperty({
    description: '분양 가격 (원)',
    example: 1500000,
    minimum: 0,
  })
  @Type(() => Number) // 문자열을 숫자로 변환
  @IsNumber()
  @Min(0)
  expectedPrice: number;

  /**
   * 즉시 입양 희망 여부
   * @example true
   */
  @ApiProperty({
    description: '즉시 입양 희망 여부',
    example: true,
  })
  @IsBoolean()
  @Transform(({ value }) => {
    // 문자열 boolean 변환
    if (typeof value === 'string') {
      return value === 'true';
    }
    return value;
  })
  isImmediateAdoption: boolean;
}
```

### 🚀 도메인 독립성의 장점

1. **완전한 격리**: 도메인간 DTO 의존성 제거
2. **개발 생산성**: 각 팀이 독립적으로 개발 가능
3. **유지보수성**: 한 도메인 수정이 다른 도메인에 영향 없음
4. **테스트 독립성**: 각 도메인별 독립적인 테스트
5. **확장성**: 새로운 도메인 추가가 기존 코드에 무영향

### 🎯 HTTP 상태 코드 및 에러 처리 표준

#### 통일된 성공 상태 코드

모든 성공 응답은 **200 OK**로 통일:

```typescript
// 글로벌 인터셉터가 자동 처리
POST /api/auth/login       → 200 OK (201이 아닌 200)
POST /api/adopter/application → 200 OK (201이 아닌 200)
PUT /api/breeder/profile   → 200 OK (204가 아닌 200)
PATCH /api/admin/user      → 200 OK (204가 아닌 200)
```

#### 표준 에러 처리 원칙

- **절대 404 사용 금지**: 데이터가 없어도 BadRequestException 사용
- **BadRequestException 우선**: 대부분의 에러는 400으로 처리
- **명확한 에러 메시지**: 한국어로 비즈니스 친화적 메시지 제공

```typescript
// ✅ 올바른 에러 처리
if (!user?.userId) {
  throw new BadRequestException('사용자 정보가 올바르지 않습니다.');
}

if (!petId) {
  throw new BadRequestException('반려동물 ID가 필요합니다.');
}

// ❌ 잘못된 에러 처리
throw new NotFoundException('User not found'); // 사용 금지
```

### 🏗️ 컨트롤러 표준 패턴

#### 완벽한 컨트롤러 구조

```typescript
@ApiTags('도메인명')
@ApiBearerAuth('JWT-Auth')
@Controller('endpoint-name') // /api는 글로벌 프리픽스로 자동 추가
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('role-name')
export class DomainController {
  @Get('action')
  @ApiOperation({ summary: '요약', description: '상세 설명' })
  @ApiResponse({ status: 200, description: '성공', type: ResponseDto })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async actionMethod(
    @CurrentUser() user: any,
    @Body() requestData: ActionRequestDto,
  ): Promise<ActionResponseDto> {
    // 필수 파라미터 검증
    if (!user?.userId) {
      throw new BadRequestException('사용자 정보가 올바르지 않습니다.');
    }

    return this.service.actionMethod(user.userId, requestData);
  }
}
```

#### API 라우팅 구조

```bash
# 글로벌 /api 프리픽스 + 도메인별 엔드포인트
/api/auth/*                    # 인증 관련
/api/adopter/*                 # 입양자 기능
/api/breeder/*                 # 브리더 검색 (공개)
/api/breeder-management/*      # 브리더 관리 (인증된 브리더만)
/api/admin/*                   # 관리자 기능
/api/health                    # 헬스체크
```

### Common DTO 사용 원칙

**절대로 도메인별 DTO를 common에 두지 말 것!**

#### ✅ Common에 있어야 할 것들:

- `ApiResponseDto<T>`: 전역 API 응답 형식
- `PaginationRequestDto`: 페이지네이션 요청
- `PaginationResponseDto`: 페이지네이션 응답
- `PaginationBuilderDto`: 페이지네이션 빌더

#### ❌ Common에 절대 두지 말 것들:

- 특정 도메인의 비즈니스 로직과 관련된 DTO
- 특정 API 엔드포인트 전용 DTO
- 도메인별 enum이나 타입 정의

### 표준 API 응답 형식

```typescript
{
  success: boolean;           // 성공 여부
  code: number;              // HTTP 상태 코드
  item?: T;                  // 응답 데이터 (data 대신 item 사용)
  message?: string;          // 성공 메시지
  error?: string;            // 에러 메시지
  timestamp: string;         // ISO 8601 타임스탬프
}
```

### 페이지네이션 표준

```typescript
{
  item: T[];                 // 페이징된 데이터 배열
  pageInfo: {
    currentPage: number;     // 현재 페이지
    pageSize: number;        // 페이지 크기
    totalItems: number;      // 전체 아이템 수
    totalPages: number;      // 전체 페이지 수
    hasNextPage: boolean;    // 다음 페이지 존재 여부
    hasPrevPage: boolean;    // 이전 페이지 존재 여부
  }
}
```

## 4. 로깅 표준

### Winston 로거 설정

- **개발 환경**: 컬러풀한 콘솔 출력 + 디버그 파일
- **프로덕션 환경**: JSON 형식 + 로그 파일 로테이션
- **로그 레벨**: error, warn, info, debug, verbose

### 로깅 컨벤션

모든 로그는 `[메서드명] 설명: 결과` 형식을 따름:

```typescript
// 성공 로그
logger.logSuccess('registerAdopter', '입양자 회원가입 완료', {
  userId: 'user123',
});
// 출력: [registerAdopter] 입양자 회원가입 완료: 결과: {"userId":"user123"}

// 에러 로그
logger.logError('loginUser', '로그인 시도', error);
// 출력: [loginUser] 로그인 시도: 에러 - Invalid credentials

// 작업 시작 로그
logger.logStart('searchBreeders', '브리더 검색 시작', { location: 'seoul' });
// 출력: [searchBreeders] 브리더 검색 시작 파라미터: {"location":"seoul"}
```

### 전용 로깅 메서드

- `logSuccess()`: 성공적인 작업 완료
- `logError()`: 에러 발생
- `logStart()`: 작업 시작
- `logWarning()`: 비즈니스 로직 경고
- `logDbOperation()`: 데이터베이스 작업
- `logApiRequest()`: API 요청 추적
- `logAuth()`: 인증 관련 작업

## 5. 스키마 설계 철학

### 임베딩 최적화 전략

- **읽기 성능 극대화**: 단일 쿼리로 완전한 데이터 조회
- **워크로드 분석**: 조회 >> 생성 > 수정 순서로 최적화
- **의도적 데이터 중복**: 성능을 위해 필요시 중복 허용
- **이벤트 기반 동기화**: 관련 데이터 변경 시 자동 업데이트

### 핵심 스키마 특징

#### Adopter Schema (입양자)

```typescript
{
  // 기본 정보
  email, password, name, phone, profileImage,
  status, role, createdAt, updatedAt,

  // 임베딩된 데이터
  favoriteBreeder: [{        // 즐겨찾기 브리더들
    breederId, breederName, addedAt
  }],
  adoptionApplications: [{   // 입양 신청 내역들
    applicationId, breederId, petId, status, appliedAt
  }],
  reviews: [{                // 작성한 후기들
    reviewId, breederId, rating, content, createdAt
  }],
  reports: [{                // 제출한 신고들
    reportId, breederId, reason, status, reportedAt
  }]
}
```

#### Breeder Schema (브리더)

```typescript
{
  // 기본 정보
  email, password, name, phone,
  businessNumber, businessName,
  status, role, createdAt, updatedAt,

  // 인증 정보 임베딩
  verification: {
    status, appliedAt, approvedAt, documents[]
  },

  // 프로필 정보 임베딩
  profile: {
    description, location, photos[], priceRange,
    specialization, experienceYears
  },

  // 부모견/부모묘 정보 임베딩
  parentPets: [{
    petId, name, breed, age, photos[], healthRecords[]
  }],

  // 분양 가능한 개체들 임베딩
  availablePets: [{
    petId, name, breed, birthDate, gender, price,
    photos[], description, vaccinations[], availableFrom
  }],

  // 신청 폼 양식
  applicationForm: {
    questions[], requiredDocuments[]
  },

  // 받은 입양 신청들 임베딩
  receivedApplications: [{
    applicationId, adopterId, petId, status,
    applicationData, appliedAt, updatedAt
  }],

  // 받은 후기들 임베딩 (캐시)
  reviews: [{
    reviewId, adopterId, rating, content,
    petHealthRating, communicationRating, createdAt
  }],

  // 통계 정보 캐시
  stats: {
    totalReviews, averageRating, totalAdoptions,
    responseRate, responseTime, lastUpdated
  },

  // 신고 내역 임베딩
  reports: [{
    reportId, reporterId, reason, description,
    status, reportedAt, adminAction
  }]
}
```

## 6. API 설계 원칙

### RESTful API 구조

```bash
# 인증 API
POST /api/auth/register/adopter      # 입양자 회원가입
POST /api/auth/register/breeder      # 브리더 회원가입
POST /api/auth/login                 # 공통 로그인

# 입양자 API
POST /api/adopter/application        # 입양 신청
POST /api/adopter/review            # 후기 작성
POST /api/adopter/favorite          # 즐겨찾기 추가
POST /api/adopter/report            # 신고 제출
GET  /api/adopter/profile           # 프로필 조회
PATCH /api/adopter/profile          # 프로필 수정

# 브리더 검색 API (공개)
GET  /api/breeder/search            # 브리더 검색/필터
GET  /api/breeder/:id               # 브리더 프로필 상세
GET  /api/breeder/:id/reviews       # 브리더 후기 목록
GET  /api/breeder/:id/pets          # 브리더 반려동물 목록
GET  /api/breeder/popular           # 인기 브리더 목록

# 브리더 관리 API (인증된 브리더만)
POST /api/breeder/verification      # 인증 신청
PUT  /api/breeder/profile          # 프로필 수정
POST /api/breeder/pet              # 반려동물 등록
GET  /api/breeder/applications     # 받은 신청 조회
GET  /api/breeder/dashboard        # 대시보드 조회

# 관리자 API
GET  /api/admin/verification/pending   # 승인 대기 브리더
PUT  /api/admin/verification/:breederId # 브리더 승인/거절
GET  /api/admin/users                  # 사용자 관리
GET  /api/admin/reports                # 신고 관리
GET  /api/admin/stats                  # 통계 조회

# 헬스체크 API
GET  /api/health                    # 기본 헬스체크
GET  /api/health/detailed           # 상세 헬스체크
```

## 7. 환경 설정

### 환경 변수 (.env)

```bash
# 서버 설정
PORT=8082
NODE_ENV=development

# MongoDB 연결
MONGODB_URI=mongodb://localhost:27017/pawpong

# JWT 인증 설정
JWT_SECRET=your-super-secure-jwt-secret-key-pawpong
JWT_EXPIRATION=24h

# Winston 로거 설정
LOG_LEVEL=debug

# 소셜 로그인 (추후 설정)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=

# 이메일 서비스 (추후 설정)
EMAIL_SERVICE=gmail
EMAIL_USER=
EMAIL_PASS=

# 파일 업로드 (추후 설정)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET_NAME=
```

## 8. 개발 명령어

### Yarn 명령어 (필수)

```bash
# 의존성 설치
yarn install

# 개발 서버 실행
yarn start:dev

# 빌드
yarn build

# 타입 체크
yarn typecheck

# 린트 검사
yarn lint

# 전체 테스트 실행
yarn test

# E2E 테스트 실행
yarn test:e2e

# 테스트 커버리지
yarn test:cov

# 프로덕션 실행
yarn start:prod
```

### 헬스체크

```bash
# 기본 헬스체크
curl http://localhost:8082/api/health

# 상세 헬스체크
curl http://localhost:8082/api/health/detailed
```

## 9. 테스트 전략

### E2E 테스트 커버리지

- **인증 API**: 회원가입, 로그인, JWT 검증
- **입양자 API**: 신청, 후기, 즐겨찾기, 신고, 프로필
- **브리더 API**: 검색, 필터링, 상세 조회, 통계
- **관리자 API**: 승인, 사용자 관리, 신고 처리, 통계
- **헬스체크 API**: 시스템 상태 모니터링

### 테스트 데이터베이스

- MongoDB Memory Server 사용
- 테스트 간 데이터 격리
- 실제 API 흐름 시뮬레이션

## 10. 보안 고려사항

### 인증 및 권한

- JWT 토큰 기반 인증
- 역할별 접근 제어 (Role-based Access Control)
- 비밀번호 bcryptjs 해싱
- API Rate Limiting (추후 적용)

### 데이터 검증

- class-validator로 입력 데이터 검증
- MongoDB Injection 방지
- XSS 공격 방지 데이터 sanitization
- CORS 설정으로 도메인 제한

### 개인정보 보호

- 민감 정보 로그 출력 금지
- 비밀번호 등 민감 데이터 응답에서 제외
- GDPR 준수 개인정보 처리

## 11. 성능 최적화 전략

### 데이터베이스 최적화

- MongoDB 복합 인덱스 활용
- 임베딩 구조로 JOIN 연산 최소화
- 페이지네이션으로 메모리 사용량 제한
- 통계 데이터 사전 계산 및 캐싱

### API 응답 최적화

- 불필요한 데이터 필드 제외
- 압축 미들웨어 적용
- CDN을 통한 정적 파일 서빙 (추후)

## 12. 확장 계획

### MVP 이후 기능 확장

- 실시간 알림 시스템 (WebSocket)
- 결제 및 에스크로 시스템
- 지도 기반 브리더 검색
- AI 추천 시스템
- 모바일 푸시 알림

### 인프라 확장

- Redis 캐싱 레이어 도입
- AWS S3 파일 스토리지 연동
- Docker 컨테이너화
- CI/CD 파이프라인 구축
- 모니터링 및 로그 분석 시스템

## 13. 중요 규칙

### 절대 원칙

- **Yarn 필수 사용**: npm 사용 금지
- **의미 있는 주석**: 모든 코드에 비즈니스 목적 설명 필수
- **도메인 독립성**: 도메인 간 기능 중복 절대 금지
- **E2E 테스트**: 모든 API는 테스트 통과 필수
- **로그 표준**: `[메서드명] 설명: 결과` 형식 엄수
- **TypeScript Strict**: 타입 안전성 최우선

### 개발 워크플로우

1. 기능 요구사항 분석
2. API 설계 및 DTO 정의
3. 비즈니스 로직 구현
4. E2E 테스트 작성
5. 타입 체크 및 빌드 검증
6. 코드 리뷰 및 문서화

### 코드 품질 기준

- 모든 public 메서드는 JSDoc 주석 필수
- 복잡한 비즈니스 로직은 단위 테스트 추가
- 에러 핸들링 및 로깅 필수
- 성능에 영향을 주는 코드는 최적화 필수
