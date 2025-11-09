import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import request from 'supertest';

import { createTestingApp, cleanupDatabase, seedAdmin } from '../../../../common/test/test-utils';

/**
 * User Admin 도메인 E2E 테스트
 *
 * 테스트 대상 API:
 * 1. 관리자 프로필 조회
 * 2. 통합 사용자 목록 조회
 * 3. 사용자 상태 변경
 */
describe('User Admin API E2E Tests', () => {
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
     * 1. 관리자 프로필 조회 테스트
     */
    describe('GET /api/user-admin/profile', () => {
        it('관리자 프로필 조회 성공', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/user-admin/profile')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(adminId);
            expect(response.body.data.name).toBe('테스트관리자');
            expect(response.body.data.adminLevel).toBe('super_admin');
            expect(response.body.data.permissions).toBeDefined();
            expect(response.body.message).toContain('관리자 프로필');

            console.log('✅ 관리자 프로필 조회 성공');
        });

        it('인증 없이 접근 시 401 에러', async () => {
            const response = await request(app.getHttpServer()).get('/api/user-admin/profile').expect(401);

            console.log('✅ 인증 없이 접근 실패 확인');
        });
    });

    /**
     * 2. 통합 사용자 목록 조회 테스트
     */
    describe('GET /api/user-admin/users', () => {
        let adopterId: string;
        let breederId: string;

        beforeAll(async () => {
            // 테스트용 입양자 생성
            const timestamp = Date.now();
            const providerId = Math.random().toString().substr(2, 10);
            const adopterResponse = await request(app.getHttpServer())
                .post('/api/auth/register/adopter')
                .send({
                    tempId: `temp_kakao_${providerId}_${timestamp}`,
                    email: `adopter_${timestamp}_${providerId}@test.com`,
                    nickname: `입양자${timestamp}`,
                    phone: '010-1111-1111',
                    profileImage: 'https://example.com/profile.jpg',
                })
                .expect(200);

            adopterId = adopterResponse.body.data.adopterId;

            // 테스트용 브리더 생성
            const timestamp2 = Date.now();
            const breederResponse = await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send({
                    email: `breeder_${timestamp2}@test.com`,
                    phoneNumber: '010-2222-2222',
                    breederName: `테스트브리더${timestamp2}`,
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

            breederId = breederResponse.body.data.breederId;
        });

        it('모든 사용자 목록 조회 성공', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/user-admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.users).toBeDefined();
            expect(Array.isArray(response.body.data.users)).toBe(true);
            expect(response.body.data.total).toBeGreaterThanOrEqual(2);

            console.log('✅ 모든 사용자 목록 조회 성공');
        });

        it('입양자만 필터링하여 조회 성공', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/user-admin/users?userRole=adopter')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.users.every((u: any) => u.userRole === 'adopter')).toBe(true);

            console.log('✅ 입양자만 필터링하여 조회 성공');
        });

        it('브리더만 필터링하여 조회 성공', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/user-admin/users?userRole=breeder')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.users.every((u: any) => u.userRole === 'breeder')).toBe(true);

            console.log('✅ 브리더만 필터링하여 조회 성공');
        });

        it('검색 키워드로 조회 성공', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/user-admin/users?searchKeyword=테스트')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            console.log('✅ 검색 키워드로 조회 성공');
        });

        it('인증 없이 접근 시 401 에러', async () => {
            const response = await request(app.getHttpServer()).get('/api/user-admin/users').expect(401);

            console.log('✅ 인증 없이 접근 실패 확인');
        });
    });

    /**
     * 3. 사용자 상태 변경 테스트
     */
    describe('PUT /api/user-admin/users/:userId/status', () => {
        let testAdopterId: string;

        beforeAll(async () => {
            // 테스트용 입양자 생성
            const timestamp = Date.now();
            const providerId = Math.random().toString().substr(2, 10);
            const response = await request(app.getHttpServer())
                .post('/api/auth/register/adopter')
                .send({
                    tempId: `temp_kakao_${providerId}_${timestamp}`,
                    email: `status_test_${timestamp}_${providerId}@test.com`,
                    nickname: `상태변경${timestamp}`,
                    phone: '010-3333-3333',
                    profileImage: 'https://example.com/profile.jpg',
                })
                .expect(200);

            testAdopterId = response.body.data.adopterId;
        });

        it('입양자 계정 정지 성공', async () => {
            const response = await request(app.getHttpServer())
                .put(`/api/user-admin/users/${testAdopterId}/status?role=adopter`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    accountStatus: 'suspended',
                    actionReason: '부적절한 활동으로 인한 정지',
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.message).toContain('status updated');
            expect(response.body.message).toContain('상태가 변경');

            console.log('✅ 입양자 계정 정지 성공');
        });

        it('입양자 계정 활성화 성공', async () => {
            const response = await request(app.getHttpServer())
                .put(`/api/user-admin/users/${testAdopterId}/status?role=adopter`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    accountStatus: 'active',
                    actionReason: '정지 해제',
                })
                .expect(200);

            expect(response.body.success).toBe(true);

            console.log('✅ 입양자 계정 활성화 성공');
        });

        it('사유 없이 상태 변경 시 실패', async () => {
            const response = await request(app.getHttpServer())
                .put(`/api/user-admin/users/${testAdopterId}/status?role=adopter`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    accountStatus: 'suspended',
                    // actionReason 누락
                })
                .expect(400);

            console.log('✅ 사유 없이 상태 변경 시 실패 확인');
        });

        it('인증 없이 접근 시 401 에러', async () => {
            const response = await request(app.getHttpServer())
                .put(`/api/user-admin/users/${testAdopterId}/status?role=adopter`)
                .send({
                    accountStatus: 'suspended',
                    actionReason: '테스트',
                })
                .expect(401);

            console.log('✅ 인증 없이 접근 실패 확인');
        });
    });

    /**
     * 4. 권한 검증 테스트
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
                    email: `forbidden_${timestamp}_${providerId}@test.com`,
                    nickname: `권한테스트${timestamp}`,
                    phone: '010-4444-4444',
                    profileImage: 'https://example.com/profile.jpg',
                })
                .expect(200);

            const adopterToken = adopterResponse.body.data.accessToken;

            // 관리자 API에 입양자 토큰으로 접근 시도
            const response = await request(app.getHttpServer())
                .get('/api/user-admin/profile')
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(403);

            console.log('✅ 일반 사용자의 관리자 API 접근 거부 확인');
        });
    });
});
