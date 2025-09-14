# 헬스체크 (Health) 도메인

## 개요

시스템 상태 모니터링과 헬스체크 기능을 제공하는 도메인입니다. 서버, 데이터베이스, 외부 서비스의 상태를 확인하고 시스템의 전반적인 건강 상태를 보고합니다.

## 주요 기능

- 기본 서버 상태 확인
- 데이터베이스 연결 상태 확인
- 외부 서비스 의존성 확인
- 시스템 리소스 사용량 모니터링
- 서비스 가용성 체크

## API 엔드포인트

### 기본 헬스체크

- `GET /api/health` - 기본 서버 상태 확인
- `GET /api/health/detailed` - 상세 헬스체크 정보
- `GET /api/health/ready` - 서비스 준비 상태 확인
- `GET /api/health/live` - 서버 살아있음 확인

### 의존성 확인

- `GET /api/health/database` - 데이터베이스 연결 상태
- `GET /api/health/redis` - Redis 캐시 서버 상태 (추후)
- `GET /api/health/external` - 외부 서비스 연결 상태

## 응답 형식

```json
{
  "status": "ok" | "error" | "warning",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123456789,
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "database": {
      "status": "ok",
      "responseTime": "25ms",
      "details": "MongoDB connection healthy"
    },
    "memory": {
      "status": "ok",
      "used": "256MB",
      "free": "512MB",
      "usage": "33%"
    }
  }
}
```

## 상태 코드

- **OK (200)**: 모든 시스템이 정상 작동
- **Warning (200)**: 일부 비필수 서비스에 문제 있음
- **Error (503)**: 핵심 시스템에 장애 발생

## 모니터링 항목

- 서버 응답 시간
- 메모리 사용량
- CPU 사용률
- 디스크 사용량
- 활성 연결 수
- 데이터베이스 응답 시간

## 알림 임계값

- CPU 사용률 85% 초과 시 경고
- 메모리 사용량 90% 초과 시 경고
- 디스크 사용량 95% 초과 시 경고
- 데이터베이스 응답 시간 1초 초과 시 경고

## 로그 기록

- 헬스체크 요청 및 결과 로깅
- 시스템 상태 변화 추적
- 장애 발생 및 복구 기록
- 성능 지표 변화 모니터링

## 접근 권한

- 기본 헬스체크는 인증 불필요
- 상세 정보는 관리자 권한 필요
- 내부 모니터링 시스템 전용 엔드포인트

## 보안 고려사항

- 민감한 시스템 정보 노출 방지
- 서버 내부 구조 정보 제한
- 과도한 헬스체크 요청 제한
- DDoS 공격 대비 Rate limiting

## 외부 도구 연동

- Kubernetes liveness/readiness probe
- Load balancer 헬스체크
- 모니터링 도구 (Prometheus, Grafana)
- 알림 시스템 (Slack, 이메일)

## 의존성

- MongoDB 연결 모듈
- 시스템 리소스 모니터링 라이브러리
- 외부 서비스 연결 테스트

## 확장 계획

- 실시간 메트릭 스트리밍
- 사용자 정의 헬스체크 규칙
- 자동 복구 메커니즘
- 성능 트렌드 분석
- 예측적 장애 감지
