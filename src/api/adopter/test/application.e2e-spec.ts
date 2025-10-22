import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { AppModule } from '../../../app.module';

/**
 * 입양 신청 End-to-End 테스트
 * 입양 신청 관련 모든 시나리오를 테스트합니다.
 * - 입양 신청 생성 및 관리
 * - 신청 상태 변경
 * - 신청 취소 및 수정
 * - 중복 신청 방지
 * - 브리더별 신청 관리
 */
describe('Adoption Application API (e2e)', () => {
    let app: INestApplication;
    let mongod: MongoMemoryServer;
    let adopterToken: string;
    let anotherAdopterToken: string;
    let breederToken: string;
    let breederId: string;
    let anotherBreederId: string;
    let applicationId: string;

    beforeAll(async () => {
        // 메모리 내 MongoDB 서버 시작
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [MongooseModule.forRoot(uri), AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // 테스트용 입양자 생성
        const adopterResponse = await request(app.getHttpServer()).post('/api/auth/register/adopter').send({
            email: 'adopter@application.test',
            password: 'testpassword123',
            name: 'Test Adopter',
            phone: '010-1234-5678',
        });
        adopterToken = adopterResponse.body.access_token;

        // 두 번째 입양자 생성
        const anotherAdopterResponse = await request(app.getHttpServer()).post('/api/auth/register/adopter').send({
            email: 'another@application.test',
            password: 'testpassword123',
            name: 'Another Adopter',
            phone: '010-9999-9999',
        });
        anotherAdopterToken = anotherAdopterResponse.body.access_token;

        // 테스트용 브리더 생성
        const breederResponse = await request(app.getHttpServer()).post('/api/auth/register/breeder').send({
            email: 'breeder@application.test',
            password: 'testpassword123',
            name: 'Test Breeder',
            phone: '010-9876-5432',
            businessNumber: '123-45-67890',
            businessName: 'Test Pet Farm',
        });
        breederToken = breederResponse.body.access_token;
        breederId = breederResponse.body.user.id;

        // 두 번째 브리더 생성
        const anotherBreederResponse = await request(app.getHttpServer()).post('/api/auth/register/breeder').send({
            email: 'another.breeder@application.test',
            password: 'testpassword123',
            name: 'Another Breeder',
            phone: '010-5555-5555',
            businessNumber: '987-65-43210',
            businessName: 'Another Pet Farm',
        });
        anotherBreederId = anotherBreederResponse.body.user.id;
    });

    afterAll(async () => {
        await app.close();
        await mongod.stop();
    });

    describe('Application Creation', () => {
        const baseApplicationData = {
            message: '이 반려동물을 입양하고 싶습니다',
            experienceLevel: 'beginner',
            livingEnvironment: 'apartment',
            hasOtherPets: false,
            hasCarpetedFloor: true,
            workingHours: '9to5',
            familyMembers: 2,
            monthlyBudget: 500000,
        };

        it('POST /api/adopter/application - 입양 신청 생성 성공', async () => {
            const applicationData = {
                ...baseApplicationData,
                breederId,
                petId: 'test-pet-id-001',
            };

            await request(app.getHttpServer())
                .post('/api/adopter/application')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(applicationData)
                .expect(201)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.applicationId).toBeDefined();
                    expect(res.body.item.status).toBe('pending');
                    expect(res.body.item.breederId).toBe(breederId);
                    expect(res.body.item.petId).toBe('test-pet-id-001');
                    expect(res.body.message).toContain('입양 신청이 완료되었습니다');

                    applicationId = res.body.item.applicationId;
                });
        });

        it('POST /api/adopter/application - 상세 정보가 포함된 신청', async () => {
            const detailedApplicationData = {
                ...baseApplicationData,
                breederId: anotherBreederId,
                petId: 'test-pet-id-002',
                preferredMeetingTime: '주말 오후',
                additionalQuestions: [
                    {
                        question: '반려동물 경험이 있나요?',
                        answer: '예, 5년 전에 강아지를 키운 경험이 있습니다.',
                    },
                    {
                        question: '하루에 몇 시간 함께할 수 있나요?',
                        answer: '재택근무를 하기 때문에 하루 종일 함께할 수 있습니다.',
                    },
                ],
                emergencyContact: {
                    name: '김응급',
                    phone: '010-1111-2222',
                    relationship: '가족',
                },
            };

            await request(app.getHttpServer())
                .post('/api/adopter/application')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(detailedApplicationData)
                .expect(201)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.additionalQuestions).toHaveLength(2);
                    expect(res.body.item.emergencyContact).toBeDefined();
                    expect(res.body.item.preferredMeetingTime).toBe('주말 오후');
                });
        });

        it('POST /api/adopter/application - 필수 필드 누락', async () => {
            const incompleteData = {
                breederId,
                // petId 누락
                message: '입양하고 싶습니다',
            };

            await request(app.getHttpServer())
                .post('/api/adopter/application')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(incompleteData)
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('petId는 필수 입력');
                });
        });

        it('POST /api/adopter/application - 존재하지 않는 브리더', async () => {
            const invalidData = {
                ...baseApplicationData,
                breederId: 'nonexistent-breeder-id',
                petId: 'test-pet-id-003',
            };

            await request(app.getHttpServer())
                .post('/api/adopter/application')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(invalidData)
                .expect(404)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('브리더를 찾을 수 없습니다');
                });
        });

        it('POST /api/adopter/application - 인증되지 않은 요청', async () => {
            const applicationData = {
                ...baseApplicationData,
                breederId,
                petId: 'test-pet-id-004',
            };

            await request(app.getHttpServer())
                .post('/api/adopter/application')
                .send(applicationData)
                .expect(401)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('인증이 필요합니다');
                });
        });
    });

    describe('Duplicate Application Prevention', () => {
        it('POST /api/adopter/application - 동일한 반려동물에 중복 신청 방지', async () => {
            const duplicateData = {
                breederId,
                petId: 'test-pet-id-001', // 이미 신청한 반려동물
                message: '다시 신청합니다',
                experienceLevel: 'expert',
                livingEnvironment: 'house',
                hasOtherPets: true,
            };

            await request(app.getHttpServer())
                .post('/api/adopter/application')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(duplicateData)
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('이미 해당 반려동물에 입양 신청을 하셨습니다');
                });
        });

        it('POST /api/adopter/application - 다른 입양자는 같은 반려동물 신청 가능', async () => {
            const sameData = {
                breederId,
                petId: 'test-pet-id-001', // 첫 번째 입양자가 신청한 반려동물
                message: '저도 입양하고 싶습니다',
                experienceLevel: 'intermediate',
                livingEnvironment: 'house',
                hasOtherPets: false,
            };

            await request(app.getHttpServer())
                .post('/api/adopter/application')
                .set('Authorization', `Bearer ${anotherAdopterToken}`)
                .send(sameData)
                .expect(201)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.applicationId).toBeDefined();
                });
        });
    });

    describe('Application Management', () => {
        it('GET /api/adopter/application/:id - 신청 상세 조회', async () => {
            await request(app.getHttpServer())
                .get(`/api/adopter/application/${applicationId}`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.applicationId).toBe(applicationId);
                    expect(res.body.item.status).toBeDefined();
                    expect(res.body.item.breederId).toBe(breederId);
                    expect(res.body.item.appliedAt).toBeDefined();
                });
        });

        it('GET /api/adopter/applications - 내 신청 목록 조회', async () => {
            await request(app.getHttpServer())
                .get('/api/adopter/applications')
                .set('Authorization', `Bearer ${adopterToken}`)
                .query({
                    page: 1,
                    limit: 10,
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(Array.isArray(res.body.item.applications)).toBe(true);
                    expect(res.body.item.pageInfo).toBeDefined();
                    expect(res.body.item.applications.length).toBeGreaterThan(0);
                });
        });

        it('GET /api/adopter/applications - 상태별 필터링', async () => {
            await request(app.getHttpServer())
                .get('/api/adopter/applications')
                .set('Authorization', `Bearer ${adopterToken}`)
                .query({
                    status: 'pending',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    const applications = res.body.item.applications;
                    applications.forEach((application) => {
                        expect(application.status).toBe('pending');
                    });
                });
        });

        it('PATCH /api/adopter/application/:id - 신청 정보 수정', async () => {
            const updateData = {
                message: '수정된 신청 메시지입니다',
                experienceLevel: 'intermediate',
                monthlyBudget: 700000,
            };

            await request(app.getHttpServer())
                .patch(`/api/adopter/application/${applicationId}`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(updateData)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.message).toBe(updateData.message);
                    expect(res.body.item.experienceLevel).toBe(updateData.experienceLevel);
                    expect(res.body.item.monthlyBudget).toBe(updateData.monthlyBudget);
                    expect(res.body.item.updatedAt).toBeDefined();
                });
        });

        it('DELETE /api/adopter/application/:id - 신청 취소', async () => {
            await request(app.getHttpServer())
                .delete(`/api/adopter/application/${applicationId}`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({
                    reason: '다른 반려동물을 입양하기로 결정했습니다',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.message).toContain('신청이 취소되었습니다');
                });
        });

        it('GET /api/adopter/application/:id - 취소된 신청 조회', async () => {
            await request(app.getHttpServer())
                .get(`/api/adopter/application/${applicationId}`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.status).toBe('cancelled');
                    expect(res.body.item.cancelledAt).toBeDefined();
                    expect(res.body.item.cancelReason).toBe('다른 반려동물을 입양하기로 결정했습니다');
                });
        });
    });

    describe('Application Status Transitions', () => {
        let newApplicationId: string;

        beforeAll(async () => {
            // 상태 변경 테스트용 새 신청 생성
            const applicationData = {
                breederId,
                petId: 'test-pet-id-status',
                message: '상태 변경 테스트용 신청',
                experienceLevel: 'beginner',
                livingEnvironment: 'apartment',
                hasOtherPets: false,
            };

            const response = await request(app.getHttpServer())
                .post('/api/adopter/application')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(applicationData);

            newApplicationId = response.body.item.applicationId;
        });

        it('신청 상태 변경 내역 조회', async () => {
            await request(app.getHttpServer())
                .get(`/api/adopter/application/${newApplicationId}/history`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(Array.isArray(res.body.item.history)).toBe(true);
                    expect(res.body.item.history[0].status).toBe('pending');
                    expect(res.body.item.history[0].timestamp).toBeDefined();
                });
        });
    });

    describe('Access Control', () => {
        it('GET /api/adopter/application/:id - 다른 입양자의 신청 조회 차단', async () => {
            await request(app.getHttpServer())
                .get(`/api/adopter/application/${applicationId}`)
                .set('Authorization', `Bearer ${anotherAdopterToken}`)
                .expect(403)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('해당 신청에 접근할 권한이 없습니다');
                });
        });

        it('PATCH /api/adopter/application/:id - 다른 입양자의 신청 수정 차단', async () => {
            const updateData = {
                message: '다른 사람의 신청을 수정하려고 시도',
            };

            await request(app.getHttpServer())
                .patch(`/api/adopter/application/${applicationId}`)
                .set('Authorization', `Bearer ${anotherAdopterToken}`)
                .send(updateData)
                .expect(403)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('해당 신청에 접근할 권한이 없습니다');
                });
        });

        it('브리더는 자신에게 온 신청만 조회 가능', async () => {
            await request(app.getHttpServer())
                .get('/api/adopter/applications')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(403) // 브리더는 입양자 전용 엔드포인트 접근 불가
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                });
        });
    });

    describe('Input Validation', () => {
        it('POST /api/adopter/application - 유효하지 않은 경험 수준', async () => {
            const invalidData = {
                breederId,
                petId: 'test-pet-id-invalid-001',
                message: '입양 신청합니다',
                experienceLevel: 'invalid_level', // 잘못된 값
                livingEnvironment: 'apartment',
                hasOtherPets: false,
            };

            await request(app.getHttpServer())
                .post('/api/adopter/application')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(invalidData)
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('유효하지 않은 경험 수준입니다');
                });
        });

        it('POST /api/adopter/application - 유효하지 않은 거주 환경', async () => {
            const invalidData = {
                breederId,
                petId: 'test-pet-id-invalid-002',
                message: '입양 신청합니다',
                experienceLevel: 'beginner',
                livingEnvironment: 'invalid_environment', // 잘못된 값
                hasOtherPets: false,
            };

            await request(app.getHttpServer())
                .post('/api/adopter/application')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(invalidData)
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('유효하지 않은 거주 환경입니다');
                });
        });

        it('POST /api/adopter/application - 음수 예산', async () => {
            const invalidData = {
                breederId,
                petId: 'test-pet-id-invalid-003',
                message: '입양 신청합니다',
                experienceLevel: 'beginner',
                livingEnvironment: 'apartment',
                hasOtherPets: false,
                monthlyBudget: -100000, // 음수
            };

            await request(app.getHttpServer())
                .post('/api/adopter/application')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(invalidData)
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('월 예산은 0원 이상이어야 합니다');
                });
        });

        it('POST /api/adopter/application - 너무 긴 메시지', async () => {
            const invalidData = {
                breederId,
                petId: 'test-pet-id-invalid-004',
                message: 'A'.repeat(2001), // 2000자 초과
                experienceLevel: 'beginner',
                livingEnvironment: 'apartment',
                hasOtherPets: false,
            };

            await request(app.getHttpServer())
                .post('/api/adopter/application')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(invalidData)
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('메시지는 최대 2000자까지');
                });
        });
    });

    describe('Response Structure Validation', () => {
        it('신청 생성 응답이 표준 구조를 따르는지 확인', async () => {
            const applicationData = {
                breederId,
                petId: 'test-pet-id-response',
                message: '응답 구조 테스트용 신청',
                experienceLevel: 'beginner',
                livingEnvironment: 'apartment',
                hasOtherPets: false,
            };

            await request(app.getHttpServer())
                .post('/api/adopter/application')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(applicationData)
                .expect(201)
                .expect((res: any) => {
                    // API 응답 표준 구조
                    expect(res.body.success).toBe(true);
                    expect(res.body.code).toBe(201);
                    expect(res.body.item).toBeDefined();
                    expect(res.body.message).toBeDefined();
                    expect(res.body.timestamp).toBeDefined();

                    // 신청 생성 전용 구조
                    expect(res.body.item.applicationId).toBeDefined();
                    expect(res.body.item.status).toBe('pending');
                    expect(res.body.item.breederId).toBeDefined();
                    expect(res.body.item.petId).toBeDefined();
                    expect(res.body.item.appliedAt).toBeDefined();
                });
        });

        it('신청 목록 조회 응답이 페이지네이션 표준을 따르는지 확인', async () => {
            await request(app.getHttpServer())
                .get('/api/adopter/applications')
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    // 페이지네이션 구조
                    expect(res.body.item.applications).toBeDefined();
                    expect(res.body.item.pageInfo).toBeDefined();
                    expect(res.body.item.pageInfo.currentPage).toBeDefined();
                    expect(res.body.item.pageInfo.totalItems).toBeDefined();
                    expect(res.body.item.pageInfo.totalPages).toBeDefined();
                    expect(res.body.item.pageInfo.hasNextPage).toBeDefined();
                    expect(res.body.item.pageInfo.hasPrevPage).toBeDefined();
                });
        });
    });
});
