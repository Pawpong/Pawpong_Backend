import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { AppModule } from '../../../app.module';

/**
 * Breed API End-to-End 테스트
 * 품종 데이터 조회 API 엔드포인트를 테스트합니다.
 */
describe('Breed API (e2e)', () => {
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

    describe('GET /api/breeds/:petType', () => {
        it('강아지 품종 목록 조회 성공', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeds/dog')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('code');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('item');
        });

        it('고양이 품종 목록 조회 성공', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeds/cat')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('code');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('item');
        });

        it('잘못된 petType으로 400 에러', async () => {
            await request(app.getHttpServer())
                .get('/api/breeds/bird')
                .expect(400);
        });

        it('잘못된 petType으로 400 에러 (숫자)', async () => {
            await request(app.getHttpServer())
                .get('/api/breeds/123')
                .expect(400);
        });

        it('잘못된 petType으로 400 에러 (특수문자)', async () => {
            await request(app.getHttpServer())
                .get('/api/breeds/@#$')
                .expect(400);
        });

        it('품종 데이터는 인증 없이 접근 가능', async () => {
            // Authorization 헤더 없이 요청
            await request(app.getHttpServer())
                .get('/api/breeds/dog')
                .expect(200);
        });

        it('강아지 품종 데이터 구조 검증', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeds/dog')
                .expect(200);

            const breedData = response.body.item;
            expect(breedData).toHaveProperty('petType');
            expect(breedData.petType).toBe('dog');
            expect(breedData).toHaveProperty('categories');
            expect(Array.isArray(breedData.categories)).toBe(true);
        });

        it('고양이 품종 데이터 구조 검증', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeds/cat')
                .expect(200);

            const breedData = response.body.item;
            expect(breedData).toHaveProperty('petType');
            expect(breedData.petType).toBe('cat');
            expect(breedData).toHaveProperty('categories');
            expect(Array.isArray(breedData.categories)).toBe(true);
        });

        it('카테고리에 품종 배열이 포함되어 있는지 확인', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeds/dog')
                .expect(200);

            const breedData = response.body.item;
            if (breedData.categories && breedData.categories.length > 0) {
                const category = breedData.categories[0];
                expect(category).toHaveProperty('categoryName');
                expect(category).toHaveProperty('breeds');
                expect(Array.isArray(category.breeds)).toBe(true);
            }
        });

        it('대소문자 구분 테스트 (DOG)', async () => {
            await request(app.getHttpServer())
                .get('/api/breeds/DOG')
                .expect(400);
        });

        it('대소문자 구분 테스트 (Cat)', async () => {
            await request(app.getHttpServer())
                .get('/api/breeds/Cat')
                .expect(400);
        });
    });
});
