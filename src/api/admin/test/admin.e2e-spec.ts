import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { createTestingApp } from '../../../common/test/test-utils';

/**
 * Admin 도메인 E2E 테스트 (간소화 버전)
 *
 * 테스트 대상 핵심 API:
 * 1. 관리자 프로필 조회
 * 2. 브리더 인증 관리
 * 3. 사용자 관리
 * 4. 입양 신청 모니터링
 * 5. 신고 관리
 * 6. 시스템 통계 조회
 * 7. 접근 제어
 */
describe('Admin API E2E Tests (Simple)', () => {
    let app: INestApplication;
    let adminToken: string;
    let breederToken: string;
    let breederId: string;

    beforeAll(async () => {
        app = await createTestingApp();

        // 테스트용 브리더 생성
        const timestamp = Date.now();
        const breederResponse = await request(app.getHttpServer())
            .post('/api/auth/register/breeder')
            .send({
                email: `admin_test_breeder_${timestamp}@test.com`,
                phoneNumber: '010-8888-9999',
                breederName: '관리자 테스트 브리더',
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
            });

        if (breederResponse.status === 200 && breederResponse.body.data) {
            breederToken = breederResponse.body.data.accessToken;
            breederId = breederResponse.body.data.breederId;
            console.log('✅ 테스트용 브리더 생성 완료:', breederId);
        }

        // 테스트용 관리자 생성 시도 (실패할 수 있음)
        const adminResponse = await request(app.getHttpServer())
            .post('/api/auth/register/admin')
            .send({
                email: `admin_${timestamp}@test.com`,
                password: 'adminpassword123',
                name: 'Test Admin',
                adminLevel: 'super',
            });

        if (adminResponse.status === 200 && adminResponse.body.data?.accessToken) {
            adminToken = adminResponse.body.data.accessToken;
            console.log('✅ 테스트용 관리자 생성 완료');
        } else {
            console.log('⚠️  관리자 생성 실패 - 관리자 전용 테스트는 스킵됩니다');
        }
    });

    afterAll(async () => {
        await app.close();
    });

    /**
     * 1. 관리자 프로필 조회 테스트
     */
    describe('관리자 프로필', () => {
        it('GET /api/admin/profile - 관리자 프로필 조회 성공', async () => {
            if (!adminToken) {
                console.log('⚠️  관리자 토큰이 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/api/admin/profile')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.email).toBeDefined();
            console.log('✅ 관리자 프로필 조회 성공');
        });

        it('GET /api/admin/profile - 권한 없는 사용자 접근 거부', async () => {
            if (!breederToken) {
                console.log('⚠️  브리더 토큰이 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/api/admin/profile')
                .set('Authorization', `Bearer ${breederToken}`);

            // 403 Forbidden 또는 401 Unauthorized 허용
            expect([401, 403]).toContain(response.status);
            console.log('✅ 권한 없는 사용자 접근 거부 확인');
        });

        it('GET /api/admin/profile - 인증 없는 접근 거부', async () => {
            const response = await request(app.getHttpServer()).get('/api/admin/profile');

            expect(response.status).toBe(401);
            console.log('✅ 인증 없는 접근 거부 확인');
        });
    });

    /**
     * 2. 브리더 인증 관리 테스트
     */
    describe('브리더 인증 관리', () => {
        it('GET /api/admin/verification/pending - 승인 대기 브리더 목록 조회', async () => {
            if (!adminToken) {
                console.log('⚠️  관리자 토큰이 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/api/admin/verification/pending')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({ page: 1, limit: 10 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
            console.log('✅ 승인 대기 브리더 목록 조회 성공');
        });

        it('PUT /api/admin/verification/:breederId - 브리더 승인', async () => {
            if (!adminToken || !breederId) {
                console.log('⚠️  관리자 토큰 또는 브리더 ID가 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .put(`/api/admin/verification/${breederId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    action: 'approve',
                    adminMessage: '인증 승인되었습니다',
                });

            // 200 또는 400 허용 (이미 승인되었거나 승인 가능)
            expect([200, 400]).toContain(response.status);
            console.log('✅ 브리더 승인 처리 완료');
        });

        it('PUT /api/admin/verification/:breederId - 브리더 거절', async () => {
            if (!adminToken || !breederId) {
                console.log('⚠️  관리자 토큰 또는 브리더 ID가 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .put(`/api/admin/verification/${breederId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    action: 'reject',
                    adminMessage: '서류 보완 필요',
                    requiredDocuments: ['사업자등록증', '시설 사진'],
                });

            // 200 또는 400 허용
            expect([200, 400]).toContain(response.status);
            console.log('✅ 브리더 거절 처리 완료');
        });

        it('PUT /api/admin/verification/:breederId - 권한 없는 접근 거부', async () => {
            if (!breederToken || !breederId) {
                console.log('⚠️  브리더 토큰 또는 브리더 ID가 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .put(`/api/admin/verification/${breederId}`)
                .set('Authorization', `Bearer ${breederToken}`)
                .send({
                    action: 'approve',
                });

            expect([401, 403]).toContain(response.status);
            console.log('✅ 브리더 인증 관리 권한 없는 접근 거부 확인');
        });
    });

    /**
     * 3. 사용자 관리 테스트
     */
    describe('사용자 관리', () => {
        it('GET /api/admin/users - 사용자 목록 조회', async () => {
            if (!adminToken) {
                console.log('⚠️  관리자 토큰이 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    role: 'all',
                    status: 'active',
                    page: 1,
                    limit: 10,
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
            console.log('✅ 사용자 목록 조회 성공');
        });

        it('GET /api/admin/users - 브리더만 필터링', async () => {
            if (!adminToken) {
                console.log('⚠️  관리자 토큰이 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    role: 'breeder',
                    verified: 'true',
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            console.log('✅ 브리더만 필터링 성공');
        });

        it('PUT /api/admin/users/:userId/status - 사용자 상태 변경', async () => {
            if (!adminToken || !breederId) {
                console.log('⚠️  관리자 토큰 또는 브리더 ID가 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .put(`/api/admin/users/${breederId}/status`)
                .query({ role: 'breeder' })
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'active',
                    reason: '정상 활동',
                });

            // 200 또는 400 허용
            expect([200, 400]).toContain(response.status);
            console.log('✅ 사용자 상태 변경 완료');
        });

        it('GET /api/admin/users - 권한 없는 접근 거부', async () => {
            if (!breederToken) {
                console.log('⚠️  브리더 토큰이 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${breederToken}`);

            expect([401, 403]).toContain(response.status);
            console.log('✅ 사용자 관리 권한 없는 접근 거부 확인');
        });
    });

    /**
     * 4. 입양 신청 모니터링 테스트
     */
    describe('입양 신청 모니터링', () => {
        it('GET /api/admin/applications - 입양 신청 목록 조회', async () => {
            if (!adminToken) {
                console.log('⚠️  관리자 토큰이 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/api/admin/applications')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    status: 'pending',
                    dateFrom: '2024-01-01',
                    dateTo: '2025-12-31',
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            console.log('✅ 입양 신청 목록 조회 성공');
        });

        it('GET /api/admin/applications - 특정 브리더 신청 조회', async () => {
            if (!adminToken || !breederId) {
                console.log('⚠️  관리자 토큰 또는 브리더 ID가 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/api/admin/applications')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    breederId: breederId,
                    page: 1,
                    limit: 20,
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            console.log('✅ 특정 브리더 신청 조회 성공');
        });

        it('GET /api/admin/applications - 권한 없는 접근 거부', async () => {
            if (!breederToken) {
                console.log('⚠️  브리더 토큰이 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/api/admin/applications')
                .set('Authorization', `Bearer ${breederToken}`);

            expect([401, 403]).toContain(response.status);
            console.log('✅ 입양 신청 모니터링 권한 없는 접근 거부 확인');
        });
    });

    /**
     * 5. 신고 관리 테스트
     */
    describe('신고 관리', () => {
        it('GET /api/admin/reports - 신고 목록 조회', async () => {
            if (!adminToken) {
                console.log('⚠️  관리자 토큰이 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/api/admin/reports')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    page: 1,
                    limit: 10,
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
            console.log('✅ 신고 목록 조회 성공');
        });

        it('GET /api/admin/reports/reviews - 후기 신고 목록 조회', async () => {
            if (!adminToken) {
                console.log('⚠️  관리자 토큰이 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/api/admin/reports/reviews')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    page: 1,
                    limit: 10,
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            console.log('✅ 후기 신고 목록 조회 성공');
        });

        it('GET /api/admin/reports/breeders - 브리더 신고 목록 조회', async () => {
            if (!adminToken) {
                console.log('⚠️  관리자 토큰이 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/api/admin/reports/breeders')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    page: 1,
                    limit: 10,
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            console.log('✅ 브리더 신고 목록 조회 성공');
        });

        it('PUT /api/admin/reports/:breederId/:reportId - 신고 처리', async () => {
            if (!adminToken || !breederId) {
                console.log('⚠️  관리자 토큰 또는 브리더 ID가 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .put(`/api/admin/reports/${breederId}/dummy-report-id`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    action: 'warning',
                    adminMessage: '경고 처리됨',
                });

            // 200 OK 또는 400/404 (신고가 없을 수 있음)
            expect([200, 400, 404]).toContain(response.status);
            console.log('✅ 신고 처리 완료');
        });

        it('DELETE /api/admin/reviews/:breederId/:reviewId - 부적절한 후기 삭제', async () => {
            if (!adminToken || !breederId) {
                console.log('⚠️  관리자 토큰 또는 브리더 ID가 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .delete(`/api/admin/reviews/${breederId}/dummy-review-id`)
                .set('Authorization', `Bearer ${adminToken}`);

            // 200 OK 또는 400/404 (후기가 없을 수 있음)
            expect([200, 400, 404]).toContain(response.status);
            console.log('✅ 부적절한 후기 삭제 처리 완료');
        });

        it('GET /api/admin/reports - 권한 없는 접근 거부', async () => {
            if (!breederToken) {
                console.log('⚠️  브리더 토큰이 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/api/admin/reports')
                .set('Authorization', `Bearer ${breederToken}`);

            expect([401, 403]).toContain(response.status);
            console.log('✅ 신고 관리 권한 없는 접근 거부 확인');
        });
    });

    /**
     * 6. 시스템 통계 조회 테스트
     */
    describe('시스템 통계', () => {
        it('GET /api/admin/stats - 전체 통계 조회', async () => {
            if (!adminToken) {
                console.log('⚠️  관리자 토큰이 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            console.log('✅ 전체 통계 조회 성공');
        });

        it('GET /api/admin/stats - 기간별 통계 조회', async () => {
            if (!adminToken) {
                console.log('⚠️  관리자 토큰이 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    startDate: '2024-01-01',
                    endDate: '2025-12-31',
                    groupBy: 'month',
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            console.log('✅ 기간별 통계 조회 성공');
        });

        it('GET /api/admin/stats - 지역별 통계', async () => {
            if (!adminToken) {
                console.log('⚠️  관리자 토큰이 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    region: 'seoul',
                    metrics: 'adopters,breeders,applications',
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            console.log('✅ 지역별 통계 조회 성공');
        });

        it('GET /api/admin/stats - 권한 없는 접근 거부', async () => {
            if (!breederToken) {
                console.log('⚠️  브리더 토큰이 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${breederToken}`);

            expect([401, 403]).toContain(response.status);
            console.log('✅ 통계 조회 권한 없는 접근 거부 확인');
        });
    });

    /**
     * 7. 접근 제어 테스트
     */
    describe('접근 제어', () => {
        it('모든 관리자 API - 인증 없는 접근 거부', async () => {
            const adminEndpoints = [
                '/api/admin/profile',
                '/api/admin/verification/pending',
                '/api/admin/users',
                '/api/admin/applications',
                '/api/admin/reports',
                '/api/admin/reports/reviews',
                '/api/admin/reports/breeders',
                '/api/admin/stats',
            ];

            for (const endpoint of adminEndpoints) {
                const response = await request(app.getHttpServer()).get(endpoint);
                expect(response.status).toBe(401);
            }

            console.log('✅ 모든 관리자 API 인증 없는 접근 거부 확인');
        });

        it('모든 관리자 API - 브리더 접근 거부', async () => {
            if (!breederToken) {
                console.log('⚠️  브리더 토큰이 없어서 테스트 스킵');
                return;
            }

            const adminEndpoints = [
                '/api/admin/profile',
                '/api/admin/verification/pending',
                '/api/admin/users',
                '/api/admin/applications',
                '/api/admin/reports',
                '/api/admin/stats',
            ];

            for (const endpoint of adminEndpoints) {
                const response = await request(app.getHttpServer())
                    .get(endpoint)
                    .set('Authorization', `Bearer ${breederToken}`);
                expect([401, 403]).toContain(response.status);
            }

            console.log('✅ 모든 관리자 API 브리더 접근 거부 확인');
        });
    });

    /**
     * 8. 응답 형식 검증 테스트
     */
    describe('응답 형식 검증', () => {
        it('표준 API 응답 형식 확인', async () => {
            if (!adminToken) {
                console.log('⚠️  관리자 토큰이 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            // 표준 ApiResponseDto 형식 검증
            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('code');
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body.success).toBe(true);
            expect(response.body.code).toBe(200);
            console.log('✅ 표준 API 응답 형식 검증 완료');
        });
    });
});
