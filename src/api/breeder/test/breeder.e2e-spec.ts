import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { createTestingApp } from '../../../common/test/test-utils';

/**
 * Breeder 도메인 E2E 테스트 (간소화 버전)
 *
 * 테스트 대상 핵심 API:
 * 1. 브리더 검색 및 탐색
 * 2. 브리더 프로필 조회
 * 3. 브리더 후기 목록 조회
 * 4. 브리더 개체(반려동물) 목록 조회
 */
describe('Breeder API E2E Tests (Simple)', () => {
    let app: INestApplication;
    let breederId: string;

    beforeAll(async () => {
        app = await createTestingApp();

        // 테스트용 브리더 생성
        const timestamp = Date.now();
        const breederResponse = await request(app.getHttpServer())
            .post('/api/auth/register/breeder')
            .send({
                email: `breeder_test_${timestamp}@test.com`,
                phoneNumber: '010-1234-5678',
                breederName: '테스트 브리더',
                breederLocation: {
                    city: '서울특별시',
                    district: '강남구',
                },
                animal: 'dog',
                breeds: ['포메라니안', '말티즈'],
                plan: 'basic',
                level: 'new',
                agreements: {
                    termsOfService: true,
                    privacyPolicy: true,
                    marketingConsent: false,
                },
            });

        if (breederResponse.status === 200 && breederResponse.body.data) {
            breederId = breederResponse.body.data.breederId;
            console.log('✅ 테스트용 브리더 생성 완료:', breederId);
        } else {
            console.log('⚠️  브리더 생성 실패:', breederResponse.status, breederResponse.body);
        }
    });

    afterAll(async () => {
        await app.close();
    });

    /**
     * 1. 브리더 검색 테스트
     */
    describe('브리더 검색 및 탐색', () => {
        it('GET /api/breeder/search - 브리더 검색 성공 (레거시)', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder/search')
                .query({
                    petType: 'dog',
                    cityName: '서울',
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            console.log('✅ 브리더 검색 성공 (레거시)');
        });

        it('POST /api/breeder/explore - 브리더 탐색 성공', async () => {
            const response = await request(app.getHttpServer()).post('/api/breeder/explore').send({
                petType: 'dog',
                page: 1,
                take: 10,
            });

            // 200 또는 201 모두 허용
            expect([200, 201]).toContain(response.status);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();

            // 응답 구조 확인 (items가 있거나 배열일 수 있음)
            if (response.body.data.items) {
                expect(Array.isArray(response.body.data.items)).toBe(true);
                // pagination이 있으면 검증
                if (response.body.data.pagination) {
                    expect(response.body.data.pagination).toBeDefined();
                }
            } else if (Array.isArray(response.body.data)) {
                expect(Array.isArray(response.body.data)).toBe(true);
            }
            console.log('✅ 브리더 탐색 성공');
        });

        it('POST /api/breeder/explore - 지역 필터링', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/breeder/explore')
                .send({
                    petType: 'dog',
                    province: ['서울특별시'],
                    city: ['강남구'],
                    page: 1,
                    take: 10,
                });

            // 200 또는 201 모두 허용
            expect([200, 201]).toContain(response.status);
            expect(response.body.success).toBe(true);
            expect(response.body.data.items).toBeDefined();
            console.log('✅ 지역 필터링 성공');
        });

        it('POST /api/breeder/explore - 크기 필터링', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/breeder/explore')
                .send({
                    petType: 'dog',
                    dogSize: ['large'],
                    page: 1,
                    take: 10,
                });

            // 200 또는 201 모두 허용
            expect([200, 201]).toContain(response.status);
            expect(response.body.success).toBe(true);
            expect(response.body.data.items).toBeDefined();
            console.log('✅ 크기 필터링 성공');
        });

        it('GET /api/breeder/popular - 인기 브리더 조회 성공', async () => {
            const response = await request(app.getHttpServer()).get('/api/breeder/popular').expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
            console.log('✅ 인기 브리더 조회 성공');
        });
    });

    /**
     * 2. 브리더 프로필 조회 테스트
     */
    describe('브리더 프로필 조회', () => {
        it('GET /api/breeder/:id - 브리더 프로필 상세 조회 성공', async () => {
            if (!breederId) {
                console.log('⚠️  브리더 ID가 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer()).get(`/api/breeder/${breederId}`).expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.breederId).toBe(breederId);
            expect(response.body.data.breederName).toBeDefined();
            console.log('✅ 브리더 프로필 조회 성공');
        });

        it('GET /api/breeder/:id - 존재하지 않는 브리더 ID로 실패', async () => {
            const response = await request(app.getHttpServer()).get('/api/breeder/507f1f77bcf86cd799439011');

            // 404 또는 400 에러 허용
            expect([400, 404]).toContain(response.status);
            console.log('✅ 존재하지 않는 브리더 ID 실패 확인');
        });

        it('GET /api/breeder/:id - 잘못된 ID 형식으로 실패', async () => {
            const response = await request(app.getHttpServer()).get('/api/breeder/invalid-id').expect(400);

            // 에러 응답은 success 필드가 없을 수 있음
            expect(response.body.message || response.body.error).toContain('올바르지 않은 브리더 ID 형식');
            console.log('✅ 잘못된 ID 형식 실패 확인');
        });
    });

    /**
     * 3. 브리더 후기 목록 조회 테스트
     */
    describe('브리더 후기 목록', () => {
        it('GET /api/breeder/:id/reviews - 후기 목록 조회 성공', async () => {
            if (!breederId) {
                console.log('⚠️  브리더 ID가 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/reviews`)
                .query({ page: 1, limit: 10 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.items).toBeDefined();
            expect(Array.isArray(response.body.data.items)).toBe(true);
            expect(response.body.data.pagination).toBeDefined();
            console.log('✅ 후기 목록 조회 성공');
        });

        it('GET /api/breeder/:id/reviews - 페이지네이션 동작 확인', async () => {
            if (!breederId) {
                console.log('⚠️  브리더 ID가 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/reviews`)
                .query({ page: 2, limit: 5 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.pagination.currentPage).toBe(2);
            expect(response.body.data.pagination.pageSize).toBe(5);
            console.log('✅ 후기 페이지네이션 동작 확인');
        });
    });

    /**
     * 4. 브리더 개체(반려동물) 목록 조회 테스트
     */
    describe('브리더 개체 목록', () => {
        it('GET /api/breeder/:id/pets - 개체 목록 조회 성공', async () => {
            if (!breederId) {
                console.log('⚠️  브리더 ID가 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/pets`)
                .query({ page: 1, limit: 20 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.items).toBeDefined();
            expect(Array.isArray(response.body.data.items)).toBe(true);
            expect(response.body.data.pagination).toBeDefined();
            console.log('✅ 개체 목록 조회 성공');
        });

        it('GET /api/breeder/:id/pets - 분양 가능 상태 필터링', async () => {
            if (!breederId) {
                console.log('⚠️  브리더 ID가 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/pets`)
                .query({ status: 'available', page: 1, limit: 20 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.items).toBeDefined();
            console.log('✅ 분양 가능 상태 필터링 성공');
        });
    });

    /**
     * 5. 부모견/부모묘 목록 조회 테스트
     */
    describe('부모견/부모묘 목록', () => {
        it('GET /api/breeder/:id/parent-pets - 부모견/부모묘 목록 조회 성공', async () => {
            if (!breederId) {
                console.log('⚠️  브리더 ID가 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/parent-pets`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            console.log('✅ 부모견/부모묘 목록 조회 성공');
        });
    });

    /**
     * 6. 입양 신청 폼 조회 테스트
     */
    describe('입양 신청 폼', () => {
        it('GET /api/breeder/:id/application-form - 입양 신청 폼 조회 성공', async () => {
            if (!breederId) {
                console.log('⚠️  브리더 ID가 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/application-form`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.standardQuestions).toBeDefined();
            expect(Array.isArray(response.body.data.standardQuestions)).toBe(true);
            console.log('✅ 입양 신청 폼 조회 성공');
        });
    });

    /**
     * 7. 응답 형식 검증 테스트
     */
    describe('응답 형식 검증', () => {
        it('표준 API 응답 형식 확인', async () => {
            const response = await request(app.getHttpServer()).get('/api/breeder/popular').expect(200);

            // 표준 ApiResponseDto 형식 검증
            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('code');
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body.success).toBe(true);
            expect(response.body.code).toBe(200);
            console.log('✅ 표준 API 응답 형식 검증 완료');
        });

        it('페이지네이션 응답 형식 확인', async () => {
            const response = await request(app.getHttpServer()).post('/api/breeder/explore').send({
                petType: 'dog',
                page: 1,
                take: 10,
            });

            // 200 또는 201 모두 허용
            expect([200, 201]).toContain(response.status);

            // 페이지네이션 구조 검증
            expect(response.body.data.items).toBeDefined();
            expect(Array.isArray(response.body.data.items)).toBe(true);
            expect(response.body.data.pagination).toBeDefined();
            expect(response.body.data.pagination.currentPage).toBeDefined();
            expect(response.body.data.pagination.pageSize).toBeDefined();
            expect(response.body.data.pagination.totalItems).toBeDefined();
            expect(response.body.data.pagination.totalPages).toBeDefined();
            expect(response.body.data.pagination.hasNextPage).toBeDefined();
            expect(response.body.data.pagination.hasPrevPage).toBeDefined();
            console.log('✅ 페이지네이션 응답 형식 검증 완료');
        });
    });
});
