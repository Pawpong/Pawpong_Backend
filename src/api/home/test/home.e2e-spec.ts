import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { createTestingApp } from '../../../common/test/test-utils';

/**
 * Home API E2E Tests (Simple)
 * 홈 화면 관련 API 엔드포인트를 테스트합니다.
 * - 분양중인 아이들 조회
 * - 메인 배너 조회
 * - FAQ 조회
 */
describe('Home API E2E Tests (Simple)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        app = await createTestingApp();
    });

    afterAll(async () => {
        await app.close();
    });

    /**
     * 1. 분양중인 아이들 조회 테스트
     */
    describe('분양중인 아이들 조회', () => {
        it('GET /api/home/available-pets - 조회 성공 (기본 limit)', async () => {
            const response = await request(app.getHttpServer()).get('/api/home/available-pets').expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('code');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('message');
            expect(Array.isArray(response.body.data)).toBe(true);
            console.log('✅ 분양중인 아이들 조회 성공 (기본 limit)');
        });

        it('GET /api/home/available-pets?limit=5 - 커스텀 limit 적용', async () => {
            const response = await request(app.getHttpServer()).get('/api/home/available-pets?limit=5').expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeLessThanOrEqual(5);
            console.log('✅ 커스텀 limit 적용 성공');
        });

        it('GET /api/home/available-pets?limit=100 - limit 범위 초과 시 400 에러', async () => {
            const response = await request(app.getHttpServer()).get('/api/home/available-pets?limit=100');

            expect(response.status).toBe(400);
            console.log('✅ limit 범위 초과 에러 확인');
        });

        it('GET /api/home/available-pets?limit=-1 - limit 음수 시 400 에러', async () => {
            const response = await request(app.getHttpServer()).get('/api/home/available-pets?limit=-1');

            expect(response.status).toBe(400);
            console.log('✅ limit 음수 에러 확인');
        });

        it('GET /api/home/available-pets?limit=invalid - limit 문자열 처리 확인', async () => {
            const response = await request(app.getHttpServer()).get('/api/home/available-pets?limit=invalid');

            // ValidationPipe가 잘못된 타입을 무시하고 기본값으로 처리할 수 있음
            expect([200, 400]).toContain(response.status);

            if (response.status === 200) {
                console.log('⚠️  잘못된 limit이 기본값으로 처리됨 (ValidationPipe 동작)');
            } else {
                console.log('✅ limit 문자열 에러 확인');
            }
        });
    });

    /**
     * 2. 메인 배너 조회 테스트
     */
    describe('메인 배너 조회', () => {
        it('GET /api/home/banners - 배너 목록 조회 성공', async () => {
            const response = await request(app.getHttpServer()).get('/api/home/banners').expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('code');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('message');
            expect(Array.isArray(response.body.data)).toBe(true);
            console.log('✅ 메인 배너 목록 조회 성공');
        });

        it('GET /api/home/banners - 배너 응답 데이터 구조 검증', async () => {
            const response = await request(app.getHttpServer()).get('/api/home/banners').expect(200);

            if (response.body.data.length > 0) {
                const banner = response.body.data[0];
                expect(banner).toHaveProperty('imageUrl');
                expect(banner).toHaveProperty('linkType');
                expect(banner).toHaveProperty('linkUrl');
                expect(banner).toHaveProperty('order');
                console.log('✅ 배너 데이터 구조 검증 완료');
            } else {
                console.log('⚠️  배너 데이터가 없어서 구조 검증 스킵');
            }
        });
    });

    /**
     * 3. FAQ 조회 테스트
     */
    describe('FAQ 조회', () => {
        it('GET /api/home/faqs - FAQ 조회 성공 (기본 파라미터)', async () => {
            const response = await request(app.getHttpServer()).get('/api/home/faqs').expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('code');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('message');
            expect(Array.isArray(response.body.data)).toBe(true);
            console.log('✅ FAQ 조회 성공 (기본 파라미터)');
        });

        it('GET /api/home/faqs?userType=adopter - 입양자용 FAQ 조회', async () => {
            const response = await request(app.getHttpServer()).get('/api/home/faqs?userType=adopter').expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            console.log('✅ 입양자용 FAQ 조회 성공');
        });

        it('GET /api/home/faqs?userType=breeder - 브리더용 FAQ 조회', async () => {
            const response = await request(app.getHttpServer()).get('/api/home/faqs?userType=breeder').expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            console.log('✅ 브리더용 FAQ 조회 성공');
        });

        it('GET /api/home/faqs?userType=both - 공통 FAQ 조회', async () => {
            const response = await request(app.getHttpServer()).get('/api/home/faqs?userType=both').expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            console.log('✅ 공통 FAQ 조회 성공');
        });

        it('GET /api/home/faqs?limit=3 - 커스텀 limit 적용', async () => {
            const response = await request(app.getHttpServer()).get('/api/home/faqs?limit=3').expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeLessThanOrEqual(3);
            console.log('✅ FAQ 커스텀 limit 적용 성공');
        });

        it('GET /api/home/faqs?userType=invalid - 잘못된 userType으로 400 에러', async () => {
            const response = await request(app.getHttpServer()).get('/api/home/faqs?userType=invalid');

            expect(response.status).toBe(400);
            console.log('✅ 잘못된 userType 에러 확인');
        });

        it('GET /api/home/faqs?limit=100 - limit 범위 초과 시 400 에러', async () => {
            const response = await request(app.getHttpServer()).get('/api/home/faqs?limit=100');

            expect(response.status).toBe(400);
            console.log('✅ FAQ limit 범위 초과 에러 확인');
        });

        it('GET /api/home/faqs?limit=-1 - limit 음수 시 400 에러', async () => {
            const response = await request(app.getHttpServer()).get('/api/home/faqs?limit=-1');

            expect(response.status).toBe(400);
            console.log('✅ FAQ limit 음수 에러 확인');
        });

        it('GET /api/home/faqs - FAQ 응답 데이터 구조 검증', async () => {
            const response = await request(app.getHttpServer()).get('/api/home/faqs').expect(200);

            if (response.body.data.length > 0) {
                const faq = response.body.data[0];
                expect(faq).toHaveProperty('question');
                expect(faq).toHaveProperty('answer');
                expect(faq).toHaveProperty('category');
                expect(faq).toHaveProperty('order');
                console.log('✅ FAQ 데이터 구조 검증 완료');
            } else {
                console.log('⚠️  FAQ 데이터가 없어서 구조 검증 스킵');
            }
        });
    });

    /**
     * 4. 응답 형식 검증 테스트
     */
    describe('응답 형식 검증', () => {
        it('표준 API 응답 형식 확인', async () => {
            const response = await request(app.getHttpServer()).get('/api/home/available-pets').expect(200);

            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('code');
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body.success).toBe(true);
            expect(response.body.code).toBe(200);
            console.log('✅ 표준 API 응답 형식 검증 완료');
        });

        it('타임스탬프 형식 확인', async () => {
            const response = await request(app.getHttpServer()).get('/api/home/banners').expect(200);

            const timestamp = response.body.timestamp;
            expect(timestamp).toBeDefined();
            expect(new Date(timestamp).toString()).not.toBe('Invalid Date');
            console.log('✅ 타임스탬프 형식 검증 완료');
        });
    });
});
