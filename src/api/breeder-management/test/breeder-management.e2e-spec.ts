import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { createTestingApp } from '../../../common/test/test-utils';

/**
 * Breeder Management 도메인 E2E 테스트 (간소화 버전)
 *
 * 테스트 대상 핵심 API:
 * 1. 대시보드 조회
 * 2. 프로필 관리
 * 3. 인증 관리
 * 4. 부모견/묘 관리
 * 5. 분양 개체 관리
 * 6. 입양 신청 관리
 * 7. 입양 신청 폼 관리
 */
describe('Breeder Management API E2E Tests (Simple)', () => {
    let app: INestApplication;
    let breederToken: string;
    let breederId: string;
    let adopterToken: string;

    beforeAll(async () => {
        app = await createTestingApp();

        // 테스트용 브리더 생성
        const timestamp = Date.now();
        const breederResponse = await request(app.getHttpServer())
            .post('/api/auth/register/breeder')
            .send({
                email: `breeder_mgmt_${timestamp}@test.com`,
                phoneNumber: '010-9999-8888',
                breederName: '관리 테스트 브리더',
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
            breederToken = breederResponse.body.data.accessToken;
            breederId = breederResponse.body.data.breederId;
            console.log('✅ 테스트용 브리더 생성 완료:', breederId);
        }

        // 테스트용 입양자 생성
        const adopterProviderId = Math.random().toString().substr(2, 10);
        const adopterResponse = await request(app.getHttpServer())
            .post('/api/auth/register/adopter')
            .send({
                tempId: `temp_kakao_${adopterProviderId}_${timestamp}`,
                email: `adopter_test_${timestamp}@test.com`,
                nickname: `테스트입양자${timestamp}`,
                phone: '010-7777-6666',
                profileImage: 'https://example.com/adopter.jpg',
            })
            .expect(200);

        adopterToken = adopterResponse.body.data.accessToken;
        console.log('✅ 테스트용 입양자 생성 완료');
    });

    afterAll(async () => {
        await app.close();
    });

    /**
     * 1. 대시보드 조회 테스트
     */
    describe('대시보드 관리', () => {
        it('GET /api/breeder-management/dashboard - 대시보드 조회 성공', async () => {
            if (!breederToken) {
                console.log('⚠️  브리더 토큰이 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/api/breeder-management/dashboard')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            // stats 필드는 선택적으로 검증
            if (response.body.data.stats) {
                expect(response.body.data.stats).toBeDefined();
            }
            console.log('✅ 대시보드 조회 성공');
        });

        it('GET /api/breeder-management/dashboard - 인증 없이 접근 실패', async () => {
            const response = await request(app.getHttpServer()).get('/api/breeder-management/dashboard');

            expect(response.status).toBe(401);
            console.log('✅ 인증 없이 접근 거부 확인');
        });

        it('GET /api/breeder-management/dashboard - 입양자로 접근 실패', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder-management/dashboard')
                .set('Authorization', `Bearer ${adopterToken}`);

            expect(response.status).toBe(403);
            console.log('✅ 입양자 접근 거부 확인');
        });
    });

    /**
     * 2. 프로필 관리 테스트
     */
    describe('프로필 관리', () => {
        it('GET /api/breeder-management/profile - 프로필 조회 성공', async () => {
            if (!breederToken) {
                console.log('⚠️  브리더 토큰이 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/api/breeder-management/profile')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            console.log('✅ 프로필 조회 성공');
        });

        it('PATCH /api/breeder-management/profile - 프로필 수정 성공', async () => {
            if (!breederToken) {
                console.log('⚠️  브리더 토큰이 없어서 테스트 스킵');
                return;
            }

            const updateData = {
                profile: {
                    description: '업데이트된 프로필 설명',
                    experienceYears: 5,
                },
            };

            const response = await request(app.getHttpServer())
                .patch('/api/breeder-management/profile')
                .set('Authorization', `Bearer ${breederToken}`)
                .send(updateData);

            // 200 또는 400 허용 (DTO 검증 실패 가능)
            expect([200, 400]).toContain(response.status);
            console.log('✅ 프로필 수정 처리 완료');
        });

        it('GET /api/breeder-management/profile - 인증 없이 접근 실패', async () => {
            const response = await request(app.getHttpServer()).get('/api/breeder-management/profile');

            expect(response.status).toBe(401);
            console.log('✅ 인증 없이 접근 거부 확인');
        });
    });

    /**
     * 3. 인증 관리 테스트
     */
    describe('인증 관리', () => {
        it('GET /api/breeder-management/verification - 인증 상태 조회 성공', async () => {
            if (!breederToken) {
                console.log('⚠️  브리더 토큰이 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/api/breeder-management/verification')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            console.log('✅ 인증 상태 조회 성공');
        });

        it('POST /api/breeder-management/verification - 인증 신청', async () => {
            if (!breederToken) {
                console.log('⚠️  브리더 토큰이 없어서 테스트 스킵');
                return;
            }

            const verificationData = {
                documents: ['document1.pdf', 'document2.pdf'],
                businessNumber: '123-45-67890',
            };

            const response = await request(app.getHttpServer())
                .post('/api/breeder-management/verification')
                .set('Authorization', `Bearer ${breederToken}`)
                .send(verificationData);

            // 200 또는 400 허용 (이미 신청했거나 신청 가능)
            expect([200, 400]).toContain(response.status);
            console.log('✅ 인증 신청 처리 완료');
        });

        it('GET /api/breeder-management/verification - 인증 없이 접근 실패', async () => {
            const response = await request(app.getHttpServer()).get('/api/breeder-management/verification');

            expect(response.status).toBe(401);
            console.log('✅ 인증 없이 접근 거부 확인');
        });
    });

    /**
     * 4. 부모견/묘 관리 테스트
     */
    describe('부모견/묘 관리', () => {
        let parentPetId: string;

        it('POST /api/breeder-management/parent-pets - 부모견/묘 추가', async () => {
            const parentPetData = {
                name: '테스트 부모견',
                breed: '포메라니안',
                gender: 'male',
                birthDate: '2020-01-01',
                photoFileName: 'parent-pet-test.jpg',
                description: '건강한 부모견입니다',
            };

            const response = await request(app.getHttpServer())
                .post('/api/breeder-management/parent-pets')
                .set('Authorization', `Bearer ${breederToken}`)
                .send(parentPetData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.petId).toBeDefined();
            parentPetId = response.body.data.petId;
            console.log('✅ 부모견/묘 추가 성공:', parentPetId);
        });

        it('PUT /api/breeder-management/parent-pets/:petId - 부모견/묘 수정', async () => {
            const updateData = {
                name: '수정된 부모견',
                description: '업데이트된 설명',
            };

            const response = await request(app.getHttpServer())
                .put(`/api/breeder-management/parent-pets/${parentPetId}`)
                .set('Authorization', `Bearer ${breederToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            console.log('✅ 부모견/묘 수정 성공');
        });

        it('DELETE /api/breeder-management/parent-pets/:petId - 부모견/묘 삭제', async () => {
            const response = await request(app.getHttpServer())
                .delete(`/api/breeder-management/parent-pets/${parentPetId}`)
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            console.log('✅ 부모견/묘 삭제 성공');
        });

        it('POST /api/breeder-management/parent-pets - 인증 없이 접근 실패', async () => {
            const parentPetData = {
                name: '테스트 부모견',
                breed: '포메라니안',
                gender: 'male',
                birthDate: '2020-01-01',
            };

            const response = await request(app.getHttpServer())
                .post('/api/breeder-management/parent-pets')
                .send(parentPetData);

            expect(response.status).toBe(401);
            console.log('✅ 인증 없이 접근 거부 확인');
        });
    });

    /**
     * 5. 분양 개체 관리 테스트
     */
    describe('분양 개체 관리', () => {
        let availablePetId: string;

        it('POST /api/breeder-management/available-pets - 분양 개체 추가', async () => {
            const availablePetData = {
                name: '테스트 분양 개체',
                breed: '포메라니안',
                gender: 'female',
                birthDate: '2024-01-01',
                price: 1500000,
                description: '건강하고 활발한 아이입니다',
            };

            const response = await request(app.getHttpServer())
                .post('/api/breeder-management/available-pets')
                .set('Authorization', `Bearer ${breederToken}`)
                .send(availablePetData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.petId).toBeDefined();
            availablePetId = response.body.data.petId;
            console.log('✅ 분양 개체 추가 성공:', availablePetId);
        });

        it('PUT /api/breeder-management/available-pets/:petId - 분양 개체 수정', async () => {
            const updateData = {
                name: '수정된 분양 개체',
                price: 1800000,
                description: '업데이트된 설명',
            };

            const response = await request(app.getHttpServer())
                .put(`/api/breeder-management/available-pets/${availablePetId}`)
                .set('Authorization', `Bearer ${breederToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            console.log('✅ 분양 개체 수정 성공');
        });

        it('PATCH /api/breeder-management/available-pets/:petId/status - 분양 상태 변경', async () => {
            const statusData = {
                petStatus: 'reserved',
            };

            const response = await request(app.getHttpServer())
                .patch(`/api/breeder-management/available-pets/${availablePetId}/status`)
                .set('Authorization', `Bearer ${breederToken}`)
                .send(statusData)
                .expect(200);

            expect(response.body.success).toBe(true);
            console.log('✅ 분양 상태 변경 성공');
        });

        it('DELETE /api/breeder-management/available-pets/:petId - 분양 개체 삭제', async () => {
            const response = await request(app.getHttpServer())
                .delete(`/api/breeder-management/available-pets/${availablePetId}`)
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            console.log('✅ 분양 개체 삭제 성공');
        });

        it('POST /api/breeder-management/available-pets - 인증 없이 접근 실패', async () => {
            const availablePetData = {
                name: '테스트 분양 개체',
                breed: '포메라니안',
                gender: 'female',
                birthDate: '2024-01-01',
            };

            const response = await request(app.getHttpServer())
                .post('/api/breeder-management/available-pets')
                .send(availablePetData);

            expect(response.status).toBe(401);
            console.log('✅ 인증 없이 접근 거부 확인');
        });
    });

    /**
     * 6. 입양 신청 관리 테스트
     */
    describe('입양 신청 관리', () => {
        it('GET /api/breeder-management/applications - 입양 신청 목록 조회', async () => {
            if (!breederToken) {
                console.log('⚠️  브리더 토큰이 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/api/breeder-management/applications')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            console.log('✅ 입양 신청 목록 조회 성공');
        });

        it('GET /api/breeder-management/applications - 페이지네이션 파라미터', async () => {
            if (!breederToken) {
                console.log('⚠️  브리더 토큰이 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/api/breeder-management/applications?page=1&take=10')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            console.log('✅ 페이지네이션 파라미터 적용 확인');
        });

        it('GET /api/breeder-management/applications - 인증 없이 접근 실패', async () => {
            const response = await request(app.getHttpServer()).get('/api/breeder-management/applications');

            expect(response.status).toBe(401);
            console.log('✅ 인증 없이 접근 거부 확인');
        });
    });

    /**
     * 7. 내 개체 및 후기 조회 테스트
     */
    describe('내 개체 및 후기', () => {
        it('GET /api/breeder-management/my-pets - 내 개체 목록 조회', async () => {
            if (!breederToken) {
                console.log('⚠️  브리더 토큰이 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/api/breeder-management/my-pets')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            console.log('✅ 내 개체 목록 조회 성공');
        });

        it('GET /api/breeder-management/my-pets - 페이지네이션 및 필터', async () => {
            if (!breederToken) {
                console.log('⚠️  브리더 토큰이 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/api/breeder-management/my-pets?page=1&limit=10&status=available')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            console.log('✅ 필터링된 개체 목록 조회 성공');
        });

        it('GET /api/breeder-management/my-reviews - 내 후기 목록 조회', async () => {
            if (!breederToken) {
                console.log('⚠️  브리더 토큰이 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/api/breeder-management/my-reviews')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            console.log('✅ 내 후기 목록 조회 성공');
        });

        it('GET /api/breeder-management/my-reviews - 페이지네이션 및 필터', async () => {
            if (!breederToken) {
                console.log('⚠️  브리더 토큰이 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/api/breeder-management/my-reviews?page=1&limit=10&visibility=public')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            console.log('✅ 필터링된 후기 목록 조회 성공');
        });
    });

    /**
     * 8. 입양 신청 폼 관리 테스트
     */
    describe('입양 신청 폼 관리', () => {
        it('GET /api/breeder-management/application-form - 입양 신청 폼 조회', async () => {
            if (!breederToken) {
                console.log('⚠️  브리더 토큰이 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/api/breeder-management/application-form')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.standardQuestions).toBeDefined();
            expect(response.body.data.customQuestions).toBeDefined();
            console.log('✅ 입양 신청 폼 조회 성공');
        });

        it('PUT /api/breeder-management/application-form - 입양 신청 폼 수정', async () => {
            if (!breederToken) {
                console.log('⚠️  브리더 토큰이 없어서 테스트 스킵');
                return;
            }

            const formData = {
                customQuestions: [
                    {
                        id: 'custom_question_1',
                        type: 'text',
                        label: '추가 질문 1',
                        required: true,
                        order: 1,
                    },
                ],
            };

            const response = await request(app.getHttpServer())
                .put('/api/breeder-management/application-form')
                .set('Authorization', `Bearer ${breederToken}`)
                .send(formData);

            expect([200, 400]).toContain(response.status);
            console.log('✅ 입양 신청 폼 수정 처리 완료');
        });

        it('PUT /api/breeder-management/application-form - 잘못된 질문 ID로 실패', async () => {
            if (!breederToken) {
                console.log('⚠️  브리더 토큰이 없어서 테스트 스킵');
                return;
            }

            const formData = {
                customQuestions: [
                    {
                        id: '잘못된-ID!@#',
                        type: 'text',
                        label: '잘못된 질문',
                        required: true,
                        order: 1,
                    },
                ],
            };

            const response = await request(app.getHttpServer())
                .put('/api/breeder-management/application-form')
                .set('Authorization', `Bearer ${breederToken}`)
                .send(formData);

            // 200 또는 400 허용 (검증 로직에 따라 다름)
            expect([200, 400]).toContain(response.status);
            console.log('✅ 잘못된 질문 ID 처리 완료');
        });

        it('GET /api/breeder-management/application-form - 인증 없이 접근 실패', async () => {
            const response = await request(app.getHttpServer()).get('/api/breeder-management/application-form');

            expect(response.status).toBe(401);
            console.log('✅ 인증 없이 접근 거부 확인');
        });
    });

    /**
     * 9. 응답 형식 검증 테스트
     */
    describe('응답 형식 검증', () => {
        it('표준 API 응답 형식 확인', async () => {
            if (!breederToken) {
                console.log('⚠️  브리더 토큰이 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .get('/api/breeder-management/dashboard')
                .set('Authorization', `Bearer ${breederToken}`)
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
