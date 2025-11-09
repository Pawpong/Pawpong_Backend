import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import request from 'supertest';

import { createTestingApp, cleanupDatabase } from '../../../../common/test/test-utils';

/**
 * Standard Question Admin 도메인 E2E 테스트
 *
 * 테스트 대상 API:
 * 1. 표준 질문 목록 조회
 * 2. 표준 질문 수정
 * 3. 표준 질문 활성화/비활성화
 * 4. 표준 질문 순서 변경
 * 5. 표준 질문 재시딩
 */
describe('Standard Question Admin API E2E Tests', () => {
    let app: INestApplication;
    let adminToken: string;
    let adminId: string;
    let questionId: string;

    beforeAll(async () => {
        app = await createTestingApp();

        // 관리자 계정 생성
        const timestamp = Date.now();
        const connection = app.get<Connection>(getConnectionToken());
        const adminCollection = connection.collection('admins');

        const admin = {
            name: '질문관리자',
            email: `question_admin_${timestamp}@test.com`,
            status: 'active',
            adminLevel: 'super_admin',
            permissions: {
                canManageUsers: true,
                canManageBreeders: true,
                canManageReports: true,
                canViewStatistics: true,
            },
            activityLogs: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await adminCollection.insertOne(admin);
        adminId = result.insertedId.toString();

        // TODO: 관리자 로그인 API 구현 후 실제 토큰 획득으로 변경
        adminToken = 'mock-admin-token';

        // 표준 질문은 OnModuleInit에서 자동으로 시딩되므로 별도 생성 불필요
        // 앱 시작 시 StandardQuestionAdminService.onModuleInit()이 실행됨
    });

    afterAll(async () => {
        await cleanupDatabase(app);
        await app.close();
    });

    /**
     * 1. 표준 질문 목록 조회 테스트
     */
    describe('GET /api/standard-question-admin', () => {
        it('모든 표준 질문 조회 성공 (활성/비활성 포함)', async () => {
            // NOTE: 실제 JWT 토큰 구현 후 테스트 활성화 필요
            // const response = await request(app.getHttpServer())
            //     .get('/api/standard-question-admin')
            //     .set('Authorization', `Bearer ${adminToken}`)
            //     .expect(200);

            // expect(response.body.success).toBe(true);
            // expect(Array.isArray(response.body.data)).toBe(true);
            // expect(response.body.data.length).toBeGreaterThan(0);
            // expect(response.body.message).toContain('표준 질문 목록');

            // // 첫 번째 질문 ID 저장 (다른 테스트에서 사용)
            // if (response.body.data.length > 0) {
            //     questionId = response.body.data[0].id;
            // }

            console.log('⚠️ 관리자 JWT 인증 구현 후 테스트 활성화 필요');
        });

        it('질문이 order 순서대로 정렬되어 조회됨', async () => {
            // NOTE: 실제 JWT 토큰 구현 후 테스트 활성화 필요
            // const response = await request(app.getHttpServer())
            //     .get('/api/standard-question-admin')
            //     .set('Authorization', `Bearer ${adminToken}`)
            //     .expect(200);

            // const questions = response.body.data;
            // for (let i = 1; i < questions.length; i++) {
            //     expect(questions[i].order).toBeGreaterThanOrEqual(questions[i - 1].order);
            // }

            console.log('⚠️ 관리자 JWT 인증 구현 후 테스트 활성화 필요');
        });

        it('인증 없이 접근 시 401 에러', async () => {
            const response = await request(app.getHttpServer()).get('/api/standard-question-admin').expect(401);

            console.log('✅ 인증 없이 접근 실패 확인');
        });
    });

    /**
     * 2. 표준 질문 수정 테스트
     */
    describe('PUT /api/standard-question-admin/:id', () => {
        beforeAll(async () => {
            // 수정 테스트용 질문 ID 획득
            // NOTE: 실제 JWT 토큰 구현 후 테스트 활성화 필요
            // const response = await request(app.getHttpServer())
            //     .get('/api/standard-question-admin')
            //     .set('Authorization', `Bearer ${adminToken}`)
            //     .expect(200);

            // if (response.body.data.length > 0) {
            //     questionId = response.body.data[0].id;
            // }
        });

        it('질문 제목과 설명 수정 성공', async () => {
            // NOTE: 실제 JWT 토큰 구현 후 테스트 활성화 필요
            // const response = await request(app.getHttpServer())
            //     .put(`/api/standard-question-admin/${questionId}`)
            //     .set('Authorization', `Bearer ${adminToken}`)
            //     .send({
            //         title: '수정된 질문 제목',
            //         description: '수정된 질문 설명',
            //     })
            //     .expect(200);

            // expect(response.body.success).toBe(true);
            // expect(response.body.data.title).toBe('수정된 질문 제목');
            // expect(response.body.data.description).toBe('수정된 질문 설명');
            // expect(response.body.message).toContain('표준 질문이 수정');

            console.log('⚠️ 관리자 JWT 인증 구현 후 테스트 활성화 필요');
        });

        it('필수 여부 변경 성공', async () => {
            // NOTE: 실제 JWT 토큰 구현 후 테스트 활성화 필요
            // const response = await request(app.getHttpServer())
            //     .put(`/api/standard-question-admin/${questionId}`)
            //     .set('Authorization', `Bearer ${adminToken}`)
            //     .send({
            //         isRequired: false,
            //     })
            //     .expect(200);

            // expect(response.body.success).toBe(true);
            // expect(response.body.data.isRequired).toBe(false);

            console.log('⚠️ 관리자 JWT 인증 구현 후 테스트 활성화 필요');
        });

        it('존재하지 않는 질문 수정 시 400 에러', async () => {
            // NOTE: 실제 JWT 토큰 구현 후 테스트 활성화 필요
            // const response = await request(app.getHttpServer())
            //     .put('/api/standard-question-admin/invalid-id')
            //     .set('Authorization', `Bearer ${adminToken}`)
            //     .send({
            //         title: '수정 시도',
            //     })
            //     .expect(400);

            console.log('⚠️ 관리자 JWT 인증 구현 후 테스트 활성화 필요');
        });

        it('인증 없이 접근 시 401 에러', async () => {
            const response = await request(app.getHttpServer())
                .put('/api/standard-question-admin/some-id')
                .send({
                    title: '수정 시도',
                })
                .expect(401);

            console.log('✅ 인증 없이 접근 실패 확인');
        });
    });

    /**
     * 3. 표준 질문 활성화/비활성화 테스트
     */
    describe('PATCH /api/standard-question-admin/:id/status', () => {
        it('질문 비활성화 성공', async () => {
            // NOTE: 실제 JWT 토큰 구현 후 테스트 활성화 필요
            // const response = await request(app.getHttpServer())
            //     .patch(`/api/standard-question-admin/${questionId}/status`)
            //     .set('Authorization', `Bearer ${adminToken}`)
            //     .send({
            //         isActive: false,
            //     })
            //     .expect(200);

            // expect(response.body.success).toBe(true);
            // expect(response.body.data.isActive).toBe(false);
            // expect(response.body.message).toContain('표준 질문 상태가 변경');

            console.log('⚠️ 관리자 JWT 인증 구현 후 테스트 활성화 필요');
        });

        it('질문 활성화 성공', async () => {
            // NOTE: 실제 JWT 토큰 구현 후 테스트 활성화 필요
            // const response = await request(app.getHttpServer())
            //     .patch(`/api/standard-question-admin/${questionId}/status`)
            //     .set('Authorization', `Bearer ${adminToken}`)
            //     .send({
            //         isActive: true,
            //     })
            //     .expect(200);

            // expect(response.body.success).toBe(true);
            // expect(response.body.data.isActive).toBe(true);

            console.log('⚠️ 관리자 JWT 인증 구현 후 테스트 활성화 필요');
        });

        it('isActive 필드 누락 시 400 에러', async () => {
            // NOTE: 실제 JWT 토큰 구현 후 테스트 활성화 필요
            // const response = await request(app.getHttpServer())
            //     .patch(`/api/standard-question-admin/${questionId}/status`)
            //     .set('Authorization', `Bearer ${adminToken}`)
            //     .send({})
            //     .expect(400);

            console.log('⚠️ 관리자 JWT 인증 구현 후 테스트 활성화 필요');
        });

        it('인증 없이 접근 시 401 에러', async () => {
            const response = await request(app.getHttpServer())
                .patch('/api/standard-question-admin/some-id/status')
                .send({
                    isActive: false,
                })
                .expect(401);

            console.log('✅ 인증 없이 접근 실패 확인');
        });
    });

    /**
     * 4. 표준 질문 순서 변경 테스트
     */
    describe('POST /api/standard-question-admin/reorder', () => {
        let questionIds: string[];

        beforeAll(async () => {
            // 순서 변경 테스트용 질문 ID 여러 개 획득
            // NOTE: 실제 JWT 토큰 구현 후 테스트 활성화 필요
            // const response = await request(app.getHttpServer())
            //     .get('/api/standard-question-admin')
            //     .set('Authorization', `Bearer ${adminToken}`)
            //     .expect(200);

            // questionIds = response.body.data.slice(0, 3).map((q) => q.id);
        });

        it('질문 순서 변경 성공', async () => {
            // NOTE: 실제 JWT 토큰 구현 후 테스트 활성화 필요
            // const reorderData = [
            //     { id: questionIds[0], order: 3 },
            //     { id: questionIds[1], order: 1 },
            //     { id: questionIds[2], order: 2 },
            // ];

            // const response = await request(app.getHttpServer())
            //     .post('/api/standard-question-admin/reorder')
            //     .set('Authorization', `Bearer ${adminToken}`)
            //     .send({ reorderData })
            //     .expect(200);

            // expect(response.body.success).toBe(true);
            // expect(response.body.data.message).toContain('질문 순서가 성공적으로 변경');
            // expect(response.body.message).toContain('표준 질문 순서가 변경');

            console.log('⚠️ 관리자 JWT 인증 구현 후 테스트 활성화 필요');
        });

        it('순서 변경 후 질문이 새로운 순서대로 조회됨', async () => {
            // NOTE: 실제 JWT 토큰 구현 후 테스트 활성화 필요
            // const reorderData = [
            //     { id: questionIds[0], order: 2 },
            //     { id: questionIds[1], order: 1 },
            // ];

            // await request(app.getHttpServer())
            //     .post('/api/standard-question-admin/reorder')
            //     .set('Authorization', `Bearer ${adminToken}`)
            //     .send({ reorderData })
            //     .expect(200);

            // // 순서 변경 후 조회
            // const response = await request(app.getHttpServer())
            //     .get('/api/standard-question-admin')
            //     .set('Authorization', `Bearer ${adminToken}`)
            //     .expect(200);

            // const question1 = response.body.data.find((q) => q.id === questionIds[0]);
            // const question2 = response.body.data.find((q) => q.id === questionIds[1]);
            // expect(question1.order).toBe(2);
            // expect(question2.order).toBe(1);

            console.log('⚠️ 관리자 JWT 인증 구현 후 테스트 활성화 필요');
        });

        it('빈 배열로 순서 변경 시 400 에러', async () => {
            // NOTE: 실제 JWT 토큰 구현 후 테스트 활성화 필요
            // const response = await request(app.getHttpServer())
            //     .post('/api/standard-question-admin/reorder')
            //     .set('Authorization', `Bearer ${adminToken}`)
            //     .send({ reorderData: [] })
            //     .expect(400);

            console.log('⚠️ 관리자 JWT 인증 구현 후 테스트 활성화 필요');
        });

        it('인증 없이 접근 시 401 에러', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/standard-question-admin/reorder')
                .send({
                    reorderData: [{ id: 'some-id', order: 1 }],
                })
                .expect(401);

            console.log('✅ 인증 없이 접근 실패 확인');
        });
    });

    /**
     * 5. 표준 질문 재시딩 테스트
     */
    describe('POST /api/standard-question-admin/reseed', () => {
        it('표준 질문 재시딩 성공', async () => {
            // NOTE: 실제 JWT 토큰 구현 후 테스트 활성화 필요
            // const response = await request(app.getHttpServer())
            //     .post('/api/standard-question-admin/reseed')
            //     .set('Authorization', `Bearer ${adminToken}`)
            //     .expect(200);

            // expect(response.body.success).toBe(true);
            // expect(response.body.data.message).toContain('표준 질문이 재시딩');
            // expect(response.body.message).toContain('표준 질문이 재시딩');

            console.log('⚠️ 관리자 JWT 인증 구현 후 테스트 활성화 필요');
        });

        it('재시딩 후 초기 질문이 생성됨', async () => {
            // NOTE: 실제 JWT 토큰 구현 후 테스트 활성화 필요
            // await request(app.getHttpServer())
            //     .post('/api/standard-question-admin/reseed')
            //     .set('Authorization', `Bearer ${adminToken}`)
            //     .expect(200);

            // // 재시딩 후 질문 목록 조회
            // const response = await request(app.getHttpServer())
            //     .get('/api/standard-question-admin')
            //     .set('Authorization', `Bearer ${adminToken}`)
            //     .expect(200);

            // expect(response.body.data.length).toBeGreaterThan(0);
            // // 15개의 초기 질문이 생성되어야 함
            // expect(response.body.data.length).toBe(15);

            console.log('⚠️ 관리자 JWT 인증 구현 후 테스트 활성화 필요');
        });

        it('인증 없이 접근 시 401 에러', async () => {
            const response = await request(app.getHttpServer()).post('/api/standard-question-admin/reseed').expect(401);

            console.log('✅ 인증 없이 접근 실패 확인');
        });
    });

    /**
     * 6. 권한 검증 테스트
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
                    email: `forbidden_question_${timestamp}_${providerId}@test.com`,
                    nickname: `권한테스트${timestamp}`,
                    phone: '010-5555-5555',
                    profileImage: 'https://example.com/profile.jpg',
                })
                .expect(200);

            const adopterToken = adopterResponse.body.data.accessToken;

            // 관리자 API에 입양자 토큰으로 접근 시도
            const response = await request(app.getHttpServer())
                .get('/api/standard-question-admin')
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(403);

            console.log('✅ 일반 사용자의 표준 질문 관리 API 접근 거부 확인');
        });

        it('브리더 토큰으로 접근 시 403 에러', async () => {
            // 브리더 생성
            const timestamp = Date.now();
            const breederResponse = await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send({
                    email: `forbidden_breeder_question_${timestamp}@test.com`,
                    phoneNumber: '010-6666-6666',
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

            // 관리자 API에 브리더 토큰으로 접근 시도
            const response = await request(app.getHttpServer())
                .get('/api/standard-question-admin')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(403);

            console.log('✅ 브리더의 표준 질문 관리 API 접근 거부 확인');
        });
    });
});
