# 관리자 (Admin) 도메인

## 개요

플랫폼 전체를 관리하고 운영하는 관리자 기능을 제공하는 도메인입니다. 브리더 승인, 사용자 관리, 신고 처리, 통계 조회 등 시스템 관리 업무를 담당합니다.

## 주요 기능

- 브리더 인증 승인/거절 처리
- 사용자 계정 상태 관리 (정지, 복원)
- 신고 내역 조회 및 처리
- 부적절한 후기 삭제
- 플랫폼 통계 및 분석 데이터 조회
- 관리자 활동 로그 추적

## API 엔드포인트

### 관리자 계정

- `GET /api/admin/profile` - 관리자 프로필 조회
- `PUT /api/admin/profile` - 프로필 수정
- `GET /api/admin/activities` - 관리 활동 로그 조회

### 브리더 인증 관리

- `GET /api/admin/verification/pending` - 승인 대기 브리더 목록
- `PUT /api/admin/verification/:breederId` - 브리더 승인/거절
- `GET /api/admin/verification/history` - 인증 처리 이력

### 사용자 관리

- `GET /api/admin/users` - 전체 사용자 목록 (필터링 지원)
- `PUT /api/admin/users/:userId/status` - 사용자 상태 변경
- `GET /api/admin/users/:userId/detail` - 사용자 상세 정보
- `GET /api/admin/users/statistics` - 사용자 통계

### 입양 신청 모니터링

- `GET /api/admin/applications` - 입양 신청 현황 모니터링
- `GET /api/admin/applications/statistics` - 입양 통계 분석
- `PUT /api/admin/applications/:applicationId/intervention` - 관리자 개입

### 신고 관리

- `GET /api/admin/reports` - 신고 내역 조회
- `PUT /api/admin/reports/:breederId/:reportId` - 신고 처리
- `GET /api/admin/reports/statistics` - 신고 통계

### 후기 관리

- `GET /api/admin/reviews/reported` - 신고된 후기 목록
- `DELETE /api/admin/reviews/:breederId/:reviewId` - 부적절한 후기 삭제
- `PUT /api/admin/reviews/:reviewId/visibility` - 후기 노출 상태 변경

### 통계 및 분석

- `GET /api/admin/stats` - 전체 플랫폼 통계
- `GET /api/admin/stats/dashboard` - 관리자 대시보드 데이터
- `GET /api/admin/stats/trends` - 트렌드 분석 데이터

## 관리자 권한 레벨

- **Super Admin**: 모든 기능 접근 가능
- **Manager**: 사용자 관리 및 신고 처리
- **Moderator**: 컨텐츠 관리 및 후기 검토

## 브리더 승인 기준

- 사업자 등록증 또는 개인사업자 신고 확인
- 시설 환경 사진 검토
- 반려동물 건강 관리 능력 확인
- 과거 신고 이력 검토
- 필요 시 현장 방문 검사

## 사용자 제재 정책

- 1차 경고: 7일 기능 제한
- 2차 경고: 30일 계정 정지
- 3차 경고: 영구 계정 정지
- 중대한 위반 시 즉시 영구 정지

## 신고 처리 프로세스

1. 신고 접수 및 자동 분류
2. 관리자 검토 및 우선순위 설정
3. 증거 자료 확인 및 조사
4. 처리 결정 (경고, 정지, 기각)
5. 신고자 및 피신고자에게 결과 통보

## 통계 데이터 항목

- 사용자 증가 추이 (입양자/브리더)
- 입양 성사율 및 지역별 분포
- 인기 반려동물 품종 순위
- 신고 유형별 발생 현황
- 브리더 성과 지표 분석

## 보안 및 감사

- 모든 관리 활동은 로그로 기록
- 중요한 작업은 2차 인증 필요
- 관리자 권한 변경 시 알림 발송
- 정기적인 권한 검토 수행

## 접근 권한

- 관리자 역할 인증 필수
- 권한 레벨별 기능 제한
- IP 화이트리스트 적용 (선택사항)
- 세션 타임아웃 관리

## 의존성

- Admin Schema (관리자 정보)
- 모든 사용자 Schema (Adopter, Breeder)
- SystemStats Schema (통계 데이터)
- JWT 관리자 인증 가드
- 알림 서비스

## 테스트 실행

```bash
yarn test:e2e src/api/admin/test/admin.e2e-spec.ts
```
