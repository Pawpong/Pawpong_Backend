import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { AppModule } from '../../../app.module';
import { AuthHelper, createTestingApp } from '../../../../test/test-utils';

/**
 * Breeder Management API End-to-End 테스트
 * 브리더 관리 API 엔드포인트를 테스트합니다.
 * - 대시보드 조회
 * - 프로필 관리
 * - 인증 관리
 * - 부모견/묘 관리
 * - 분양 개체 관리
 * - 입양 신청 관리
 * - 입양 신청 폼 관리
 */
describe('Breeder Management API (e2e)', () => {
    let app: INestApplication;
    let mongod: MongoMemoryServer;
    let breederToken: string;
    let breederId: string;
    let adopterToken: string;
    let adopterId: string;

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

        // 테스트용 브리더 생성
        const authHelper = new AuthHelper(app);
        const breeder = await authHelper.getBreederToken();
        breederToken = breeder.accessToken;
        breederId = breeder.userId;

        // 테스트용 입양자 생성
        const adopter = await authHelper.getAdopterToken();
        adopterToken = adopter.accessToken;
        adopterId = adopter.userId;
    });

    afterAll(async () => {
        await app.close();
        await mongod.stop();
    });

    describe('Dashboard Management', () => {
        it('GET /api/breeder-management/dashboard - 대시보드 조회 성공', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder-management/dashboard')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('item');
            expect(response.body.item).toHaveProperty('stats');
        });

        it('GET /api/breeder-management/dashboard - 인증 없이 접근 실패', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder-management/dashboard')
                .expect(401);
        });

        it('GET /api/breeder-management/dashboard - 입양자로 접근 실패', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder-management/dashboard')
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(403);
        });
    });

    describe('Profile Management', () => {
        it('GET /api/breeder-management/profile - 프로필 조회 성공', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder-management/profile')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('item');
            expect(response.body.item).toHaveProperty('userId');
        });

        it('PATCH /api/breeder-management/profile - 프로필 수정 성공', async () => {
            const updateData = {
                profile: {
                    description: '업데이트된 프로필 설명',
                    experienceYears: 5,
                },
            };

            const response = await request(app.getHttpServer())
                .patch('/api/breeder-management/profile')
                .set('Authorization', `Bearer ${breederToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('item');
        });

        it('GET /api/breeder-management/profile - 인증 없이 접근 실패', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder-management/profile')
                .expect(401);
        });
    });

    describe('Verification Management', () => {
        it('GET /api/breeder-management/verification - 인증 상태 조회 성공', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder-management/verification')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('item');
            expect(response.body.item).toHaveProperty('verificationStatus');
        });

        it('POST /api/breeder-management/verification - 인증 신청 성공', async () => {
            const verificationData = {
                documents: ['document1.pdf', 'document2.pdf'],
                businessNumber: '123-45-67890',
            };

            const response = await request(app.getHttpServer())
                .post('/api/breeder-management/verification')
                .set('Authorization', `Bearer ${breederToken}`)
                .send(verificationData)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
        });

        it('GET /api/breeder-management/verification - 인증 없이 접근 실패', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder-management/verification')
                .expect(401);
        });
    });

    describe('Parent Pet Management', () => {
        let parentPetId: string;

        it('POST /api/breeder-management/parent-pets - 부모견/묘 추가 성공', async () => {
            const parentPetData = {
                name: '테스트 부모견',
                breed: '포메라니안',
                gender: 'male',
                birthDate: '2020-01-01',
                registrationNumber: 'TEST-12345',
            };

            const response = await request(app.getHttpServer())
                .post('/api/breeder-management/parent-pets')
                .set('Authorization', `Bearer ${breederToken}`)
                .send(parentPetData)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.item).toHaveProperty('petId');
            parentPetId = response.body.item.petId;
        });

        it('PUT /api/breeder-management/parent-pets/:petId - 부모견/묘 수정 성공', async () => {
            if (!parentPetId) {
                return;
            }

            const updateData = {
                name: '수정된 부모견',
            };

            const response = await request(app.getHttpServer())
                .put(`/api/breeder-management/parent-pets/${parentPetId}`)
                .set('Authorization', `Bearer ${breederToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
        });

        it('DELETE /api/breeder-management/parent-pets/:petId - 부모견/묘 삭제 성공', async () => {
            if (!parentPetId) {
                return;
            }

            const response = await request(app.getHttpServer())
                .delete(`/api/breeder-management/parent-pets/${parentPetId}`)
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
        });

        it('POST /api/breeder-management/parent-pets - 인증 없이 접근 실패', async () => {
            const parentPetData = {
                name: '테스트 부모견',
                breed: '포메라니안',
                gender: 'male',
                birthDate: '2020-01-01',
            };

            await request(app.getHttpServer())
                .post('/api/breeder-management/parent-pets')
                .send(parentPetData)
                .expect(401);
        });
    });

    describe('Available Pet Management', () => {
        let availablePetId: string;

        it('POST /api/breeder-management/available-pets - 분양 개체 추가 성공', async () => {
            const availablePetData = {
                name: '테스트 분양 개체',
                breed: '포메라니안',
                gender: 'female',
                birthDate: '2024-01-01',
                price: 1500000,
                petStatus: 'available',
            };

            const response = await request(app.getHttpServer())
                .post('/api/breeder-management/available-pets')
                .set('Authorization', `Bearer ${breederToken}`)
                .send(availablePetData)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.item).toHaveProperty('petId');
            availablePetId = response.body.item.petId;
        });

        it('PUT /api/breeder-management/available-pets/:petId - 분양 개체 수정 성공', async () => {
            if (!availablePetId) {
                return;
            }

            const updateData = {
                name: '수정된 분양 개체',
                price: 1800000,
            };

            const response = await request(app.getHttpServer())
                .put(`/api/breeder-management/available-pets/${availablePetId}`)
                .set('Authorization', `Bearer ${breederToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
        });

        it('PATCH /api/breeder-management/available-pets/:petId/status - 분양 상태 변경 성공', async () => {
            if (!availablePetId) {
                return;
            }

            const statusData = {
                petStatus: 'reserved',
            };

            const response = await request(app.getHttpServer())
                .patch(`/api/breeder-management/available-pets/${availablePetId}/status`)
                .set('Authorization', `Bearer ${breederToken}`)
                .send(statusData)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
        });

        it('DELETE /api/breeder-management/available-pets/:petId - 분양 개체 삭제 성공', async () => {
            if (!availablePetId) {
                return;
            }

            const response = await request(app.getHttpServer())
                .delete(`/api/breeder-management/available-pets/${availablePetId}`)
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
        });

        it('POST /api/breeder-management/available-pets - 인증 없이 접근 실패', async () => {
            const availablePetData = {
                name: '테스트 분양 개체',
                breed: '포메라니안',
                gender: 'female',
                birthDate: '2024-01-01',
            };

            await request(app.getHttpServer())
                .post('/api/breeder-management/available-pets')
                .send(availablePetData)
                .expect(401);
        });
    });

    describe('Application Management', () => {
        it('GET /api/breeder-management/applications - 입양 신청 목록 조회 성공', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder-management/applications')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('item');
        });

        it('GET /api/breeder-management/applications - 페이지네이션 파라미터', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder-management/applications?page=1&take=10')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
        });

        it('GET /api/breeder-management/applications - 인증 없이 접근 실패', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder-management/applications')
                .expect(401);
        });
    });

    describe('My Pets and Reviews', () => {
        it('GET /api/breeder-management/my-pets - 내 개체 목록 조회 성공', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder-management/my-pets')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('item');
        });

        it('GET /api/breeder-management/my-pets - 페이지네이션 및 필터', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder-management/my-pets?page=1&limit=10&status=available')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
        });

        it('GET /api/breeder-management/my-reviews - 내 후기 목록 조회 성공', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder-management/my-reviews')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('item');
        });

        it('GET /api/breeder-management/my-reviews - 페이지네이션 및 필터', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder-management/my-reviews?page=1&limit=10&visibility=public')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
        });
    });

    describe('Application Form Management', () => {
        it('GET /api/breeder-management/application-form - 입양 신청 폼 조회 성공', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder-management/application-form')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('item');
            expect(response.body.item).toHaveProperty('standardQuestions');
            expect(response.body.item).toHaveProperty('customQuestions');
        });

        it('PUT /api/breeder-management/application-form - 입양 신청 폼 수정 성공', async () => {
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
                .send(formData)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
        });

        it('PUT /api/breeder-management/application-form - 잘못된 질문 ID로 실패', async () => {
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

            await request(app.getHttpServer())
                .put('/api/breeder-management/application-form')
                .set('Authorization', `Bearer ${breederToken}`)
                .send(formData)
                .expect(400);
        });

        it('GET /api/breeder-management/application-form - 인증 없이 접근 실패', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder-management/application-form')
                .expect(401);
        });
    });
});
