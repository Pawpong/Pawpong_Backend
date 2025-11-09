import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import request from 'supertest';

import { createTestingApp, cleanupDatabase, seedAdmin } from '../../../../common/test/test-utils';

/**
 * Platform Admin 도메인 E2E 테스트
 *
 * 테스트 대상 API:
 * 1. 플랫폼 통계 조회
 */
describe('Platform Admin API E2E Tests', () => {
    let app: INestApplication;
    let adminToken: string;
    let adminId: string;

    beforeAll(async () => {
        app = await createTestingApp();

        // 관리자 계정 생성 및 로그인
        const adminPassword = 'admin1234';
        const { adminId: createdAdminId, email } = await seedAdmin(app, adminPassword);
        adminId = createdAdminId;

        // 실제 관리자 로그인 API 호출하여 토큰 획득
        const loginResponse = await request(app.getHttpServer())
            .post('/api/auth/admin/login')
            .send({
                email: email,
                password: adminPassword,
            })
            .expect(200);

        adminToken = loginResponse.body.data.accessToken;
    });

    afterAll(async () => {
        await cleanupDatabase(app);
        await app.close();
    });

    /**
     * 테스트 데이터 생성
     */
    describe('테스트 데이터 준비', () => {
        it('테스트용 입양자 및 브리더 생성', async () => {
            // 입양자 여러 명 생성
            for (let i = 0; i < 5; i++) {
                const timestamp = Date.now() + i;
                const providerId = Math.random().toString().substr(2, 10);
                await request(app.getHttpServer())
                    .post('/api/auth/register/adopter')
                    .send({
                        tempId: `temp_kakao_${providerId}_${timestamp}`,
                        email: `adopter_stats_${timestamp}_${providerId}@test.com`,
                        nickname: `통계입양자${timestamp}`,
                        phone: `010-1111-${String(i).padStart(4, '0')}`,
                        profileImage: 'https://example.com/profile.jpg',
                    })
                    .expect(200);
            }

            // 브리더 여러 명 생성
            for (let i = 0; i < 3; i++) {
                const timestamp = Date.now() + i;
                await request(app.getHttpServer())
                    .post('/api/auth/register/breeder')
                    .send({
                        email: `breeder_stats_${timestamp}@test.com`,
                        phoneNumber: `010-2222-${String(i).padStart(4, '0')}`,
                        breederName: `통계브리더${timestamp}`,
                        breederLocation: {
                            city: '서울특별시',
                            district: '강남구',
                        },
                        animal: 'dog',
                        breeds: ['포메라니안'],
                        plan: 'basic',
                        level: 'new',
                        agreements: {
                            termsOfService: true,
                            privacyPolicy: true,
                            marketingConsent: false,
                        },
                    })
                    .expect(200);
            }

            console.log('✅ 테스트용 사용자 생성 완료');
        });
    });

    /**
     * 1. 플랫폼 통계 조회 테스트
     */
    describe('GET /api/platform-admin/stats', () => {
        it('기본 통계 조회 성공', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/platform-admin/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.userStatistics).toBeDefined();
            expect(response.body.data.adoptionStatistics).toBeDefined();
            expect(response.body.data.popularBreeds).toBeDefined();
            expect(response.body.data.regionalStatistics).toBeDefined();
            expect(response.body.data.breederPerformanceRanking).toBeDefined();
            expect(response.body.data.reportStatistics).toBeDefined();

            console.log('✅ 기본 통계 조회 성공');
        });

        it('사용자 통계가 올바르게 조회됨', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/platform-admin/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const { userStatistics } = response.body.data;
            expect(userStatistics.totalAdopterCount).toBeGreaterThanOrEqual(5);
            expect(userStatistics.totalBreederCount).toBeGreaterThanOrEqual(3);
            expect(userStatistics.newAdopterCount).toBeGreaterThanOrEqual(0);
            expect(userStatistics.newBreederCount).toBeGreaterThanOrEqual(0);

            console.log('✅ 사용자 통계가 올바르게 조회됨');
        });

        it('일간 통계 조회 성공', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/platform-admin/stats?statsType=daily')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            console.log('✅ 일간 통계 조회 성공');
        });

        it('주간 통계 조회 성공', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/platform-admin/stats?statsType=weekly')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            console.log('✅ 주간 통계 조회 성공');
        });

        it('월간 통계 조회 성공', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/platform-admin/stats?statsType=monthly')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            console.log('✅ 월간 통계 조회 성공');
        });

        it('날짜 범위로 통계 조회 성공', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/platform-admin/stats?startDate=2025-01-01&endDate=2025-01-31')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            console.log('✅ 날짜 범위로 통계 조회 성공');
        });

        it('페이지네이션과 함께 통계 조회 성공', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/platform-admin/stats?pageNumber=1&itemsPerPage=5')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.popularBreeds.length).toBeLessThanOrEqual(5);
            expect(response.body.data.regionalStatistics.length).toBeLessThanOrEqual(5);
            expect(response.body.data.breederPerformanceRanking.length).toBeLessThanOrEqual(5);

            console.log('✅ 페이지네이션과 함께 통계 조회 성공');
        });

        it('인증 없이 접근 시 401 에러', async () => {
            const response = await request(app.getHttpServer()).get('/api/platform-admin/stats').expect(401);

            console.log('✅ 인증 없이 접근 실패 확인');
        });

        it('잘못된 통계 타입으로 조회 시 400 에러', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/platform-admin/stats?statsType=invalid')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);

            console.log('✅ 잘못된 통계 타입으로 조회 시 400 에러 확인');
        });

        it('잘못된 날짜 형식으로 조회 시 400 에러', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/platform-admin/stats?startDate=invalid-date')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);

            console.log('✅ 잘못된 날짜 형식으로 조회 시 400 에러 확인');
        });
    });

    /**
     * 2. 권한 검증 테스트
     */
    describe('권한 검증', () => {
        it('일반 입양자 토큰으로 접근 시 403 에러', async () => {
            // 일반 입양자 생성
            const timestamp = Date.now();
            const providerId = Math.random().toString().substr(2, 10);
            const adopterResponse = await request(app.getHttpServer())
                .post('/api/auth/register/adopter')
                .send({
                    tempId: `temp_kakao_${providerId}_${timestamp}`,
                    email: `forbidden_stats_${timestamp}_${providerId}@test.com`,
                    nickname: `권한테스트${timestamp}`,
                    phone: '010-9999-9999',
                    profileImage: 'https://example.com/profile.jpg',
                })
                .expect(200);

            const adopterToken = adopterResponse.body.data.accessToken;

            // 통계 API에 입양자 토큰으로 접근 시도
            const response = await request(app.getHttpServer())
                .get('/api/platform-admin/stats')
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(403);

            console.log('✅ 일반 사용자의 통계 조회 거부 확인');
        });

        it('브리더 토큰으로 접근 시 403 에러', async () => {
            // 브리더 생성
            const timestamp = Date.now();
            const breederResponse = await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send({
                    email: `forbidden_breeder_${timestamp}@test.com`,
                    phoneNumber: '010-8888-8888',
                    breederName: `권한테스트브리더${timestamp}`,
                    breederLocation: {
                        city: '서울특별시',
                        district: '강남구',
                    },
                    animal: 'dog',
                    breeds: ['포메라니안'],
                    plan: 'basic',
                    level: 'new',
                    agreements: {
                        termsOfService: true,
                        privacyPolicy: true,
                        marketingConsent: false,
                    },
                })
                .expect(200);

            const breederToken = breederResponse.body.data.accessToken;

            // 통계 API에 브리더 토큰으로 접근 시도
            const response = await request(app.getHttpServer())
                .get('/api/platform-admin/stats')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(403);

            console.log('✅ 브리더의 통계 조회 거부 확인');
        });
    });
});
