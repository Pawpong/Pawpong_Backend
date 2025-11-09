import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { createTestingApp } from '../../../common/test/test-utils';

/**
 * Health API E2E Tests (Simple)
 * 시스템 헬스체크 API 엔드포인트를 테스트합니다.
 */
describe('Health API E2E Tests (Simple)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        app = await createTestingApp();
    });

    afterAll(async () => {
        await app.close();
    });

    /**
     * 1. 헬스체크 테스트
     */
    describe('헬스체크', () => {
        it('GET /api/health - 헬스체크 성공', async () => {
            const response = await request(app.getHttpServer()).get('/api/health').expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('code');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('message');
            console.log('✅ 헬스체크 성공');
        });

        it('GET /api/health - 응답 데이터 구조 검증', async () => {
            const response = await request(app.getHttpServer()).get('/api/health').expect(200);

            const healthData = response.body.data;
            expect(healthData).toHaveProperty('status', 'healthy');
            expect(healthData).toHaveProperty('timestamp');
            expect(healthData).toHaveProperty('service', 'Pawpong Backend');
            expect(healthData).toHaveProperty('version', '1.0.0-MVP');
            expect(healthData).toHaveProperty('environment');
            expect(healthData).toHaveProperty('uptime');
            console.log('✅ 헬스체크 응답 데이터 구조 검증 완료');
        });

        it('GET /api/health - uptime이 숫자인지 확인', async () => {
            const response = await request(app.getHttpServer()).get('/api/health').expect(200);

            const healthData = response.body.data;
            expect(typeof healthData.uptime).toBe('number');
            expect(healthData.uptime).toBeGreaterThanOrEqual(0);
            console.log('✅ uptime 값 검증 완료');
        });

        it('GET /api/health - timestamp가 유효한 ISO 형식인지 확인', async () => {
            const response = await request(app.getHttpServer()).get('/api/health').expect(200);

            const healthData = response.body.data;
            const timestamp = new Date(healthData.timestamp);
            expect(timestamp.toString()).not.toBe('Invalid Date');
            console.log('✅ timestamp 형식 검증 완료');
        });

        it('GET /api/health - 인증 없이 접근 가능', async () => {
            // Authorization 헤더 없이 요청
            const response = await request(app.getHttpServer()).get('/api/health').expect(200);

            expect(response.body.success).toBe(true);
            console.log('✅ 인증 없이 접근 가능 확인');
        });
    });

    /**
     * 2. 응답 형식 검증 테스트
     */
    describe('응답 형식 검증', () => {
        it('표준 API 응답 형식 확인', async () => {
            const response = await request(app.getHttpServer()).get('/api/health').expect(200);

            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('code');
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body.success).toBe(true);
            expect(response.body.code).toBe(200);
            console.log('✅ 표준 API 응답 형식 검증 완료');
        });

        it('타임스탬프 형식 확인', async () => {
            const response = await request(app.getHttpServer()).get('/api/health').expect(200);

            const timestamp = response.body.timestamp;
            expect(timestamp).toBeDefined();
            expect(new Date(timestamp).toString()).not.toBe('Invalid Date');
            console.log('✅ 타임스탬프 형식 검증 완료');
        });
    });
});
