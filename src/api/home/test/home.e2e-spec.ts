import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { AppModule } from '../../../app.module';

/**
 * Home API End-to-End 테스트
 * 홈 화면 관련 API 엔드포인트를 테스트합니다.
 * - 분양중인 아이들 조회
 * - 메인 배너 조회
 * - FAQ 조회
 */
describe('Home API (e2e)', () => {
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

        // 글로벌 프리픽스 설정
        app.setGlobalPrefix('api');

        // 글로벌 파이프 설정
        app.useGlobalPipes(
            new ValidationPipe({
                transform: true,
                whitelist: true,
                forbidNonWhitelisted: true,
            }),
        );

        await app.init();
    });

    afterAll(async () => {
        await app.close();
        await mongod.stop();
    });

    describe('GET /api/home/available-pets', () => {
        it('분양중인 아이들 조회 성공 (기본 limit)', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/home/available-pets')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('code');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('item');
            expect(response.body).toHaveProperty('message');
            expect(Array.isArray(response.body.item)).toBe(true);
        });

        it('분양중인 아이들 조회 성공 (커스텀 limit)', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/home/available-pets?limit=5')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.item)).toBe(true);
            // 실제 데이터가 있을 경우 최대 5개만 반환
            expect(response.body.item.length).toBeLessThanOrEqual(5);
        });

        it('limit 범위 초과 시 400 에러', async () => {
            await request(app.getHttpServer())
                .get('/api/home/available-pets?limit=100')
                .expect(400);
        });

        it('limit이 음수일 경우 400 에러', async () => {
            await request(app.getHttpServer())
                .get('/api/home/available-pets?limit=-1')
                .expect(400);
        });

        it('limit이 문자열일 경우 400 에러', async () => {
            await request(app.getHttpServer())
                .get('/api/home/available-pets?limit=invalid')
                .expect(400);
        });
    });

    describe('GET /api/home/banners', () => {
        it('메인 배너 목록 조회 성공', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/home/banners')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('code');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('item');
            expect(response.body).toHaveProperty('message');
            expect(Array.isArray(response.body.item)).toBe(true);
        });

        it('배너 응답 데이터 구조 검증', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/home/banners')
                .expect(200);

            if (response.body.item.length > 0) {
                const banner = response.body.item[0];
                expect(banner).toHaveProperty('imageUrl');
                expect(banner).toHaveProperty('linkType');
                expect(banner).toHaveProperty('linkUrl');
                expect(banner).toHaveProperty('order');
            }
        });
    });

    describe('GET /api/home/faqs', () => {
        it('FAQ 조회 성공 (기본 파라미터)', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/home/faqs')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('code');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('item');
            expect(response.body).toHaveProperty('message');
            expect(Array.isArray(response.body.item)).toBe(true);
        });

        it('FAQ 조회 성공 (userType: adopter)', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/home/faqs?userType=adopter')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.item)).toBe(true);
        });

        it('FAQ 조회 성공 (userType: breeder)', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/home/faqs?userType=breeder')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.item)).toBe(true);
        });

        it('FAQ 조회 성공 (userType: both)', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/home/faqs?userType=both')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.item)).toBe(true);
        });

        it('FAQ 조회 성공 (커스텀 limit)', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/home/faqs?limit=3')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.item)).toBe(true);
            expect(response.body.item.length).toBeLessThanOrEqual(3);
        });

        it('잘못된 userType으로 400 에러', async () => {
            await request(app.getHttpServer())
                .get('/api/home/faqs?userType=invalid')
                .expect(400);
        });

        it('limit 범위 초과 시 400 에러', async () => {
            await request(app.getHttpServer())
                .get('/api/home/faqs?limit=100')
                .expect(400);
        });

        it('limit이 음수일 경우 400 에러', async () => {
            await request(app.getHttpServer())
                .get('/api/home/faqs?limit=-1')
                .expect(400);
        });

        it('FAQ 응답 데이터 구조 검증', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/home/faqs')
                .expect(200);

            if (response.body.item.length > 0) {
                const faq = response.body.item[0];
                expect(faq).toHaveProperty('question');
                expect(faq).toHaveProperty('answer');
                expect(faq).toHaveProperty('category');
                expect(faq).toHaveProperty('order');
            }
        });
    });
});
