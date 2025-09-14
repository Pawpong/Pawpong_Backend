# 브리더 관리 (Breeder Management) 도메인

## 개요

인증된 브리더들이 자신의 계정과 비즈니스를 관리할 수 있는 기능을 제공하는 도메인입니다. 프로필 관리, 반려동물 등록, 입양 신청 처리 등을 담당합니다.

## 주요 기능

- 브리더 인증 신청
- 프로필 및 시설 정보 관리
- 부모견/부모묘 등록 관리
- 분양 가능한 반려동물 등록
- 입양 신청 접수 및 처리
- 대시보드 통계 조회

## API 엔드포인트

### 인증 관리

- `POST /api/breeder/verification` - 브리더 인증 신청
- `PUT /api/breeder/verification` - 인증 정보 업데이트
- `GET /api/breeder/verification/status` - 인증 상태 조회

### 프로필 관리

- `GET /api/breeder/profile` - 프로필 조회
- `PUT /api/breeder/profile` - 프로필 수정
- `POST /api/breeder/profile/photos` - 프로필 사진 업로드

### 반려동물 관리

- `POST /api/breeder/pet` - 반려동물 등록
- `GET /api/breeder/pets` - 내 반려동물 목록
- `PUT /api/breeder/pet/:id` - 반려동물 정보 수정
- `DELETE /api/breeder/pet/:id` - 반려동물 삭제
- `PUT /api/breeder/pet/:id/status` - 분양 상태 변경

### 입양 신청 관리

- `GET /api/breeder/applications` - 받은 입양 신청 목록
- `GET /api/breeder/application/:id` - 입양 신청 상세 조회
- `PUT /api/breeder/application/:id/status` - 신청 상태 변경
- `POST /api/breeder/application/:id/message` - 신청자에게 메시지 전송

### 대시보드

- `GET /api/breeder/dashboard` - 대시보드 통계
- `GET /api/breeder/dashboard/recent` - 최근 활동 내역
- `GET /api/breeder/dashboard/performance` - 성과 분석

## 브리더 인증 프로세스

1. 브리더가 인증 신청서 제출
2. 필수 서류 업로드 (사업자등록증, 시설 사진 등)
3. 관리자 검토
4. 승인/거절 결과 통보
5. 승인 시 브리더 기능 활성화

## 반려동물 등록 규칙

- 부모견/부모묘 정보 필수 입력
- 건강 검진 기록 첨부 권장
- 백신 접종 기록 필수
- 고화질 사진 최소 3장 등록

## 입양 신청 처리 워크플로우

1. 입양자가 신청서 제출
2. 브리더가 신청 내역 확인
3. 브리더가 승인/거절/보류 결정
4. 승인 시 입양자와 직접 연락 진행
5. 입양 완료 후 상태 업데이트

## 접근 권한

- 모든 API는 브리더 역할 인증 필요
- 인증되지 않은 브리더는 제한된 기능만 사용 가능
- 정지된 브리더는 읽기 전용 접근

## 데이터 무결성

- 반려동물 중복 등록 방지
- 입양 완료된 반려동물 자동 상태 변경
- 통계 정보 실시간 업데이트
- 신청 상태 변경 히스토리 추적

## 의존성

- Breeder Schema (브리더 정보)
- Adopter Schema (입양자 정보 참조)
- JWT 인증 가드
- 파일 업로드 모듈
- 알림 서비스

## 확장 계획

- 자동 매칭 시스템
- 입양 계약서 생성
- 결제 에스크로 연동
- 모바일 알림 푸시
- 화상 통화 예약 시스템
