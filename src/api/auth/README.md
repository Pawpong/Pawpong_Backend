# Auth Module

## 개요

사용자 인증 및 회원가입을 담당하는 모듈입니다. 일반 로그인, 소셜 로그인 (Google, Naver, Kakao), SMS 인증을 지원합니다.

## 주요 기능

### 1. 회원가입

- 입양자 회원가입 (`POST /api/auth/register/adopter`)
- 브리더 회원가입 (`POST /api/auth/register/breeder`)
- 이메일, 닉네임, 전화번호 중복 체크
- 비밀번호 bcrypt 해싱
- 전화번호 자동 정규화 (하이픈 제거)

### 2. 로그인

- 일반 로그인 (`POST /api/auth/login`)
- 소셜 로그인 (Google, Naver, Kakao)
- JWT Access Token (1시간) + Refresh Token (7일) 발급

### 3. SMS 인증

- 인증코드 발송 (`POST /api/auth/phone/send-code`)
    - 전화번호 중복 체크
    - 6자리 랜덤 코드 생성
    - CoolSMS로 발송
    - 3분 만료 시간
- 인증코드 검증 (`POST /api/auth/phone/verify-code`)
    - 5회 시도 제한
    - 만료 시간 확인

### 4. 소셜 로그인 플로우

```
1. GET /api/auth/{provider} (google/naver/kakao)
2. OAuth Provider 인증
3. GET /api/auth/{provider}/callback
4. 신규 사용자 → /signup (tempId 전달)
   기존 사용자 → /login/success (토큰 전달)
5. POST /api/auth/social/complete (추가 정보 입력)
```

## 파일 구조

```
auth/
├── auth.controller.ts        # API 엔드포인트
├── auth.service.ts            # 비즈니스 로직
├── auth.module.ts             # 모듈 정의
├── sms.service.ts             # SMS 인증 로직
├── dto/
│   ├── request/
│   │   ├── register-adopter-request.dto.ts
│   │   ├── register-breeder-request.dto.ts
│   │   ├── login-request.dto.ts
│   │   ├── social-login-request.dto.ts
│   │   ├── send-sms-request.dto.ts
│   │   └── verify-sms-request.dto.ts
│   └── response/
│       ├── auth-response.dto.ts
│       └── sms-response.dto.ts
└── swagger/
    └── index.ts               # Swagger 문서
```

## 주요 메서드

### AuthService - SOLID 원칙 적용

#### Private 메서드 (단일 책임 원칙)

```typescript
// 검증 관련
private async validateDuplicateUser(email: string, nickname: string)
private async checkEmailDuplicate(email: string)
private async checkNicknameDuplicate(nickname: string)

// 생성 관련
private async createAdopter(dto: RegisterAdopterRequestDto)
private async createBreeder(dto: RegisterBreederRequestDto)

// 헬퍼 메서드
private async hashPassword(password: string)
private normalizePhoneNumber(phone?: string)
private generateTokens(userId: string, email: string, role: string)
```

#### Public 메서드

```typescript
async registerAdopter(dto: RegisterAdopterRequestDto)
async registerBreeder(dto: RegisterBreederRequestDto)
async login(dto: LoginRequestDto)
async handleSocialLogin(user: any)
async completeSocialRegistration(profile: any, additionalInfo: any)
```

### SmsService

```typescript
async sendVerificationCode(phone: string)
async verifyCode(phone: string, code: string)
```

## 스키마 관계

### 연관 스키마

- **Adopter**: 입양자 정보 (adopters 컬렉션)
- **Breeder**: 브리더 정보 (breeders 컬렉션)
- **Admin**: 관리자 정보 (admins 컬렉션)

### 임베딩 데이터

- `socialAuthInfo`: 소셜 로그인 정보 (Adopter)
- `socialAuth`: 소셜 로그인 정보 (Breeder)

## 환경 변수

```env
# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRATION=1h

# CoolSMS
COOLSMS_API_KEY=your_api_key
COOLSMS_API_SECRET=your_api_secret
COOLSMS_SENDER_PHONE=01012345678

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=

# Frontend
FRONTEND_URL=http://localhost:3000
```

## 에러 처리

- 400 Bad Request: 잘못된 요청, 유효성 검증 실패
- 401 Unauthorized: 인증 실패, 토큰 만료
- 409 Conflict: 중복 데이터 (이메일, 닉네임, 전화번호)

## 보안

- 비밀번호 bcrypt 해싱 (salt round: 10)
- Refresh Token 해싱 후 저장
- 전화번호 정규화로 중복 가입 방지
- SMS 인증 5회 시도 제한
- JWT 짧은 만료 시간 (Access: 1시간, Refresh: 7일)
