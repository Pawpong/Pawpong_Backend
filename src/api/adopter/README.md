# 입양자 (Adopter) 도메인

## 개요

반려동물을 입양하고자 하는 사용자들의 기능을 관리하는 도메인입니다. 입양 신청, 후기 작성, 즐겨찾기, 신고 등의 기능을 제공합니다.

## 주요 기능

- 입양 신청 관리 (생성, 조회, 상태 추적)
- 브리더 후기 작성 및 관리
- 브리더 즐겨찾기 추가/제거
- 부적절한 브리더 신고
- 개인 프로필 관리

## API 엔드포인트

### 입양 신청

- `POST /api/adopter/application` - 입양 신청 생성
- `GET /api/adopter/applications` - 내 입양 신청 목록 조회
- `GET /api/adopter/application/:id` - 입양 신청 상세 조회

### 후기 관리

- `POST /api/adopter/review` - 브리더 후기 작성
- `GET /api/adopter/reviews` - 내가 작성한 후기 목록
- `PUT /api/adopter/review/:id` - 후기 수정
- `DELETE /api/adopter/review/:id` - 후기 삭제

### 즐겨찾기

- `POST /api/adopter/favorite` - 브리더 즐겨찾기 추가
- `DELETE /api/adopter/favorite/:breederId` - 즐겨찾기 제거
- `GET /api/adopter/favorites` - 즐겨찾기 목록 조회

### 신고

- `POST /api/adopter/report` - 브리더 신고
- `GET /api/adopter/reports` - 내 신고 내역 조회

### 프로필

- `GET /api/adopter/profile` - 프로필 조회
- `PATCH /api/adopter/profile` - 프로필 수정

## 비즈니스 로직

- 동일한 브리더의 동일한 반려동물에 대해 중복 신청 불가
- 입양 완료 후에만 후기 작성 가능
- 중복 즐겨찾기 방지
- 신고는 구체적인 사유와 함께 제출

## 데이터 흐름

1. 인증된 입양자가 요청 전송
2. 사용자 권한 및 데이터 유효성 검증
3. 중복성 및 비즈니스 규칙 검사
4. 데이터베이스 작업 수행
5. 관련 스키마 업데이트 (브리더 통계 등)

## 보안 고려사항

- 모든 API는 JWT 인증 필요
- 입양자 역할 권한 확인
- 입력 데이터 검증 및 sanitization
- 개인정보 보호 (프로필 조회 시)

## 의존성

- Adopter Schema (사용자 정보)
- Breeder Schema (브리더 정보 참조)
- JWT 인증 가드
- 데이터 검증 파이프
