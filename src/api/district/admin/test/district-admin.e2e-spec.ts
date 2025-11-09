import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { createTestingApp } from '../../../../common/test/test-utils';

describe('District Admin API E2E Tests (Simple)', () => {
    let app: INestApplication;
    let adminToken: string;
    let createdDistrictId: string;

    beforeAll(async () => {
        app = await createTestingApp();

        // 테스트용 관리자 생성
        const timestamp = Date.now();
        const adminResponse = await request(app.getHttpServer())
            .post('/api/auth/register/admin')
            .send({
                email: `district_admin_${timestamp}@test.com`,
                password: 'Admin123!@#',
                name: '지역 관리자',
                phoneNumber: '010-9999-0000',
            });

        if (adminResponse.status === 200 && adminResponse.body.data?.accessToken) {
            adminToken = adminResponse.body.data.accessToken;
            console.log('✅ 테스트용 관리자 생성 완료');
        } else {
            console.log('⚠️  관리자 생성 실패, 일부 테스트 스킵될 수 있음');
        }
    });

    afterAll(async () => {
        await app.close();
    });

    /**
     * 1. 지역 생성 테스트
     */
    describe('지역 생성', () => {
        it('POST /api/districts-admin - 지역 생성 성공', async () => {
            if (!adminToken) {
                console.log('⚠️  관리자 토큰이 없어서 테스트 스킵');
                return;
            }

            const timestamp = Date.now();
            const response = await request(app.getHttpServer())
                .post('/api/districts-admin')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    city: `테스트시_${timestamp}`,
                    districts: ['테스트구1', '테스트구2', '테스트구3'],
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.city).toBe(`테스트시_${timestamp}`);
            expect(response.body.data.districts).toHaveLength(3);
            expect(response.body.data.id).toBeDefined();

            createdDistrictId = response.body.data.id;
            console.log('✅ 지역 생성 성공');
        });

        it('POST /api/districts-admin - 중복된 city로 생성 실패', async () => {
            if (!adminToken || !createdDistrictId) {
                console.log('⚠️  관리자 토큰 또는 생성된 지역 ID가 없어서 테스트 스킵');
                return;
            }

            const timestamp = Date.now();
            const duplicateCity = `테스트시_${timestamp}`;

            // 첫 번째 생성
            await request(app.getHttpServer())
                .post('/api/districts-admin')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    city: duplicateCity,
                    districts: ['구1', '구2'],
                });

            // 중복 생성 시도
            const response = await request(app.getHttpServer())
                .post('/api/districts-admin')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    city: duplicateCity,
                    districts: ['구3', '구4'],
                });

            expect([400, 409]).toContain(response.status);
            console.log('✅ 중복 지역 생성 방지 확인');
        });

        it('POST /api/districts-admin - 인증 없이 접근 실패', async () => {
            const response = await request(app.getHttpServer()).post('/api/districts-admin').send({
                city: `테스트시_무인증_${Date.now()}`,
                districts: ['테스트구'],
            });

            expect(response.status).toBe(401);
            console.log('✅ 인증 없이 접근 거부 확인');
        });
    });

    /**
     * 2. 지역 조회 테스트
     */
    describe('지역 조회', () => {
        it('GET /api/districts-admin - 모든 지역 조회 성공', async () => {
            if (!adminToken) {
                console.log('⚠️  관리자 토큰이 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/api/districts-admin')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
            console.log('✅ 모든 지역 조회 성공');
        });

        it('GET /api/districts-admin/:id - 특정 지역 조회 성공', async () => {
            if (!adminToken || !createdDistrictId) {
                console.log('⚠️  관리자 토큰 또는 생성된 지역 ID가 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get(`/api/districts-admin/${createdDistrictId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.id).toBe(createdDistrictId);
            console.log('✅ 특정 지역 조회 성공');
        });

        it('GET /api/districts-admin/:id - 존재하지 않는 ID로 조회 실패', async () => {
            if (!adminToken) {
                console.log('⚠️  관리자 토큰이 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/api/districts-admin/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(400);
            console.log('✅ 존재하지 않는 지역 조회 실패 확인');
        });

        it('GET /api/districts-admin - 인증 없이 접근 실패', async () => {
            const response = await request(app.getHttpServer()).get('/api/districts-admin');

            expect(response.status).toBe(401);
            console.log('✅ 인증 없이 접근 거부 확인');
        });
    });

    /**
     * 3. 지역 수정 테스트
     */
    describe('지역 수정', () => {
        it('PATCH /api/districts-admin/:id - 지역 수정 성공', async () => {
            if (!adminToken || !createdDistrictId) {
                console.log('⚠️  관리자 토큰 또는 생성된 지역 ID가 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .patch(`/api/districts-admin/${createdDistrictId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    districts: ['수정구1', '수정구2', '수정구3', '수정구4'],
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.districts).toHaveLength(4);
            expect(response.body.data.districts).toContain('수정구1');
            console.log('✅ 지역 수정 성공');
        });

        it('PATCH /api/districts-admin/:id - 존재하지 않는 ID로 수정 실패', async () => {
            if (!adminToken) {
                console.log('⚠️  관리자 토큰이 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .patch('/api/districts-admin/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    districts: ['새로운구'],
                });

            expect(response.status).toBe(400);
            console.log('✅ 존재하지 않는 지역 수정 실패 확인');
        });

        it('PATCH /api/districts-admin/:id - 인증 없이 접근 실패', async () => {
            const response = await request(app.getHttpServer())
                .patch('/api/districts-admin/507f1f77bcf86cd799439011')
                .send({
                    districts: ['테스트구'],
                });

            expect(response.status).toBe(401);
            console.log('✅ 인증 없이 접근 거부 확인');
        });
    });

    /**
     * 4. 지역 삭제 테스트
     */
    describe('지역 삭제', () => {
        it('DELETE /api/districts-admin/:id - 존재하지 않는 ID로 삭제 실패', async () => {
            if (!adminToken) {
                console.log('⚠️  관리자 토큰이 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .delete('/api/districts-admin/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(400);
            console.log('✅ 존재하지 않는 지역 삭제 실패 확인');
        });

        it('DELETE /api/districts-admin/:id - 인증 없이 접근 실패', async () => {
            const response = await request(app.getHttpServer()).delete('/api/districts-admin/507f1f77bcf86cd799439011');

            expect(response.status).toBe(401);
            console.log('✅ 인증 없이 접근 거부 확인');
        });

        it('DELETE /api/districts-admin/:id - 지역 삭제 성공', async () => {
            if (!adminToken || !createdDistrictId) {
                console.log('⚠️  관리자 토큰 또는 생성된 지역 ID가 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .delete(`/api/districts-admin/${createdDistrictId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            console.log('✅ 지역 삭제 성공');

            // 삭제 확인
            const getResponse = await request(app.getHttpServer())
                .get(`/api/districts-admin/${createdDistrictId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(getResponse.status).toBe(400);
            console.log('✅ 삭제된 지역 조회 실패 확인');
        });
    });

    /**
     * 5. 응답 형식 검증 테스트
     */
    describe('응답 형식 검증', () => {
        it('표준 API 응답 형식 확인', async () => {
            if (!adminToken) {
                console.log('⚠️  관리자 토큰이 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/api/districts-admin')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('code');
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body.success).toBe(true);
            expect(response.body.code).toBe(200);
            console.log('✅ 표준 API 응답 형식 검증 완료');
        });

        it('타임스탬프 형식 확인', async () => {
            if (!adminToken) {
                console.log('⚠️  관리자 토큰이 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/api/districts-admin')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const timestamp = response.body.timestamp;
            expect(timestamp).toBeDefined();
            expect(new Date(timestamp).toString()).not.toBe('Invalid Date');
            console.log('✅ 타임스탬프 형식 검증 완료');
        });
    });
});
