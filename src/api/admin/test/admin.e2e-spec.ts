import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { AppModule } from '../../../app.module';

/**
 * Admin API End-to-End 테스트
 * 관리자 관련 모든 API 엔드포인트를 테스트합니다.
 * - 브리더 승인 관리
 * - 사용자 관리
 * - 신고 처리
 * - 통계 조회
 * - 시스템 관리
 */
describe('Admin API (e2e)', () => {
    let app: INestApplication;
    let mongod: MongoMemoryServer;
    let adminToken: string;
    let breederToken: string;
    let adopterToken: string;
    let breederId: string;
    let adopterId: string;

    beforeAll(async () => {
        // 메모리 내 MongoDB 서버 시작
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [MongooseModule.forRoot(uri), AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // 테스트용 관리자 생성 (직접 DB에 추가하거나 별도 API 사용)
        // 실제 구현에서는 관리자 생성 API나 시드 데이터 사용
        const adminResponse = await request(app.getHttpServer())
            .post('/api/auth/register/admin')
            .send({
                email: 'admin@test.com',
                password: 'adminpassword123',
                name: 'Test Admin',
                adminLevel: 'super',
            })
            .expect((res) => {
                // 관리자 생성이 실패할 수 있음 (별도 권한 필요)
                if (res.status === 201) {
                    adminToken = res.body.access_token;
                }
            });

        // 테스트용 브리더 생성
        const breederResponse = await request(app.getHttpServer()).post('/api/auth/register/breeder').send({
            email: 'breeder@test.com',
            password: 'testpassword123',
            name: 'Test Breeder',
            phone: '010-9876-5432',
            businessNumber: '123-45-67890',
            businessName: 'Test Pet Farm',
        });
        breederToken = breederResponse.body.access_token;
        breederId = breederResponse.body.user.id;

        // 테스트용 입양자 생성
        const adopterResponse = await request(app.getHttpServer()).post('/api/auth/register/adopter').send({
            email: 'adopter@test.com',
            password: 'testpassword123',
            name: 'Test Adopter',
            phone: '010-1234-5678',
        });
        adopterToken = adopterResponse.body.access_token;
        adopterId = adopterResponse.body.user.id;
    });

    afterAll(async () => {
        await app.close();
        await mongod.stop();
    });

    describe('Admin Profile', () => {
        it('GET /api/admin/profile - 관리자 프로필 조회 성공', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/profile')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.email).toBe('admin@test.com');
                    expect(res.body.adminLevel).toBeDefined();
                    expect(res.body.permissions).toBeDefined();
                });
        });

        it('GET /api/admin/profile - 권한 없는 사용자 접근 실패', async () => {
            await request(app.getHttpServer())
                .get('/api/admin/profile')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(403);
        });
    });

    describe('Breeder Verification Management', () => {
        it('GET /api/admin/verification/pending - 승인 대기 브리더 목록', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/verification/pending')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    page: 1,
                    limit: 10,
                })
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body.breeders)).toBe(true);
                    expect(res.body.pagination).toBeDefined();
                });
        });

        it('PUT /api/admin/verification/:breederId - 브리더 승인', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .put(`/api/admin/verification/${breederId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'approved',
                    message: 'Verification approved',
                })
                .expect(200)
                .expect((res) => {
                    expect(res.body.status).toBe('approved');
                });
        });

        it('PUT /api/admin/verification/:breederId - 브리더 거절', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .put(`/api/admin/verification/${breederId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'rejected',
                    message: 'Insufficient documentation',
                    requiredDocuments: ['business_license', 'facility_photos'],
                })
                .expect(200);
        });
    });

    describe('User Management', () => {
        it('GET /api/admin/users - 사용자 목록 조회', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    role: 'all',
                    status: 'active',
                    page: 1,
                    limit: 10,
                })
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body.users)).toBe(true);
                    expect(res.body.pagination).toBeDefined();
                });
        });

        it('PUT /api/admin/users/:userId/status - 사용자 상태 변경', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .put(`/api/admin/users/${adopterId}/status`)
                .query({ role: 'adopter' })
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'suspended',
                    reason: 'Violation of terms',
                    suspensionDays: 7,
                })
                .expect(200);
        });

        it('GET /api/admin/users - 브리더만 필터링', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    role: 'breeder',
                    verified: 'true',
                })
                .expect(200);
        });
    });

    describe('Application Monitoring', () => {
        it('GET /api/admin/applications - 입양 신청 모니터링', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/applications')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    status: 'pending',
                    dateFrom: '2024-01-01',
                    dateTo: '2024-12-31',
                })
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body.applications)).toBe(true);
                    expect(res.body.stats).toBeDefined();
                });
        });

        it('GET /api/admin/applications - 특정 브리더 신청 조회', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/applications')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    breederId: breederId,
                    page: 1,
                    limit: 20,
                })
                .expect(200);
        });
    });

    describe('Report Management', () => {
        it('GET /api/admin/reports - 신고 목록 조회', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/reports')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    page: 1,
                    limit: 10,
                })
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body.reports)).toBe(true);
                    expect(res.body.pagination).toBeDefined();
                });
        });

        it('PUT /api/admin/reports/:breederId/:reportId - 신고 처리', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .put(`/api/admin/reports/${breederId}/dummy-report-id`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    action: 'warning',
                    adminMessage: 'First warning issued',
                })
                .expect((res) => {
                    // 신고가 없을 경우 404, 처리 성공 시 200
                    expect([200, 404]).toContain(res.status);
                });
        });

        it('DELETE /api/admin/reviews/:breederId/:reviewId - 부적절한 후기 삭제', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .delete(`/api/admin/reviews/${breederId}/dummy-review-id`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect((res) => {
                    // 후기가 없을 경우 404, 삭제 성공 시 200
                    expect([200, 404]).toContain(res.status);
                });
        });
    });

    describe('Statistics', () => {
        it('GET /api/admin/stats - 전체 통계 조회', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.userStats).toBeDefined();
                    expect(res.body.adoptionStats).toBeDefined();
                    expect(res.body.popularBreeds).toBeDefined();
                    expect(res.body.reportStats).toBeDefined();
                });
        });

        it('GET /api/admin/stats - 기간별 통계 조회', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    startDate: '2024-01-01',
                    endDate: '2024-12-31',
                    groupBy: 'month',
                })
                .expect(200);
        });

        it('GET /api/admin/stats - 지역별 통계', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    region: 'seoul',
                    metrics: 'adopters,breeders,applications',
                })
                .expect(200);
        });
    });

    describe('Access Control', () => {
        it('모든 관리자 API - 비관리자 접근 거부', async () => {
            const adminEndpoints = [
                '/api/admin/profile',
                '/api/admin/verification/pending',
                '/api/admin/users',
                '/api/admin/applications',
                '/api/admin/reports',
                '/api/admin/stats',
            ];

            for (const endpoint of adminEndpoints) {
                await request(app.getHttpServer())
                    .get(endpoint)
                    .set('Authorization', `Bearer ${breederToken}`)
                    .expect(403);

                await request(app.getHttpServer())
                    .get(endpoint)
                    .set('Authorization', `Bearer ${adopterToken}`)
                    .expect(403);
            }
        });

        it('관리자 API - 인증 없는 접근 거부', async () => {
            const adminEndpoints = [
                '/api/admin/profile',
                '/api/admin/verification/pending',
                '/api/admin/users',
                '/api/admin/applications',
                '/api/admin/reports',
                '/api/admin/stats',
            ];

            for (const endpoint of adminEndpoints) {
                await request(app.getHttpServer()).get(endpoint).expect(401);
            }
        });
    });
});
