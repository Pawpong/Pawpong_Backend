import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestingApp } from './test-utils';

/**
 * Breeder Management Domain E2E Tests
 * 브리더 관리 도메인 E2E 테스트
 *
 * 이 테스트는 인증된 브리더가 자신의 정보를 관리하는 API를 검증합니다.
 *
 * 테스트 커버리지:
 * - 대시보드 조회
 * - 프로필 관리 (조회, 수정)
 * - 인증 관리 (상태 조회, 신청)
 * - 부모견/부모묘 관리 (추가, 수정, 삭제)
 * - 분양 가능 반려동물 관리 (추가, 수정, 상태 변경, 삭제)
 * - 입양 신청 관리 (목록 조회, 상세 조회, 상태 업데이트)
 * - 개체 목록 조회
 * - 후기 목록 조회
 * - 입양 신청 폼 관�� (조회, 수정)
 */
describe('Breeder Management API (E2E)', () => {
    let app: INestApplication;
    let breederToken: string;
    let breederId: string;
    let adopterToken: string;
    let adopterId: string;
    let parentPetId: string;
    let availablePetId: string;
    let applicationId: string;

    /**
     * 테스트용 사용자 생성 헬퍼 함수
     * 브리더와 입양자를 생성하고 토큰을 반환합니다.
     */
    async function setupTestUsers() {
        // 1. 브리더 회원가입
        const breederEmail = `breeder_${Date.now()}@test.com`;
        const breederResponse = await request(app.getHttpServer())
            .post('/api/auth/register/breeder')
            .send({
                email: breederEmail,
                phoneNumber: '010-9876-5432',
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
            })
            .expect(200);

        breederToken = breederResponse.body.data.accessToken;
        breederId = breederResponse.body.data.userId;

        // 2. 입양자 회원가입
        const adopterEmail = `adopter_${Date.now()}@test.com`;
        const adopterResponse = await request(app.getHttpServer())
            .post('/api/auth/register/adopter')
            .send({
                tempId: `temp_test_${Date.now()}`,
                email: adopterEmail,
                nickname: '테스트입양자',
                phone: '010-1234-5678',
                profileImage: 'https://example.com/adopter.jpg',
            })
            .expect(200);

        adopterToken = adopterResponse.body.data.accessToken;
        adopterId = adopterResponse.body.data.userId;
    }

    beforeAll(async () => {
        app = await createTestingApp();
        await setupTestUsers();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /api/breeder-management/dashboard', () => {
        it('브리더 대시보드 정보를 조회해야 함', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder-management/dashboard')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('breederInfo');
            expect(response.body.data).toHaveProperty('statistics');
            expect(response.body.data).toHaveProperty('recentActivities');
        });

        it('인증 없이 접근 시 401 에러를 반환해야 함', async () => {
            await request(app.getHttpServer()).get('/api/breeder-management/dashboard').expect(401);
        });

        it('입양자 토큰으로 접근 시 403 에러를 반환해야 함', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder-management/dashboard')
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(403);
        });
    });

    describe('GET /api/breeder-management/profile', () => {
        it('브리더 프로필을 조회해야 함', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder-management/profile')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('breederId');
            expect(response.body.data).toHaveProperty('name');
            expect(response.body.data).toHaveProperty('email');
        });

        it('인증 없이 접근 시 401 에러를 반환해야 함', async () => {
            await request(app.getHttpServer()).get('/api/breeder-management/profile').expect(401);
        });
    });

    describe('PATCH /api/breeder-management/profile', () => {
        it('브리더 프로필을 수정해야 함', async () => {
            const response = await request(app.getHttpServer())
                .patch('/api/breeder-management/profile')
                .set('Authorization', `Bearer ${breederToken}`)
                .send({
                    profileDescription: '15년 경력의 전문 브리더로 업데이트합니다.',
                    locationInfo: {
                        cityName: '서울특별시',
                        districtName: '서초구',
                        detailAddress: '서초대로 123',
                    },
                    experienceYears: 15,
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('breederId');
            expect(response.body.message).toContain('프로필');
        });

        it('유효하지 않은 데이터로 수정 시 400 에러를 반환해야 함', async () => {
            await request(app.getHttpServer())
                .patch('/api/breeder-management/profile')
                .set('Authorization', `Bearer ${breederToken}`)
                .send({
                    experienceYears: -5, // 음수는 불가능
                })
                .expect(400);
        });

        it('인증 없이 접근 시 401 에러를 반환해야 함', async () => {
            await request(app.getHttpServer()).patch('/api/breeder-management/profile').expect(401);
        });
    });

    describe('GET /api/breeder-management/verification', () => {
        it('브리더 인증 상태를 조회해야 함', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder-management/verification')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('verificationStatus');
        });

        it('인증 없이 접근 시 401 에러를 반환해야 함', async () => {
            await request(app.getHttpServer()).get('/api/breeder-management/verification').expect(401);
        });
    });

    describe('POST /api/breeder-management/verification', () => {
        it('브리더 인증을 신청해야 함', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/breeder-management/verification')
                .set('Authorization', `Bearer ${breederToken}`)
                .send({
                    businessNumber: '123-45-67890',
                    businessName: '해피독 브리더',
                    representativeName: '테스트브리더',
                    documentUrls: ['https://example.com/business-license.pdf', 'https://example.com/certificate.pdf'],
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('verificationStatus');
            expect(response.body.message).toContain('인증 신청');
        });

        it('유효하지 않은 사업자등록번호로 신청 시 400 에러를 반환해야 함', async () => {
            await request(app.getHttpServer())
                .post('/api/breeder-management/verification')
                .set('Authorization', `Bearer ${breederToken}`)
                .send({
                    businessNumber: 'invalid',
                    businessName: '해피독 브리더',
                    representativeName: '테스트브리더',
                    documentUrls: ['https://example.com/doc.pdf'],
                })
                .expect(400);
        });

        it('인증 없이 접근 시 401 에러를 반환해야 함', async () => {
            await request(app.getHttpServer()).post('/api/breeder-management/verification').expect(401);
        });
    });

    describe('POST /api/breeder-management/parent-pets', () => {
        it('부모견/부모묘를 추가해야 함', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/breeder-management/parent-pets')
                .set('Authorization', `Bearer ${breederToken}`)
                .send({
                    name: '챔프',
                    breed: '골든리트리버',
                    gender: 'male',
                    description: '온순하고 건강한 부모견입니다',
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('petId');
            expect(response.body.message).toContain('부모 반려동물');

            // 테스트용 ID 저장
            parentPetId = response.body.data.petId;
        });

        it('필수 필드 누락 시 400 에러를 반환해야 함', async () => {
            await request(app.getHttpServer())
                .post('/api/breeder-management/parent-pets')
                .set('Authorization', `Bearer ${breederToken}`)
                .send({
                    name: '챔프',
                    // breed 누락
                    gender: 'male',
                })
                .expect(400);
        });

        it('인증 없이 접근 시 401 에러를 반환해야 함', async () => {
            await request(app.getHttpServer()).post('/api/breeder-management/parent-pets').expect(401);
        });
    });

    describe('PUT /api/breeder-management/parent-pets/:petId', () => {
        it('부모견/부모묘 정보를 수정해야 함', async () => {
            const response = await request(app.getHttpServer())
                .put(`/api/breeder-management/parent-pets/${parentPetId}`)
                .set('Authorization', `Bearer ${breederToken}`)
                .send({
                    description: '수정된 설명: 매우 온순하고 건강합니다',
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('petId');
            expect(response.body.message).toContain('수정');
        });

        it('존재하지 않는 pet ID로 수정 시 400 에러를 반환해야 함', async () => {
            await request(app.getHttpServer())
                .put('/api/breeder-management/parent-pets/invalid-id')
                .set('Authorization', `Bearer ${breederToken}`)
                .send({
                    description: '수정 시도',
                })
                .expect(400);
        });

        it('인증 없이 접근 시 401 에러를 반환해야 함', async () => {
            await request(app.getHttpServer()).put(`/api/breeder-management/parent-pets/${parentPetId}`).expect(401);
        });
    });

    describe('POST /api/breeder-management/available-pets', () => {
        it('분양 가능한 반려동물을 추가해야 함', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/breeder-management/available-pets')
                .set('Authorization', `Bearer ${breederToken}`)
                .send({
                    name: '밀크',
                    breed: '골든리트리버',
                    gender: 'female',
                    birthDate: '2024-01-15',
                    price: 1500000,
                    description: '건강하고 활발한 아이입니다',
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('petId');
            expect(response.body.message).toContain('분양 반려동물');

            // 테스트용 ID 저장
            availablePetId = response.body.data.petId;
        });

        it('필수 필드 누락 시 400 에러를 반환해야 함', async () => {
            await request(app.getHttpServer())
                .post('/api/breeder-management/available-pets')
                .set('Authorization', `Bearer ${breederToken}`)
                .send({
                    name: '밀크',
                    breed: '골든리트리버',
                    // gender, birthDate, price 누락
                })
                .expect(400);
        });

        it('유효하지 않은 가격으로 추가 시 400 에러를 반환해야 함', async () => {
            await request(app.getHttpServer())
                .post('/api/breeder-management/available-pets')
                .set('Authorization', `Bearer ${breederToken}`)
                .send({
                    name: '밀크',
                    breed: '골든리트리버',
                    gender: 'female',
                    birthDate: '2024-01-15',
                    price: -1000, // 음수 가격
                })
                .expect(400);
        });

        it('인증 없이 접근 시 401 에러를 반환해야 함', async () => {
            await request(app.getHttpServer()).post('/api/breeder-management/available-pets').expect(401);
        });
    });

    describe('PUT /api/breeder-management/available-pets/:petId', () => {
        it('분양 반려동물 정보를 수정해야 함', async () => {
            const response = await request(app.getHttpServer())
                .put(`/api/breeder-management/available-pets/${availablePetId}`)
                .set('Authorization', `Bearer ${breederToken}`)
                .send({
                    price: 1800000,
                    description: '수정된 설명: 매우 건강하고 활발합니다',
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('petId');
            expect(response.body.message).toContain('수정');
        });

        it('존재하지 않는 pet ID로 수정 시 400 에러를 반환해야 함', async () => {
            await request(app.getHttpServer())
                .put('/api/breeder-management/available-pets/invalid-id')
                .set('Authorization', `Bearer ${breederToken}`)
                .send({
                    price: 2000000,
                })
                .expect(400);
        });

        it('인증 없이 접근 시 401 에러를 반환해야 함', async () => {
            await request(app.getHttpServer()).put(`/api/breeder-management/available-pets/${availablePetId}`).expect(401);
        });
    });

    describe('PATCH /api/breeder-management/available-pets/:petId/status', () => {
        it('반려동물 상태를 변경해야 함', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/api/breeder-management/available-pets/${availablePetId}/status`)
                .set('Authorization', `Bearer ${breederToken}`)
                .send({
                    petStatus: 'reserved',
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('petId');
            expect(response.body.message).toContain('상태');
        });

        it('유효하지 않은 상태로 변경 시 400 에러를 반환해야 함', async () => {
            await request(app.getHttpServer())
                .patch(`/api/breeder-management/available-pets/${availablePetId}/status`)
                .set('Authorization', `Bearer ${breederToken}`)
                .send({
                    petStatus: 'invalid-status',
                })
                .expect(400);
        });

        it('인증 없이 접근 시 401 에러를 반환해야 함', async () => {
            await request(app.getHttpServer())
                .patch(`/api/breeder-management/available-pets/${availablePetId}/status`)
                .expect(401);
        });
    });

    describe('GET /api/breeder-management/applications', () => {
        // 입양 신청 생성 (테스트 데이터 준비)
        beforeAll(async () => {
            const response = await request(app.getHttpServer())
                .post('/api/adopter/application')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({
                    targetBreederId: breederId,
                    targetPetId: availablePetId,
                    expectedAdoptionDate: '2025-02-01',
                    isAgreedToTerms: true,
                    personalInfo: {
                        applicantName: '테스트입양자',
                        emailAddress: `adopter_${Date.now()}@test.com`,
                        phoneNumber: '010-1234-5678',
                    },
                    applicationForm: {
                        selfIntroduction: '저는 반려동물을 사랑하는 입양자입니다.',
                        familyMembers: '2명',
                        isFamilyAgreed: true,
                        hasAllergy: false,
                        dailyAwayTime: '8시간',
                        livingSpace: '아파트 20평',
                        hasPetExperience: true,
                        canHandleBasicCare: true,
                        canAffordMedicalCost: true,
                        isAgreedToNeuter: true,
                        preferredPetType: '활발한 성격',
                        desiredAdoptionTiming: '즉시',
                        additionalQuestions: '특별히 궁금한 점은 없습니다.',
                    },
                })
                .expect(200);

            applicationId = response.body.data.applicationId;
        });

        it('받은 입양 신청 목록을 조회해야 함', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder-management/applications')
                .set('Authorization', `Bearer ${breederToken}`)
                .query({ page: 1, take: 10 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('items');
            expect(response.body.data).toHaveProperty('pagination');
            expect(Array.isArray(response.body.data.items)).toBe(true);
        });

        it('페이지네이션이 올바르게 동작해야 함', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder-management/applications')
                .set('Authorization', `Bearer ${breederToken}`)
                .query({ page: 1, take: 5 })
                .expect(200);

            expect(response.body.data.pagination.pageSize).toBe(5);
            expect(response.body.data.items.length).toBeLessThanOrEqual(5);
        });

        it('인증 없이 접근 시 401 에러를 반환해야 함', async () => {
            await request(app.getHttpServer()).get('/api/breeder-management/applications').expect(401);
        });
    });

    describe('GET /api/breeder-management/applications/:applicationId', () => {
        it('특정 입양 신청의 상세 정보를 조회해야 함', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/breeder-management/applications/${applicationId}`)
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('applicationId');
            expect(response.body.data).toHaveProperty('adopterInfo');
            expect(response.body.data).toHaveProperty('applicationData');
        });

        it('존재하지 않는 신청 ID로 조회 시 400 에러를 반환해야 함', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder-management/applications/invalid-id')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(400);
        });

        it('인증 없이 접근 시 401 에러를 반환해야 함', async () => {
            await request(app.getHttpServer()).get(`/api/breeder-management/applications/${applicationId}`).expect(401);
        });
    });

    describe('PATCH /api/breeder-management/applications/:applicationId', () => {
        it('입양 신청 상태를 업데이트해야 함', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/api/breeder-management/applications/${applicationId}`)
                .set('Authorization', `Bearer ${breederToken}`)
                .send({
                    applicationStatus: 'reviewing',
                    breederMemo: '검토 중입니다',
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('applicationId');
            expect(response.body.message).toContain('상태');
        });

        it('유효하지 않은 상태로 업데이트 시 400 에러를 반환해야 함', async () => {
            await request(app.getHttpServer())
                .patch(`/api/breeder-management/applications/${applicationId}`)
                .set('Authorization', `Bearer ${breederToken}`)
                .send({
                    applicationStatus: 'invalid-status',
                })
                .expect(400);
        });

        it('인증 없이 접근 시 401 에러를 반환해야 함', async () => {
            await request(app.getHttpServer()).patch(`/api/breeder-management/applications/${applicationId}`).expect(401);
        });
    });

    describe('GET /api/breeder-management/my-pets', () => {
        it('내 개체 목록을 조회해야 함', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder-management/my-pets')
                .set('Authorization', `Bearer ${breederToken}`)
                .query({ page: 1, limit: 20 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('items');
            expect(response.body.data).toHaveProperty('pagination');
            expect(Array.isArray(response.body.data.items)).toBe(true);
        });

        it('상태 필터링이 동작해야 함', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder-management/my-pets')
                .set('Authorization', `Bearer ${breederToken}`)
                .query({ status: 'available', page: 1, limit: 20 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('items');
        });

        it('비활성화된 개체 포함 조회가 동작해야 함', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder-management/my-pets')
                .set('Authorization', `Bearer ${breederToken}`)
                .query({ includeInactive: 'true', page: 1, limit: 20 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('items');
        });

        it('인증 없이 접근 시 401 에러를 반환해야 함', async () => {
            await request(app.getHttpServer()).get('/api/breeder-management/my-pets').expect(401);
        });
    });

    describe('GET /api/breeder-management/my-reviews', () => {
        it('내게 달린 후기 목록을 조회해야 함', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder-management/my-reviews')
                .set('Authorization', `Bearer ${breederToken}`)
                .query({ page: 1, limit: 10 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('items');
            expect(response.body.data).toHaveProperty('pagination');
            expect(Array.isArray(response.body.data.items)).toBe(true);
        });

        it('공개 후기만 필터링하여 조회해야 함', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder-management/my-reviews')
                .set('Authorization', `Bearer ${breederToken}`)
                .query({ visibility: 'public', page: 1, limit: 10 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('items');
        });

        it('비공개 후기만 필터링하여 조회해야 함', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder-management/my-reviews')
                .set('Authorization', `Bearer ${breederToken}`)
                .query({ visibility: 'private', page: 1, limit: 10 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('items');
        });

        it('인증 없이 접근 시 401 에러를 반환해야 함', async () => {
            await request(app.getHttpServer()).get('/api/breeder-management/my-reviews').expect(401);
        });
    });

    describe('GET /api/breeder-management/application-form', () => {
        it('입양 신청 폼을 조회해야 함', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder-management/application-form')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('standardQuestions');
            expect(response.body.data).toHaveProperty('customQuestions');
            expect(Array.isArray(response.body.data.standardQuestions)).toBe(true);
            expect(response.body.data.standardQuestions.length).toBe(14); // 표준 14개 질문
        });

        it('인증 없이 접근 시 401 에러를 반환해야 함', async () => {
            await request(app.getHttpServer()).get('/api/breeder-management/application-form').expect(401);
        });
    });

    describe('PUT /api/breeder-management/application-form', () => {
        it('커스텀 질문을 추가하여 입양 신청 폼을 수정해야 함', async () => {
            const response = await request(app.getHttpServer())
                .put('/api/breeder-management/application-form')
                .set('Authorization', `Bearer ${breederToken}`)
                .send({
                    customQuestions: [
                        {
                            id: 'custom_pet_preference',
                            type: 'textarea',
                            label: '선호하는 반려동물의 성격을 알려주세요',
                            required: true,
                            placeholder: '예: 활발하고 사람을 좋아하는 성격',
                            order: 1,
                        },
                        {
                            id: 'custom_visit_time',
                            type: 'select',
                            label: '방문 가능한 시간대를 선택해주세요',
                            required: true,
                            options: ['오전 (09:00-12:00)', '오후 (13:00-17:00)', '저녁 (18:00-20:00)'],
                            order: 2,
                        },
                    ],
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('totalQuestions');
            expect(response.body.data).toHaveProperty('customQuestionsCount');
            expect(response.body.data.customQuestionsCount).toBe(2);
            expect(response.body.message).toContain('업데이트');
        });

        it('select 타입에 options 누락 시 400 에러를 반환해야 함', async () => {
            await request(app.getHttpServer())
                .put('/api/breeder-management/application-form')
                .set('Authorization', `Bearer ${breederToken}`)
                .send({
                    customQuestions: [
                        {
                            id: 'custom_select',
                            type: 'select',
                            label: '선택 질문',
                            required: true,
                            // options 누락
                            order: 1,
                        },
                    ],
                })
                .expect(400);
        });

        it('유효하지 않은 question ID 형식으로 추가 시 400 에러를 반환해야 함', async () => {
            await request(app.getHttpServer())
                .put('/api/breeder-management/application-form')
                .set('Authorization', `Bearer ${breederToken}`)
                .send({
                    customQuestions: [
                        {
                            id: 'invalid id!', // 공백 및 특수문자 포함
                            type: 'text',
                            label: '테스트 질문',
                            required: false,
                            order: 1,
                        },
                    ],
                })
                .expect(400);
        });

        it('인증 없이 접근 시 401 에러를 반환해야 함', async () => {
            await request(app.getHttpServer()).put('/api/breeder-management/application-form').expect(401);
        });
    });

    describe('DELETE /api/breeder-management/parent-pets/:petId', () => {
        it('부모견/부모묘를 삭제해야 함', async () => {
            const response = await request(app.getHttpServer())
                .delete(`/api/breeder-management/parent-pets/${parentPetId}`)
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('petId');
            expect(response.body.message).toContain('삭제');
        });

        it('존재하지 않는 pet ID로 삭제 시 400 에러를 반환해야 함', async () => {
            await request(app.getHttpServer())
                .delete('/api/breeder-management/parent-pets/invalid-id')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(400);
        });

        it('인증 없이 접근 시 401 에러를 반환해야 함', async () => {
            await request(app.getHttpServer()).delete(`/api/breeder-management/parent-pets/${parentPetId}`).expect(401);
        });
    });

    describe('DELETE /api/breeder-management/available-pets/:petId', () => {
        it('분양 가능한 반려동물을 삭제해야 함', async () => {
            const response = await request(app.getHttpServer())
                .delete(`/api/breeder-management/available-pets/${availablePetId}`)
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('petId');
            expect(response.body.message).toContain('삭제');
        });

        it('존재하지 않는 pet ID로 삭제 시 400 에러를 반환해야 함', async () => {
            await request(app.getHttpServer())
                .delete('/api/breeder-management/available-pets/invalid-id')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(400);
        });

        it('인증 없이 접근 시 401 에러를 반환해야 함', async () => {
            await request(app.getHttpServer()).delete(`/api/breeder-management/available-pets/${availablePetId}`).expect(401);
        });
    });

    describe('통합 시나리오: 브리더 관리 전체 플로우', () => {
        it('브리더가 프로필 수정 → 반려동물 등록 → 입양 신청 받기 → 상태 업데이트 플로우를 완료해야 함', async () => {
            // 1. 프로필 수정
            const profileResponse = await request(app.getHttpServer())
                .patch('/api/breeder-management/profile')
                .set('Authorization', `Bearer ${breederToken}`)
                .send({
                    profileDescription: '통합 테스트용 프로필',
                    experienceYears: 20,
                })
                .expect(200);
            expect(profileResponse.body.success).toBe(true);

            // 2. 부모견 등록
            const parentPetResponse = await request(app.getHttpServer())
                .post('/api/breeder-management/parent-pets')
                .set('Authorization', `Bearer ${breederToken}`)
                .send({
                    name: '통합테스트부모견',
                    breed: '말티즈',
                    gender: 'female',
                })
                .expect(200);
            expect(parentPetResponse.body.success).toBe(true);
            const newParentPetId = parentPetResponse.body.data.petId;

            // 3. 분양 가능 반려동물 등록
            const availablePetResponse = await request(app.getHttpServer())
                .post('/api/breeder-management/available-pets')
                .set('Authorization', `Bearer ${breederToken}`)
                .send({
                    name: '통합테스트강아지',
                    breed: '말티즈',
                    gender: 'male',
                    birthDate: '2024-12-01',
                    price: 2000000,
                })
                .expect(200);
            expect(availablePetResponse.body.success).toBe(true);
            const newAvailablePetId = availablePetResponse.body.data.petId;

            // 4. 입양자가 입양 신청
            const applicationResponse = await request(app.getHttpServer())
                .post('/api/adopter/application')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({
                    targetBreederId: breederId,
                    targetPetId: newAvailablePetId,
                    expectedAdoptionDate: '2025-03-01',
                    isAgreedToTerms: true,
                    personalInfo: {
                        applicantName: '통합테스트입양자',
                        emailAddress: `integration_${Date.now()}@test.com`,
                        phoneNumber: '010-9999-8888',
                    },
                    applicationForm: {
                        selfIntroduction: '통합 테스트 입양자입니다.',
                        familyMembers: '3명',
                        isFamilyAgreed: true,
                        hasAllergy: false,
                        dailyAwayTime: '6시간',
                        livingSpace: '아파트 30평',
                        hasPetExperience: true,
                        canHandleBasicCare: true,
                        canAffordMedicalCost: true,
                        isAgreedToNeuter: true,
                        preferredPetType: '온순한 성격',
                        desiredAdoptionTiming: '3월 초',
                        additionalQuestions: '없음',
                    },
                })
                .expect(200);
            expect(applicationResponse.body.success).toBe(true);
            const newApplicationId = applicationResponse.body.data.applicationId;

            // 5. 브리더가 신청 확인
            const applicationsResponse = await request(app.getHttpServer())
                .get('/api/breeder-management/applications')
                .set('Authorization', `Bearer ${breederToken}`)
                .query({ page: 1, take: 10 })
                .expect(200);
            expect(applicationsResponse.body.success).toBe(true);
            expect(applicationsResponse.body.data.items.length).toBeGreaterThan(0);

            // 6. 브리더가 신청 상태 업데이트
            const updateStatusResponse = await request(app.getHttpServer())
                .patch(`/api/breeder-management/applications/${newApplicationId}`)
                .set('Authorization', `Bearer ${breederToken}`)
                .send({
                    applicationStatus: 'approved',
                    breederMemo: '통합 테스트 승인',
                })
                .expect(200);
            expect(updateStatusResponse.body.success).toBe(true);

            // 7. 대시보드 확인
            const dashboardResponse = await request(app.getHttpServer())
                .get('/api/breeder-management/dashboard')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200);
            expect(dashboardResponse.body.success).toBe(true);

            // 8. 정리: 등록한 데이터 삭제
            await request(app.getHttpServer())
                .delete(`/api/breeder-management/parent-pets/${newParentPetId}`)
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200);

            await request(app.getHttpServer())
                .delete(`/api/breeder-management/available-pets/${newAvailablePetId}`)
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200);
        });
    });
});
