import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestingApp } from './test-utils';

/**
 * Adopter 도메인 E2E 테스트 (완전 재작성)
 *
 * **테스트 대상 API (13개):**
 * 1. POST /api/adopter/application - 입양 신청
 * 2. GET /api/adopter/applications - 입양 신청 목록 조회
 * 3. GET /api/adopter/applications/:id - 입양 신청 상세 조회
 * 4. POST /api/adopter/review - 후기 작성
 * 5. GET /api/adopter/reviews - 내가 작성한 후기 목록
 * 6. GET /api/adopter/reviews/:id - 내가 작성한 후기 상세
 * 7. POST /api/adopter/favorite - 즐겨찾기 추가
 * 8. DELETE /api/adopter/favorite/:breederId - 즐겨찾기 삭제
 * 9. GET /api/adopter/favorites - 즐겨찾기 목록 조회
 * 10. POST /api/adopter/report - 브리더 신고
 * 11. POST /api/adopter/report/review - 후기 신고
 * 12. GET /api/adopter/profile - 프로필 조회
 * 13. PATCH /api/adopter/profile - 프로필 수정
 *
 * **테스트 시나리오:**
 * - 표준 14개 필드 입양 신청
 * - 표준 + 커스텀 응답 입양 신청
 * - 필수 필드 검증 (privacyConsent, selfIntroduction 등)
 * - 페이지네이션 검증
 * - 인증 검증
 * - 권한 검증
 *
 * **총 테스트 케이스: 30개 이상**
 */
describe('Adopter API E2E Tests', () => {
    let app: INestApplication;
    let adopterToken: string;
    let adopterUserId: string;
    let adopterNickname: string; // 타임스탬프가 포함된 닉네임 저장
    let breederToken: string;
    let breederUserId: string;
    let breederId: string;

    // 테스트 데이터 저장용
    let applicationId: string;
    let reviewId: string;
    let petId: string;

    /**
     * 테스트 애플리케이션 초기화
     */
    beforeAll(async () => {
        app = await createTestingApp();
        await setupTestUsers();
    });

    /**
     * 테스트 종료
     */
    afterAll(async () => {
        await app.close();
    });

    /**
     * 테스트용 사용자 계정 생성 및 토큰 획득
     */
    async function setupTestUsers() {
        // 1. 입양자 회원가입
        const timestamp = Date.now();
        const adopterEmail = `adopter_${timestamp}@test.com`;
        const adopterProviderId = Math.random().toString().substr(2, 10);
        adopterNickname = `테스트입양자${timestamp}`; // 닉네임 저장
        const adopterResponse = await request(app.getHttpServer())
            .post('/api/auth/register/adopter')
            .send({
                tempId: `temp_kakao_${adopterProviderId}_${timestamp}`,
                email: adopterEmail,
                nickname: adopterNickname,
                phone: '010-1234-5678',
                profileImage: 'https://example.com/adopter.jpg',
            })
            .expect(200);

        adopterToken = adopterResponse.body.data.accessToken;
        adopterUserId = adopterResponse.body.data.userId;

        // 2. 브리더 회원가입
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
        breederUserId = breederResponse.body.data.userId;
        breederId = breederUserId;
    }

    /**
     * 표준 14개 필드 입양 신청 데이터 생성 (Figma 디자인 기반)
     */
    function getStandardApplicationData(targetBreederId: string) {
        return {
            breederId: targetBreederId,
            petId: petId || undefined,
            privacyConsent: true,
            selfIntroduction:
                '안녕하세요. 30대 남성이며 서울 강남구에 거주하고 있습니다. 재택근무를 하고 있어 반려동물과 충분한 시간을 보낼 수 있습니다.',
            familyMembers: '총 3명 - 본인(30대), 배우자(30대), 자녀(5세)',
            allFamilyConsent: true,
            allergyTestInfo: '본인과 배우자 모두 알러지 검사 완료했으며, 반려동물 알러지 없음',
            timeAwayFromHome: '주중 9시간(오전 9시~오후 6시), 주말 집에 있음',
            livingSpaceDescription:
                '거실과 안방을 자유롭게 이용할 수 있습니다. 거실은 약 20평 크기이며, 캣타워와 스크래처를 설치할 예정입니다.',
            previousPetExperience:
                '5년 전 고양이 한 마리를 키웠습니다. 러시안블루 품종이었으며, 매우 온순한 성격이었습니다. 수명을 다해 무지개다리를 건넜습니다.',
            canProvideBasicCare: true,
            canAffordMedicalExpenses: true,
            neuteringConsent: true,
            preferredPetDescription: '활발하고 사람을 좋아하는 포메라니안을 찾고 있습니다.',
            desiredAdoptionTiming: '2개월 후 (2025년 3월 예정)',
            additionalNotes: '첫 입양이라 많이 긴장되지만, 좋은 가족이 되도록 최선을 다하겠습니다.',
        };
    }

    /**
     * 커스텀 질문 응답 데이터 생성
     */
    function getCustomResponses() {
        return [
            {
                questionId: 'custom_visit_time',
                answer: '오후 (13:00-17:00)',
            },
            {
                questionId: 'custom_pet_preference',
                answer: '활발하고 사람을 좋아하는 성격',
            },
        ];
    }

    /**
     * ========================================
     * 1. 입양 신청 테스트 (POST /api/adopter/application)
     * ========================================
     */
    describe('POST /api/adopter/application - 입양 신청', () => {
        it('표준 필드만으로 입양 신청 성공', async () => {
            const applicationData = getStandardApplicationData(breederId);

            const response = await request(app.getHttpServer())
                .post('/api/adopter/application')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(applicationData)
                .expect(200);

            // 응답 검증
            expect(response.body.success).toBe(true);
            expect(response.body.code).toBe(200);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.applicationId).toBeDefined();
            expect(response.body.data.breederId).toBe(breederId);
            expect(response.body.data.status).toBe('consultation_pending');
            expect(response.body.message).toBe('입양 신청이 성공적으로 제출되었습니다.');
            expect(response.body.timestamp).toBeDefined();

            // applicationId 저장 (이후 테스트에 사용)
            applicationId = response.body.data.applicationId;
        });

        it('표준 필드 + 커스텀 응답으로 입양 신청 성공', async () => {
            const applicationData = {
                ...getStandardApplicationData(breederId),
                customResponses: getCustomResponses(),
            };

            const response = await request(app.getHttpServer())
                .post('/api/adopter/application')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(applicationData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.applicationId).toBeDefined();
        });

        it('필수 필드 누락 시 실패 - breederId', async () => {
            const applicationData = getStandardApplicationData(breederId);
            delete (applicationData as any).breederId;

            const response = await request(app.getHttpServer())
                .post('/api/adopter/application')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(applicationData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('필수 필드 누락 시 실패 - privacyConsent', async () => {
            const applicationData = getStandardApplicationData(breederId);
            delete (applicationData as any).privacyConsent;

            const response = await request(app.getHttpServer())
                .post('/api/adopter/application')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(applicationData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('필수 필드 누락 시 실패 - selfIntroduction', async () => {
            const applicationData = getStandardApplicationData(breederId);
            delete (applicationData as any).selfIntroduction;

            const response = await request(app.getHttpServer())
                .post('/api/adopter/application')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(applicationData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('필수 필드 누락 시 실패 - familyMembers', async () => {
            const applicationData = getStandardApplicationData(breederId);
            delete (applicationData as any).familyMembers;

            const response = await request(app.getHttpServer())
                .post('/api/adopter/application')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(applicationData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('인증 없이 신청 시 실패', async () => {
            const applicationData = getStandardApplicationData(breederId);

            const response = await request(app.getHttpServer())
                .post('/api/adopter/application')
                .send(applicationData)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('존재하지 않는 브리더에게 신청 시 실패', async () => {
            const applicationData = getStandardApplicationData('000000000000000000000000');

            const response = await request(app.getHttpServer())
                .post('/api/adopter/application')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(applicationData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('자기소개 최대 길이 초과 시 실패', async () => {
            const applicationData = getStandardApplicationData(breederId);
            (applicationData as any).selfIntroduction = 'A'.repeat(1501); // 1500자 초과

            const response = await request(app.getHttpServer())
                .post('/api/adopter/application')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(applicationData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    /**
     * ========================================
     * 2. 입양 신청 조회 테스트
     * ========================================
     */
    describe('GET /api/adopter/applications - 입양 신청 목록 조회', () => {
        it('내 입양 신청 목록 조회 성공 (페이지네이션)', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/adopter/applications')
                .set('Authorization', `Bearer ${adopterToken}`)
                .query({ page: 1, limit: 10 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.items).toBeDefined();
            expect(Array.isArray(response.body.data.items)).toBe(true);
            expect(response.body.data.pagination).toBeDefined();
            expect(response.body.data.pagination.currentPage).toBe(1);
            expect(response.body.data.pagination.pageSize).toBe(10);
            expect(response.body.data.pagination).toHaveProperty('totalItems');
            expect(response.body.data.pagination).toHaveProperty('totalPages');
            expect(response.body.data.pagination).toHaveProperty('hasNextPage');
            expect(response.body.data.pagination).toHaveProperty('hasPrevPage');
            expect(response.body.message).toBe('입양 신청 목록이 조회되었습니다.');
        });

        it('페이지네이션 - 2페이지 조회', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/adopter/applications')
                .set('Authorization', `Bearer ${adopterToken}`)
                .query({ page: 2, limit: 5 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.pagination.currentPage).toBe(2);
            expect(response.body.data.pagination.pageSize).toBe(5);
        });

        it('인증 없이 조회 시 실패', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/adopter/applications')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/adopter/applications/:id - 입양 신청 상세 조회', () => {
        it('내 입양 신청 상세 조회 성공', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/adopter/applications/${applicationId}`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.applicationId).toBe(applicationId);
            expect(response.body.data.breederId).toBe(breederId);
            expect(response.body.data.standardResponses).toBeDefined();
            expect(response.body.message).toBe('입양 신청 상세 정보가 조회되었습니다.');
        });

        it('존재하지 않는 신청 조회 시 실패', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/adopter/applications/000000000000000000000000')
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('인증 없이 조회 시 실패', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/adopter/applications/${applicationId}`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    /**
     * ========================================
     * 3. 후기 작성 테스트
     * ========================================
     */
    describe('POST /api/adopter/review - 후기 작성', () => {
        it('후기 작성 성공', async () => {
            const reviewData = {
                breederId: breederId,
                reviewType: 'adoption',
                content: '정말 좋은 브리더입니다. 반려동물이 건강하고 성격도 좋아요. 소통도 원활했고, 사후 관리도 만족스럽습니다.',
            };

            const response = await request(app.getHttpServer())
                .post('/api/adopter/review')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(reviewData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.reviewId).toBeDefined();
            expect(response.body.message).toBe('후기가 성공적으로 작성되었습니다.');

            reviewId = response.body.data.reviewId;
        });

        it('필수 필드 누락 시 실패 - breederId', async () => {
            const reviewData = {
                reviewType: 'adoption',
                content: '좋은 브리더입니다.',
            };

            const response = await request(app.getHttpServer())
                .post('/api/adopter/review')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(reviewData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('필수 필드 누락 시 실패 - content', async () => {
            const reviewData = {
                breederId: breederId,
                reviewType: 'adoption',
            };

            const response = await request(app.getHttpServer())
                .post('/api/adopter/review')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(reviewData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('인증 없이 작성 시 실패', async () => {
            const reviewData = {
                breederId: breederId,
                reviewType: 'adoption',
                content: '좋은 브리더입니다.',
            };

            const response = await request(app.getHttpServer())
                .post('/api/adopter/review')
                .send(reviewData)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/adopter/reviews - 내가 작성한 후기 목록 조회', () => {
        it('내 후기 목록 조회 성공 (페이지네이션)', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/adopter/reviews')
                .set('Authorization', `Bearer ${adopterToken}`)
                .query({ page: 1, limit: 10 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.items).toBeDefined();
            expect(Array.isArray(response.body.data.items)).toBe(true);
            expect(response.body.data.pagination).toBeDefined();
            expect(response.body.message).toBe('내가 작성한 후기 목록이 조회되었습니다.');
        });

        it('인증 없이 조회 시 실패', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/adopter/reviews')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/adopter/reviews/:id - 내가 작성한 후기 상세 조회', () => {
        it('내 후기 상세 조회 성공', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/adopter/reviews/${reviewId}`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.reviewId).toBe(reviewId);
            expect(response.body.message).toBe('후기 세부 정보가 조회되었습니다.');
        });

        it('존재하지 않는 후기 조회 시 실패', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/adopter/reviews/000000000000000000000000')
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('인증 없이 조회 시 실패', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/adopter/reviews/${reviewId}`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    /**
     * ========================================
     * 4. 즐겨찾기 테스트
     * ========================================
     */
    describe('POST /api/adopter/favorite - 즐겨찾기 추가', () => {
        it('즐겨찾기 추가 성공', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/adopter/favorite')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({ breederId })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.breederId).toBe(breederId);
            expect(response.body.message).toBe('즐겨찾기에 성공적으로 추가되었습니다.');
        });

        it('이미 추가된 브리더 중복 추가 시 실패', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/adopter/favorite')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({ breederId })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('인증 없이 추가 시 실패', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/adopter/favorite')
                .send({ breederId })
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('필수 필드 누락 시 실패 - breederId', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/adopter/favorite')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/adopter/favorites - 즐겨찾기 목록 조회', () => {
        it('즐겨찾기 목록 조회 성공 (페이지네이션)', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/adopter/favorites')
                .set('Authorization', `Bearer ${adopterToken}`)
                .query({ page: 1, limit: 10 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.items).toBeDefined();
            expect(Array.isArray(response.body.data.items)).toBe(true);
            expect(response.body.data.pagination).toBeDefined();
            expect(response.body.message).toBe('즐겨찾기 목록이 조회되었습니다.');
        });

        it('인증 없이 조회 시 실패', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/adopter/favorites')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/adopter/favorite/:breederId - 즐겨찾기 삭제', () => {
        it('즐겨찾기 삭제 성공', async () => {
            const response = await request(app.getHttpServer())
                .delete(`/api/adopter/favorite/${breederId}`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('즐겨찾기에서 성공적으로 삭제되었습니다.');
        });

        it('존재하지 않는 즐겨찾기 삭제 시 실패', async () => {
            const response = await request(app.getHttpServer())
                .delete('/api/adopter/favorite/000000000000000000000000')
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('인증 없이 삭제 시 실패', async () => {
            const response = await request(app.getHttpServer())
                .delete(`/api/adopter/favorite/${breederId}`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    /**
     * ========================================
     * 5. 신고 테스트
     * ========================================
     */
    describe('POST /api/adopter/report - 브리더 신고', () => {
        it('브리더 신고 성공', async () => {
            const reportData = {
                type: 'breeder',
                breederId: breederId,
                reason: 'false_info',
                description: '브리더가 허위 정보를 제공했습니다. 반려동물의 건강 상태가 설명과 다릅니다.',
            };

            const response = await request(app.getHttpServer())
                .post('/api/adopter/report')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(reportData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.reportId).toBeDefined();
            expect(response.body.message).toBe('신고가 성공적으로 제출되었습니다.');
        });

        it('필수 필드 누락 시 실패 - description', async () => {
            const reportData = {
                type: 'breeder',
                breederId: breederId,
                reason: 'false_info',
            };

            const response = await request(app.getHttpServer())
                .post('/api/adopter/report')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(reportData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('인증 없이 신고 시 실패', async () => {
            const reportData = {
                type: 'breeder',
                breederId: breederId,
                reason: 'false_info',
                description: '허위 정보 제공',
            };

            const response = await request(app.getHttpServer())
                .post('/api/adopter/report')
                .send(reportData)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/adopter/report/review - 후기 신고', () => {
        it('후기 신고 성공', async () => {
            const reportData = {
                reviewId: reviewId,
                reason: 'inappropriate_content',
                description: '부적절한 내용이 포함되어 있습니다.',
            };

            const response = await request(app.getHttpServer())
                .post('/api/adopter/report/review')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(reportData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.reportId).toBeDefined();
            expect(response.body.message).toBe('후기가 신고되었습니다.');
        });

        it('필수 필드 누락 시 실패 - reason', async () => {
            const reportData = {
                reviewId: reviewId,
                description: '부적절한 내용',
            };

            const response = await request(app.getHttpServer())
                .post('/api/adopter/report/review')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(reportData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('인증 없이 신고 시 실패', async () => {
            const reportData = {
                reviewId: reviewId,
                reason: 'spam',
                description: '스팸입니다.',
            };

            const response = await request(app.getHttpServer())
                .post('/api/adopter/report/review')
                .send(reportData)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    /**
     * ========================================
     * 6. 프로필 관리 테스트
     * ========================================
     */
    describe('GET /api/adopter/profile - 프로필 조회', () => {
        it('프로필 조회 성공', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/adopter/profile')
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.userId).toBe(adopterUserId);
            expect(response.body.data.email).toBeDefined();
            expect(response.body.data.nickname).toBe(adopterNickname);
            expect(response.body.message).toBe('입양자 프로필이 조회되었습니다.');
        });

        it('인증 없이 조회 시 실패', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/adopter/profile')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PATCH /api/adopter/profile - 프로필 수정', () => {
        it('프로필 수정 성공 - 전체 필드', async () => {
            const updateData = {
                name: '수정된입양자',
                phone: '010-9999-8888',
                profileImage: 'https://example.com/new-profile.jpg',
            };

            const response = await request(app.getHttpServer())
                .patch('/api/adopter/profile')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.message).toBe('프로필이 성공적으로 수정되었습니다.');
        });

        it('프로필 수정 성공 - 일부 필드만', async () => {
            const updateData = {
                name: '다시수정된입양자',
            };

            const response = await request(app.getHttpServer())
                .patch('/api/adopter/profile')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('인증 없이 수정 시 실패', async () => {
            const updateData = {
                name: '수정시도',
            };

            const response = await request(app.getHttpServer())
                .patch('/api/adopter/profile')
                .send(updateData)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    /**
     * ========================================
     * 통합 시나리오 테스트: 실제 입양 프로세스
     * ========================================
     */
    describe('통합 시나리오: 입양 신청부터 후기 작성까지', () => {
        it('전체 입양 프로세스 시뮬레이션', async () => {
            // 1. 브리더를 즐겨찾기에 추가
            const favoriteResponse = await request(app.getHttpServer())
                .post('/api/adopter/favorite')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({ breederId })
                .expect(200);
            expect(favoriteResponse.body.success).toBe(true);

            // 2. 입양 신청 제출
            const applicationData = getStandardApplicationData(breederId);
            const applicationResponse = await request(app.getHttpServer())
                .post('/api/adopter/application')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(applicationData)
                .expect(200);
            expect(applicationResponse.body.success).toBe(true);
            const newApplicationId = applicationResponse.body.data.applicationId;

            // 3. 신청 상세 조회
            const detailResponse = await request(app.getHttpServer())
                .get(`/api/adopter/applications/${newApplicationId}`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200);
            expect(detailResponse.body.success).toBe(true);
            expect(detailResponse.body.data.applicationId).toBe(newApplicationId);

            // 4. 후기 작성
            const reviewData = {
                breederId: breederId,
                reviewType: 'adoption',
                content: '훌륭한 브리더였습니다. 입양 과정이 매우 만족스러웠습니다.',
            };
            const reviewResponse = await request(app.getHttpServer())
                .post('/api/adopter/review')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(reviewData)
                .expect(200);
            expect(reviewResponse.body.success).toBe(true);

            // 5. 내 후기 목록 확인
            const myReviewsResponse = await request(app.getHttpServer())
                .get('/api/adopter/reviews')
                .set('Authorization', `Bearer ${adopterToken}`)
                .query({ page: 1, limit: 10 })
                .expect(200);
            expect(myReviewsResponse.body.success).toBe(true);
            expect(myReviewsResponse.body.data.items.length).toBeGreaterThan(0);

            // 6. 즐겨찾기 삭제
            const removeFavoriteResponse = await request(app.getHttpServer())
                .delete(`/api/adopter/favorite/${breederId}`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200);
            expect(removeFavoriteResponse.body.success).toBe(true);
        });
    });
});
