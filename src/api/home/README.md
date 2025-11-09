# Home 도메인

## 개요

홈 화면에서 표시되는 주요 콘텐츠를 제공하는 도메인입니다. 분양 가능한 반려동물, 메인 배너, FAQ 정보를 조회할 수 있습니다.

## 주요 기능

### 1. 분양중인 아이들 조회

- 현재 분양 가능한 반려동물 목록 조회
- limit 파라미터로 조회 개수 제한 (기본값: 10, 최대: 50)

### 2. 메인 배너 조회

- 홈 화면에 표시될 배너 이미지 및 링크 정보 제공
- 배너 순서(order)에 따라 정렬

### 3. FAQ 조회

- 자주 묻는 질문 목록 조회
- userType 필터링 지원 (adopter, breeder, both)
- limit 파라미터로 조회 개수 제한

## API 엔드포인트

### 분양중인 아이들

- `GET /api/home/available-pets` - 분양 가능한 반려동물 조회
- Query Parameters:
  - `limit`: 조회 개수 (기본값: 10, 최대: 50)

### 메인 배너

- `GET /api/home/banners` - 메인 배너 목록 조회

### FAQ

- `GET /api/home/faqs` - FAQ 목록 조회
- Query Parameters:
  - `userType`: 사용자 타입 (adopter, breeder, both)
  - `limit`: 조회 개수 (기본값: 10, 최대: 50)

## 응답 형식

### 분양중인 아이들 응답

```json
{
  "success": true,
  "code": 200,
  "data": [
    {
      "petId": "string",
      "name": "string",
      "breed": "string",
      "age": "number",
      "gender": "string",
      "price": "number",
      "photos": ["string"],
      "breederName": "string",
      "location": "string"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 배너 응답

```json
{
  "success": true,
  "code": 200,
  "data": [
    {
      "imageUrl": "string",
      "linkType": "internal | external",
      "linkUrl": "string",
      "order": "number"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### FAQ 응답

```json
{
  "success": true,
  "code": 200,
  "data": [
    {
      "question": "string",
      "answer": "string",
      "category": "string",
      "userType": "adopter | breeder | both",
      "order": "number"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 접근 권한

- 모든 API는 인증 불필요 (공개 API)

## 관련 스키마

- AvailablePet Schema: 분양 가능한 반려동물 정보
- Banner Schema: 메인 배너 정보
- FAQ Schema: 자주 묻는 질문 정보

## 연관 모듈

- Breeder: 분양 가능한 반려동물 정보 참조
- Admin: 배너 및 FAQ 관리

## 테스트 실행

```bash
yarn test:e2e src/api/home/test/home.e2e-spec.ts
```
