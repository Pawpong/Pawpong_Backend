import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestingApp, AuthHelper, TestDataHelper, ResponseValidator } from './test-utils';

describe('Adopter API E2E Tests', () => {
    let app: INestApplication;
    let authHelper: AuthHelper;
    let adopterToken: string;
    let adopterId: string;
    let breederToken: string;
    let breederId: string;

    beforeAll(async () => {
        app = await createTestingApp();
        authHelper = new AuthHelper(app);

        // 입양자 토큰 생성
        const adopterAuth = await authHelper.getAdopterToken();
        adopterToken = adopterAuth.accessToken;
        adopterId = adopterAuth.userId;

        // 테스트용 브리더 토큰 생성
        const breederAuth = await authHelper.getBreederToken();
        breederToken = breederAuth.accessToken;
        breederId = breederAuth.userId;
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /api/adopter/application', () => {
        it('입양 신청 제출 성공', async () => {
            const applicationData = {
                targetBreederId: breederId,
                petId: 'test-pet-id',
                ...TestDataHelper.getApplicationData(),
            };

            const response = await request(app.getHttpServer())
                .post('/api/adopter/application')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(applicationData)
                .expect(200);

            ResponseValidator.validateApiResponse(response);
            expect(response.body.message).toBe('입양 신청이 성공적으로 제출되었습니다.');
        });

        it('인증 없이 입양 신청 실패', async () => {
            const applicationData = {
                targetBreederId: breederId,
                petId: 'test-pet-id',
                ...TestDataHelper.getApplicationData(),
            };

            await request(app.getHttpServer())
                .post('/api/adopter/application')
                .send(applicationData)
                .expect(401);
        });

        it('필수 필드 누락시 입양 신청 실패', async () => {
            const applicationData = {
                // targetBreederId 누락
                petId: 'test-pet-id',
                expectedPrice: 1500000,
            };

            const response = await request(app.getHttpServer())
                .post('/api/adopter/application')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(applicationData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('존재하지 않는 브리더에게 입양 신청 실패', async () => {
            const applicationData = {
                targetBreederId: 'invalid-breeder-id',
                petId: 'test-pet-id',
                ...TestDataHelper.getApplicationData(),
            };

            const response = await request(app.getHttpServer())
                .post('/api/adopter/application')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(applicationData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('브리더를 찾을 수 없습니다');
        });

        it('중복 입양 신청 방지', async () => {
            const applicationData = {
                targetBreederId: breederId,
                petId: 'duplicate-test-pet',
                ...TestDataHelper.getApplicationData(),
            };

            // 첫 번째 신청
            await request(app.getHttpServer())
                .post('/api/adopter/application')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(applicationData)
                .expect(200);

            // 중복 신청 시도
            const response = await request(app.getHttpServer())
                .post('/api/adopter/application')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(applicationData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('이미 신청');
        });
    });

    describe('POST /api/adopter/review', () => {
        it('브리더 후기 작성 성공', async () => {
            const reviewData = {
                targetBreederId: breederId,
                applicationId: 'test-application-id',
                ...TestDataHelper.getReviewData(),
            };

            const response = await request(app.getHttpServer())
                .post('/api/adopter/review')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(reviewData)
                .expect(200);

            ResponseValidator.validateApiResponse(response);
            expect(response.body.message).toBe('후기가 성공적으로 작성되었습니다.');
        });

        it('평점 범위 초과시 후기 작성 실패', async () => {
            const reviewData = {
                targetBreederId: breederId,
                applicationId: 'test-application-id',
                rating: 6, // 5점 만점 초과
                content: '테스트 후기',
            };

            const response = await request(app.getHttpServer())
                .post('/api/adopter/review')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(reviewData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('입양 신청 없이 후기 작성 실패', async () => {
            const reviewData = {
                targetBreederId: breederId,
                applicationId: 'non-existent-application',
                ...TestDataHelper.getReviewData(),
            };

            const response = await request(app.getHttpServer())
                .post('/api/adopter/review')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(reviewData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('입양 신청');
        });

        it('중복 후기 작성 방지', async () => {
            const reviewData = {
                targetBreederId: breederId,
                applicationId: 'duplicate-review-test',
                ...TestDataHelper.getReviewData(),
            };

            // 첫 번째 후기
            await request(app.getHttpServer())
                .post('/api/adopter/review')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(reviewData)
                .expect(200);

            // 중복 후기 시도
            const response = await request(app.getHttpServer())
                .post('/api/adopter/review')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(reviewData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('이미 작성');
        });
    });

    describe('POST /api/adopter/favorite', () => {
        it('브리더 즐겨찾기 추가 성공', async () => {
            const favoriteData = {
                breederId: breederId,
            };

            const response = await request(app.getHttpServer())
                .post('/api/adopter/favorite')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(favoriteData)
                .expect(200);

            ResponseValidator.validateApiResponse(response);
            expect(response.body.message).toBe('즐겨찾기에 성공적으로 추가되었습니다.');
        });

        it('이미 즐겨찾기한 브리더 추가시 실패', async () => {
            const favoriteData = {
                breederId: breederId,
            };

            // 첫 번째 즐겨찾기
            await request(app.getHttpServer())
                .post('/api/adopter/favorite')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(favoriteData);

            // 중복 즐겨찾기 시도
            const response = await request(app.getHttpServer())
                .post('/api/adopter/favorite')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(favoriteData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('이미 즐겨찾기');
        });

        it('존재하지 않는 브리더 즐겨찾기 실패', async () => {
            const favoriteData = {
                breederId: 'invalid-breeder-id',
            };

            const response = await request(app.getHttpServer())
                .post('/api/adopter/favorite')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(favoriteData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('브리더를 찾을 수 없습니다');
        });
    });

    describe('DELETE /api/adopter/favorite/:breederId', () => {
        let favoritedBreederId: string;

        beforeAll(async () => {
            // 삭제 테스트를 위해 먼저 즐겨찾기 추가
            const breederAuth = await authHelper.getBreederToken();
            favoritedBreederId = breederAuth.userId;

            await request(app.getHttpServer())
                .post('/api/adopter/favorite')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({ breederId: favoritedBreederId })
                .expect(200);
        });

        it('즐겨찾기 삭제 성공', async () => {
            const response = await request(app.getHttpServer())
                .delete(`/api/adopter/favorite/${favoritedBreederId}`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200);

            ResponseValidator.validateApiResponse(response);
            expect(response.body.message).toBe('즐겨찾기에서 성공적으로 삭제되었습니다.');
        });

        it('즐겨찾기하지 않은 브리더 삭제 시도시 실패', async () => {
            const response = await request(app.getHttpServer())
                .delete(`/api/adopter/favorite/not-favorited-breeder`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('즐겨찾기 목록에 없습니다');
        });
    });

    describe('POST /api/adopter/report', () => {
        it('브리더 신고 제출 성공', async () => {
            const reportData = {
                targetBreederId: breederId,
                reason: 'fraud',
                description: '허위 정보를 제공했습니다.',
                evidence: ['screenshot1.jpg', 'screenshot2.jpg'],
            };

            const response = await request(app.getHttpServer())
                .post('/api/adopter/report')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(reportData)
                .expect(200);

            ResponseValidator.validateApiResponse(response);
            expect(response.body.message).toBe('신고가 성공적으로 제출되었습니다.');
        });

        it('신고 사유 없이 제출시 실패', async () => {
            const reportData = {
                targetBreederId: breederId,
                // reason 누락
                description: '테스트 신고',
            };

            const response = await request(app.getHttpServer())
                .post('/api/adopter/report')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(reportData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('동일 브리더 중복 신고 방지', async () => {
            const reportData = {
                targetBreederId: breederId,
                reason: 'spam',
                description: '스팸 메시지를 보냅니다.',
            };

            // 첫 번째 신고
            await request(app.getHttpServer())
                .post('/api/adopter/report')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(reportData)
                .expect(200);

            // 중복 신고 시도
            const response = await request(app.getHttpServer())
                .post('/api/adopter/report')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(reportData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('이미 신고');
        });
    });

    describe('GET /api/adopter/profile', () => {
        it('입양자 프로필 조회 성공', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/adopter/profile')
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200);

            ResponseValidator.validateApiResponse(response);
            expect(response.body.message).toBe('입양자 프로필이 조회되었습니다.');
            
            // 프로필 필드 확인
            expect(response.body.item).toHaveProperty('userId');
            expect(response.body.item).toHaveProperty('email');
            expect(response.body.item).toHaveProperty('name');
            expect(response.body.item).toHaveProperty('phone');
            expect(response.body.item).toHaveProperty('favoriteBreeder');
            expect(response.body.item).toHaveProperty('adoptionApplications');
            expect(response.body.item).toHaveProperty('reviews');
        });

        it('인증 없이 프로필 조회 실패', async () => {
            await request(app.getHttpServer())
                .get('/api/adopter/profile')
                .expect(401);
        });
    });

    describe('PATCH /api/adopter/profile', () => {
        it('입양자 프로필 수정 성공', async () => {
            const updateData = {
                name: '수정된 이름',
                phone: '010-9999-9999',
                profileImage: 'new-profile.jpg',
            };

            const response = await request(app.getHttpServer())
                .patch('/api/adopter/profile')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(updateData)
                .expect(200);

            ResponseValidator.validateApiResponse(response);
            expect(response.body.message).toBe('프로필이 성공적으로 수정되었습니다.');
        });

        it('이메일 수정 시도시 실패', async () => {
            const updateData = {
                email: 'newemail@test.com', // 이메일은 수정 불가
                name: '테스트',
            };

            const response = await request(app.getHttpServer())
                .patch('/api/adopter/profile')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(updateData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('이메일은 변경할 수 없습니다');
        });

        it('잘못된 전화번호 형식으로 수정 실패', async () => {
            const updateData = {
                phone: '123456', // 잘못된 형식
            };

            const response = await request(app.getHttpServer())
                .patch('/api/adopter/profile')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(updateData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });
});