# Upload Module

## 개요

파일 업로드를 담당하는 모듈입니다. Google Cloud Storage (GCS)와 연동하여 이미지 파일을 업로드하고 CDN URL을 반환합니다.

## 주요 기능

### 1. 프로필 이미지 업로드

- 브리더/입양자 프로필 이미지 업로드 (`POST /api/upload/profile`)
- 로그인 시 자동으로 DB에 저장
- 최대 5MB

### 2. 브리더 대표 사진 업로드

- 브리더 프로필 대표 사진 업로드 (`POST /api/upload/breeder/representative`)
- 최대 3장 제한
- 로그인 필수

### 3. 반려동물 사진 업로드

- 분양 가능 반려동물 사진 (`POST /api/upload/pet`)
- 부모견/부모묘 사진 (`POST /api/upload/parent-pet`)
- 다중 파일 업로드 지원

### 4. 인증 서류 업로드

- 브리더 인증 서류 업로드 (`POST /api/upload/verification`)
- 사업자등록증, 혈통서 등
- PDF, 이미지 파일 지원

### 5. 파일 삭제

- 업로드된 파일 삭제 (`DELETE /api/upload/:filename`)
- 권한 확인 (본인 파일만 삭제 가능)

## 파일 구조

```
upload/
├── upload.controller.ts        # API 엔드포인트
├── upload.module.ts             # 모듈 정의
└── dto/
    └── response/
        └── upload-response.dto.ts
```

## 에러 처리

- 400 Bad Request: 잘못된 파일 형식, 크기 초과
- 401 Unauthorized: 인증 필요
- 403 Forbidden: 파일 접근 권한 없음
- 404 Not Found: 파일 없음

## 연관 모듈

- StorageService: GCS 연동 서비스
- Breeder: 브리더 프로필 이미지 저장
- Adopter: 입양자 프로필 이미지 저장

## 개선 사항

- [ ] 이미지 자동 리사이징
- [ ] WebP 자동 변환
- [ ] 바이러스 스캔 연동

## 테스트 실행

```bash
yarn test:e2e src/api/upload/test/upload.e2e-spec.ts
```
