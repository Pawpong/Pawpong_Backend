import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { AppModule } from '../../../app.module';

/**
 * Health API End-to-End 테스트
 * 시스템 헬스체크 API 엔드포인트를 테스트합니다.
 */
describe('Health API (e2e)', () => {
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

    describe('GET /api/health', () => {
        it('헬스체크 성공', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/health')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('code');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('item');
            expect(response.body).toHaveProperty('message');
        });

        it('헬스체크 응답 데이터 구조 검증', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/health')
                .expect(200);

            const healthData = response.body.item;
            expect(healthData).toHaveProperty('status', 'healthy');
            expect(healthData).toHaveProperty('timestamp');
            expect(healthData).toHaveProperty('service', 'Pawpong Backend');
            expect(healthData).toHaveProperty('version', '1.0.0-MVP');
            expect(healthData).toHaveProperty('environment');
            expect(healthData).toHaveProperty('uptime');
        });

        it('헬스체크 uptime이 숫자인지 확인', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/health')
                .expect(200);

            const healthData = response.body.item;
            expect(typeof healthData.uptime).toBe('number');
            expect(healthData.uptime).toBeGreaterThanOrEqual(0);
        });

        it('헬스체크 timestamp가 유효한 ISO 형식인지 확인', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/health')
                .expect(200);

            const healthData = response.body.item;
            const timestamp = new Date(healthData.timestamp);
            expect(timestamp.toString()).not.toBe('Invalid Date');
        });

        it('헬스체크는 인증 없이 접근 가능', async () => {
            // Authorization 헤더 없이 요청
            await request(app.getHttpServer())
                .get('/api/health')
                .expect(200);
        });
    });
});
