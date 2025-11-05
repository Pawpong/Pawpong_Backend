import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { AppModule } from '../../../app.module';

/**
 * District API End-to-End 테스트
 * 지역 데이터 조회 API 엔드포인트를 테스트합니다.
 */
describe('District API (e2e)', () => {
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

    describe('GET /api/districts', () => {
        it('모든 지역 데이터 조회 성공', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/districts')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('code');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('item');
            expect(Array.isArray(response.body.item)).toBe(true);
        });

        it('지역 데이터 구조 검증', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/districts')
                .expect(200);

            if (response.body.item.length > 0) {
                const district = response.body.item[0];
                expect(district).toHaveProperty('province');
                expect(district).toHaveProperty('cities');
                expect(Array.isArray(district.cities)).toBe(true);
            }
        });

        it('지역 데이터는 인증 없이 접근 가능', async () => {
            // Authorization 헤더 없이 요청
            await request(app.getHttpServer())
                .get('/api/districts')
                .expect(200);
        });

        it('지역 데이터에 서울특별시 포함 여부 확인', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/districts')
                .expect(200);

            const hasSeoul = response.body.item.some(
                (district: any) => district.province === '서울특별시'
            );

            // 데이터가 있다면 서울이 포함되어야 함
            if (response.body.item.length > 0) {
                expect(hasSeoul).toBe(true);
            }
        });

        it('각 지역의 cities 배열이 비어있지 않은지 확인', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/districts')
                .expect(200);

            if (response.body.item.length > 0) {
                const allHaveCities = response.body.item.every(
                    (district: any) => Array.isArray(district.cities) && district.cities.length > 0
                );
                expect(allHaveCities).toBe(true);
            }
        });
    });
});
