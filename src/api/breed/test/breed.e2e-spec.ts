import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestingApp } from '../../../common/test/test-utils';

/**
 * Breed 도메인 E2E 테스트 (간소화 버전)
 *
 * 테스트 대상 핵심 API:
 * 1. 강아지 품종 목록 조회
 * 2. 고양이 품종 목록 조회
 * 3. 유효성 검증 (잘못된 petType)
 */
describe('Breed API E2E Tests (Simple)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        app = await createTestingApp();
    });

    afterAll(async () => {
        await app.close();
    });

    /**
     * 1. 강아지 품종 조회 테스트
     */
    describe('강아지 품종 조회', () => {
        it('GET /api/breeds/dog - 강아지 품종 목록 조회 성공', async () => {
            const response = await request(app.getHttpServer()).get('/api/breeds/dog').expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.petType).toBe('dog');
            expect(response.body.data.categories).toBeDefined();
            expect(Array.isArray(response.body.data.categories)).toBe(true);
            console.log('✅ 강아지 품종 목록 조회 성공');
        });

        it('GET /api/breeds/dog - 인증 없이 접근 가능', async () => {
            // Authorization 헤더 없이 요청
            const response = await request(app.getHttpServer()).get('/api/breeds/dog').expect(200);

            expect(response.body.success).toBe(true);
            console.log('✅ 인증 없이 강아지 품종 조회 성공');
        });

        it('GET /api/breeds/dog - 카테고리 구조 검증', async () => {
            const response = await request(app.getHttpServer()).get('/api/breeds/dog').expect(200);

            const breedData = response.body.data;
            if (breedData.categories && breedData.categories.length > 0) {
                const category = breedData.categories[0];
                expect(category).toHaveProperty('category');
                expect(category).toHaveProperty('categoryDescription');
                expect(category).toHaveProperty('breeds');
                expect(Array.isArray(category.breeds)).toBe(true);
                console.log('✅ 강아지 품종 카테고리 구조 검증 완료');
            } else {
                console.log('⚠️  품종 데이터가 아직 없습니다 (시딩 필요)');
            }
        });
    });

    /**
     * 2. 고양이 품종 조회 테스트
     */
    describe('고양이 품종 조회', () => {
        it('GET /api/breeds/cat - 고양이 품종 목록 조회 성공', async () => {
            const response = await request(app.getHttpServer()).get('/api/breeds/cat').expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.petType).toBe('cat');
            expect(response.body.data.categories).toBeDefined();
            expect(Array.isArray(response.body.data.categories)).toBe(true);
            console.log('✅ 고양이 품종 목록 조회 성공');
        });

        it('GET /api/breeds/cat - 인증 없이 접근 가능', async () => {
            // Authorization 헤더 없이 요청
            const response = await request(app.getHttpServer()).get('/api/breeds/cat').expect(200);

            expect(response.body.success).toBe(true);
            console.log('✅ 인증 없이 고양이 품종 조회 성공');
        });

        it('GET /api/breeds/cat - 카테고리 구조 검증', async () => {
            const response = await request(app.getHttpServer()).get('/api/breeds/cat').expect(200);

            const breedData = response.body.data;
            if (breedData.categories && breedData.categories.length > 0) {
                const category = breedData.categories[0];
                expect(category).toHaveProperty('category');
                expect(category).toHaveProperty('categoryDescription');
                expect(category).toHaveProperty('breeds');
                expect(Array.isArray(category.breeds)).toBe(true);
                console.log('✅ 고양이 품종 카테고리 구조 검증 완료');
            } else {
                console.log('⚠️  품종 데이터가 아직 없습니다 (시딩 필요)');
            }
        });
    });

    /**
     * 3. 유효성 검증 테스트
     */
    describe('유효성 검증', () => {
        it('GET /api/breeds/bird - 잘못된 petType으로 실패', async () => {
            await request(app.getHttpServer()).get('/api/breeds/bird').expect(400);

            console.log('✅ 잘못된 petType (bird) 실패 확인');
        });

        it('GET /api/breeds/123 - 숫자로 실패', async () => {
            await request(app.getHttpServer()).get('/api/breeds/123').expect(400);

            console.log('✅ 잘못된 petType (숫자) 실패 확인');
        });

        it('GET /api/breeds/@#$ - 특수문자로 실패', async () => {
            await request(app.getHttpServer()).get('/api/breeds/@#$').expect(400);

            console.log('✅ 잘못된 petType (특수문자) 실패 확인');
        });

        it('GET /api/breeds/DOG - 대문자로 실패', async () => {
            await request(app.getHttpServer()).get('/api/breeds/DOG').expect(400);

            console.log('✅ 대문자 petType (DOG) 실패 확인');
        });

        it('GET /api/breeds/Cat - 대소문자 혼합으로 실패', async () => {
            await request(app.getHttpServer()).get('/api/breeds/Cat').expect(400);

            console.log('✅ 대소문자 혼합 petType (Cat) 실패 확인');
        });
    });

    /**
     * 4. 응답 형식 검증 테스트
     */
    describe('응답 형식 검증', () => {
        it('GET /api/breeds/dog - 표준 API 응답 형식 확인', async () => {
            const response = await request(app.getHttpServer()).get('/api/breeds/dog').expect(200);

            // 표준 ApiResponseDto 형식 검증
            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('code');
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body.success).toBe(true);
            expect(response.body.code).toBe(200);
            console.log('✅ 표준 API 응답 형식 검증 완료');
        });

        it('GET /api/breeds/cat - 타임스탬프 형식 확인', async () => {
            const response = await request(app.getHttpServer()).get('/api/breeds/cat').expect(200);

            // ISO 8601 형식의 타임스탬프 검증
            expect(response.body.timestamp).toBeDefined();
            const timestamp = new Date(response.body.timestamp);
            expect(timestamp.toString()).not.toBe('Invalid Date');
            console.log('✅ 타임스탬프 형식 검증 완료');
        });
    });
});
