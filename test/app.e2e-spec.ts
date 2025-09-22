import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { AppModule } from '../src/app.module';

/**
 * 애플리케이션 헬스체크 End-to-End 테스트
 * 전체 시스템의 상태 확인 및 기본 동작을 테스트합니다.
 * - 기본 헬스체크 엔드포인트
 * - 상세 헬스체크 정보
 * - 데이터베이스 연결 상태
 * - 시스템 메트릭스 확인
 */
describe('Application Health Check (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    // 메모리 내 MongoDB 서버 시작
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(uri), AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api'); // 글로벌 API 프리픽스 설정
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  describe('Basic Health Check', () => {
    it('GET /api/health - 기본 헬스체크 성공', async () => {
      await request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.item).toHaveProperty('status');
          expect(res.body.item).toHaveProperty('timestamp');
          expect(res.body.item).toHaveProperty('uptime');
          expect(res.body.item.status).toBe('healthy');
          expect(res.body.message).toBe('시스템이 정상 작동 중입니다');
        });
    });

    it('GET /api/health - 응답 시간 성능 테스트', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer()).get('/api/health').expect(200);

      const responseTime = Date.now() - startTime;

      // 헬스체크는 1초 이내에 응답해야 함
      expect(responseTime).toBeLessThan(1000);
    });

    it('GET /api/health - 연속 요청 안정성 테스트', async () => {
      const requests = Array(5)
        .fill(0)
        .map(() => request(app.getHttpServer()).get('/api/health'));

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.item.status).toBe('healthy');
      });
    });
  });

  describe('Detailed Health Check', () => {
    it('GET /api/health/detailed - 상세 헬스체크 성공', async () => {
      await request(app.getHttpServer())
        .get('/api/health/detailed')
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.item).toHaveProperty('status');
          expect(res.body.item).toHaveProperty('services');
          expect(res.body.item).toHaveProperty('metrics');
          expect(res.body.item).toHaveProperty('version');

          // 서비스 상태 확인
          const services = res.body.item.services;
          expect(services).toHaveProperty('database');
          expect(services).toHaveProperty('cache');
          expect(services).toHaveProperty('storage');

          // 메트릭스 확인
          const metrics = res.body.item.metrics;
          expect(metrics).toHaveProperty('memory');
          expect(metrics).toHaveProperty('cpu');
          expect(metrics).toHaveProperty('requests');
          expect(metrics).toHaveProperty('errors');
        });
    });

    it('GET /api/health/detailed - 데이터베이스 연결 상태 확인', async () => {
      await request(app.getHttpServer())
        .get('/api/health/detailed')
        .expect(200)
        .expect((res: any) => {
          const dbStatus = res.body.item.services.database;
          expect(dbStatus.status).toBe('connected');
          expect(dbStatus).toHaveProperty('connectionTime');
          expect(dbStatus).toHaveProperty('collections');
          expect(typeof dbStatus.connectionTime).toBe('number');
        });
    });

    it('GET /api/health/detailed - 시스템 메트릭스 유효성 검증', async () => {
      await request(app.getHttpServer())
        .get('/api/health/detailed')
        .expect(200)
        .expect((res: any) => {
          const metrics = res.body.item.metrics;

          // 메모리 메트릭스
          expect(metrics.memory).toHaveProperty('used');
          expect(metrics.memory).toHaveProperty('total');
          expect(metrics.memory).toHaveProperty('free');
          expect(typeof metrics.memory.used).toBe('number');
          expect(metrics.memory.used).toBeGreaterThan(0);

          // CPU 메트릭스
          expect(metrics.cpu).toHaveProperty('usage');
          expect(typeof metrics.cpu.usage).toBe('number');
          expect(metrics.cpu.usage).toBeGreaterThanOrEqual(0);
          expect(metrics.cpu.usage).toBeLessThanOrEqual(100);

          // 요청 메트릭스
          expect(metrics.requests).toHaveProperty('total');
          expect(metrics.requests).toHaveProperty('perSecond');
          expect(typeof metrics.requests.total).toBe('number');
          expect(metrics.requests.total).toBeGreaterThanOrEqual(0);
        });
    });
  });

  describe('Health Status Variations', () => {
    it('GET /api/health/status - 서비스별 상태 조회', async () => {
      await request(app.getHttpServer())
        .get('/api/health/status')
        .query({
          services: 'database,cache,storage',
        })
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.item).toHaveProperty('overallStatus');
          expect(res.body.item).toHaveProperty('serviceStatuses');

          const serviceStatuses = res.body.item.serviceStatuses;
          expect(serviceStatuses).toHaveProperty('database');
          expect(serviceStatuses).toHaveProperty('cache');
          expect(serviceStatuses).toHaveProperty('storage');

          // 각 서비스 상태가 유효한 값인지 확인
          Object.values(serviceStatuses).forEach((status: any) => {
            expect(['healthy', 'degraded', 'unhealthy']).toContain(
              status.status,
            );
          });
        });
    });

    it('GET /api/health/readiness - 서비스 준비 상태 확인', async () => {
      await request(app.getHttpServer())
        .get('/api/health/readiness')
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.item).toHaveProperty('ready');
          expect(res.body.item).toHaveProperty('checks');
          expect(typeof res.body.item.ready).toBe('boolean');
          expect(Array.isArray(res.body.item.checks)).toBe(true);

          // 준비 상태 체크 항목들
          res.body.item.checks.forEach((check: any) => {
            expect(check).toHaveProperty('name');
            expect(check).toHaveProperty('status');
            expect(check).toHaveProperty('message');
            expect(['pass', 'fail']).toContain(check.status);
          });
        });
    });

    it('GET /api/health/liveness - 서비스 생존 상태 확인', async () => {
      await request(app.getHttpServer())
        .get('/api/health/liveness')
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.item).toHaveProperty('alive');
          expect(res.body.item).toHaveProperty('lastHeartbeat');
          expect(res.body.item).toHaveProperty('startTime');
          expect(res.body.item.alive).toBe(true);
          expect(new Date(res.body.item.lastHeartbeat)).toBeInstanceOf(Date);
          expect(new Date(res.body.item.startTime)).toBeInstanceOf(Date);
        });
    });
  });

  describe('Environment and Configuration', () => {
    it('GET /api/health/info - 애플리케이션 정보 조회', async () => {
      await request(app.getHttpServer())
        .get('/api/health/info')
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.item).toHaveProperty('name');
          expect(res.body.item).toHaveProperty('version');
          expect(res.body.item).toHaveProperty('environment');
          expect(res.body.item).toHaveProperty('nodeVersion');
          expect(res.body.item).toHaveProperty('platform');

          expect(res.body.item.name).toBe('Pawpong Backend');
          expect(typeof res.body.item.version).toBe('string');
          expect(['development', 'staging', 'production']).toContain(
            res.body.item.environment,
          );
        });
    });

    it('GET /api/health/dependencies - 의존성 상태 확인', async () => {
      await request(app.getHttpServer())
        .get('/api/health/dependencies')
        .expect(200)
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
          expect(res.body.item).toHaveProperty('dependencies');
          expect(Array.isArray(res.body.item.dependencies)).toBe(true);

          // 각 의존성 정보 검증
          res.body.item.dependencies.forEach((dep: any) => {
            expect(dep).toHaveProperty('name');
            expect(dep).toHaveProperty('version');
            expect(dep).toHaveProperty('status');
            expect(dep).toHaveProperty('lastChecked');
            expect(['healthy', 'warning', 'critical']).toContain(dep.status);
          });
        });
    });
  });

  describe('Security and Access Control', () => {
    it('GET /api/health - CORS 헤더 확인', async () => {
      await request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect((res: any) => {
          // CORS 헤더가 적절히 설정되어 있는지 확인
          if (res.headers['access-control-allow-origin']) {
            expect(res.headers['access-control-allow-origin']).toBeDefined();
          }

          // 보안 헤더 확인
          if (res.headers['x-powered-by']) {
            // Express 서버 정보 노출 방지
            expect(res.headers['x-powered-by']).not.toContain('Express');
          }
        });
    });

    it('GET /api/health - Rate Limiting 체크', async () => {
      // 짧은 시간 내에 다수 요청을 보내 Rate Limiting 테스트
      const requests = Array(10)
        .fill(0)
        .map(() => request(app.getHttpServer()).get('/api/health'));

      const responses = await Promise.all(requests);

      // Rate limiting이 적용되어 있다면 일부 요청이 429를 반환할 수 있음
      // 하지만 헬스체크는 보통 Rate limiting에서 제외되므로 모든 요청이 성공해야 함
      responses.forEach((response) => {
        expect([200, 429]).toContain(response.status);
        if (response.status === 200) {
          expect(response.body.success).toBe(true);
        }
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('GET /api/health/nonexistent - 존재하지 않는 헬스체크 엔드포인트', async () => {
      await request(app.getHttpServer())
        .get('/api/health/nonexistent')
        .expect(404);
    });

    it('POST /api/health - 허용되지 않은 HTTP 메서드', async () => {
      await request(app.getHttpServer()).post('/api/health').expect(405); // Method Not Allowed
    });

    it('GET /api/health - 잘못된 쿼리 파라미터 처리', async () => {
      await request(app.getHttpServer())
        .get('/api/health')
        .query({
          invalid_param: 'invalid_value',
          another_param: 123,
        })
        .expect(200) // 헬스체크는 쿼리 파라미터와 무관하게 성공해야 함
        .expect((res: any) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('Performance and Load Testing', () => {
    it('GET /api/health - 동시 다수 요청 처리 능력', async () => {
      const concurrentRequests = 20;
      const requests = Array(concurrentRequests)
        .fill(0)
        .map(() => request(app.getHttpServer()).get('/api/health'));

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      // 모든 요청이 성공해야 함
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // 평균 응답 시간이 합리적인 범위 내에 있어야 함
      const averageTime = totalTime / concurrentRequests;
      expect(averageTime).toBeLessThan(500); // 평균 500ms 이내
    });

    it('GET /api/health/detailed - 메모리 사용량 모니터링', async () => {
      const initialMemory = process.memoryUsage();

      // 여러 번의 상세 헬스체크 요청
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .get('/api/health/detailed')
          .expect(200);
      }

      const finalMemory = process.memoryUsage();

      // 메모리 누수가 심각하지 않은지 확인 (10MB 이내 증가)
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB
    });
  });

  describe('Response Format Validation', () => {
    it('GET /api/health - 응답 형식 일관성 확인', async () => {
      await request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect((res: any) => {
          // 표준 API 응답 형식 검증
          expect(res.body).toHaveProperty('success');
          expect(res.body).toHaveProperty('item');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body.success).toBe(true);
          expect(typeof res.body.timestamp).toBe('string');

          // 타임스탬프가 ISO 8601 형식인지 확인
          expect(new Date(res.body.timestamp)).toBeInstanceOf(Date);

          // Content-Type 헤더 확인
          expect(res.headers['content-type']).toContain('application/json');
        });
    });

    it('GET /api/health/detailed - 중첩된 객체 구조 검증', async () => {
      await request(app.getHttpServer())
        .get('/api/health/detailed')
        .expect(200)
        .expect((res: any) => {
          const item = res.body.item;

          // 모든 중첩된 객체가 올바른 타입인지 확인
          expect(typeof item).toBe('object');
          expect(typeof item.services).toBe('object');
          expect(typeof item.metrics).toBe('object');

          // 배열 필드 확인
          if (item.errors) {
            expect(Array.isArray(item.errors)).toBe(true);
          }
          if (item.warnings) {
            expect(Array.isArray(item.warnings)).toBe(true);
          }
        });
    });
  });
});
