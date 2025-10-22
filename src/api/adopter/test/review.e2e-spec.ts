import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { AppModule } from '../../../app.module';

/**
 * 입양자 후기 End-to-End 테스트
 * 입양자 후기 작성 및 관리 관련 모든 시나리오를 테스트합니다.
 * - 후기 작성 및 수정
 * - 평점 시스템 검증
 * - 중복 후기 방지
 * - 후기 목록 조회
 * - 접근 권한 관리
 */
describe('Adopter Review API (e2e)', () => {
    let app: INestApplication;
    let mongod: MongoMemoryServer;
    let adopterToken: string;
    let anotherAdopterToken: string;
    let breederToken: string;
    let breederId: string;
    let anotherBreederId: string;
    let reviewId: string;

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
            email: 'adopter@review.test',
            password: 'testpassword123',
            name: 'Test Adopter',
            phone: '010-1234-5678',
        });
        adopterToken = adopterResponse.body.access_token;

        // 두 번째 입양자 생성
        const anotherAdopterResponse = await request(app.getHttpServer()).post('/api/auth/register/adopter').send({
            email: 'another@review.test',
            password: 'testpassword123',
            name: 'Another Adopter',
            phone: '010-9999-9999',
        });
        anotherAdopterToken = anotherAdopterResponse.body.access_token;

        // 테스트용 브리더 생성
        const breederResponse = await request(app.getHttpServer()).post('/api/auth/register/breeder').send({
            email: 'breeder@review.test',
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
            email: 'another.breeder@review.test',
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

    describe('Review Creation', () => {
        const baseReviewData = {
            rating: 5,
            comment: '정말 좋은 브리더입니다. 전문적이고 친절하게 도와주셨어요.',
            petHealthRating: 5,
            communicationRating: 4,
            serviceRating: 5,
            adoptionProcess: 'smooth',
            wouldRecommend: true,
        };

        it('POST /api/adopter/review - 후기 작성 성공', async () => {
            const reviewData = {
                ...baseReviewData,
                breederId,
                adoptedPetId: 'test-pet-001',
            };

            await request(app.getHttpServer())
                .post('/api/adopter/review')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(reviewData)
                .expect(201)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.reviewId).toBeDefined();
                    expect(res.body.item.rating).toBe(reviewData.rating);
                    expect(res.body.item.comment).toBe(reviewData.comment);
                    expect(res.body.item.breederId).toBe(breederId);
                    expect(res.body.item.status).toBe('published');
                    expect(res.body.message).toContain('후기가 등록되었습니다');

                    reviewId = res.body.item.reviewId;
                });
        });

        it('POST /api/adopter/review - 상세 후기 작성', async () => {
            const detailedReviewData = {
                ...baseReviewData,
                breederId: anotherBreederId,
                adoptedPetId: 'test-pet-002',
                comment: '이 브리더는 정말 훌륭합니다.',
                photos: ['https://example.com/review-photo1.jpg', 'https://example.com/review-photo2.jpg'],
                detailedRatings: {
                    petHealth: 5,
                    communication: 4,
                    facility: 5,
                    aftercare: 4,
                    pricing: 4,
                },
                adoptionStory: '입양 과정이 매우 순조로웠습니다. 브리더가 세심하게 챙겨주셨어요.',
                petAdjustmentPeriod: 'within_week',
                followUpSupport: true,
            };

            await request(app.getHttpServer())
                .post('/api/adopter/review')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(detailedReviewData)
                .expect(201)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.photos).toHaveLength(2);
                    expect(res.body.item.detailedRatings).toBeDefined();
                    expect(res.body.item.adoptionStory).toBe(detailedReviewData.adoptionStory);
                });
        });

        it('POST /api/adopter/review - 인증되지 않은 요청 실패', async () => {
            const reviewData = {
                ...baseReviewData,
                breederId,
                adoptedPetId: 'test-pet-003',
            };

            await request(app.getHttpServer())
                .post('/api/adopter/review')
                .send(reviewData)
                .expect(401)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('인증이 필요합니다');
                });
        });

        it('POST /api/adopter/review - 필수 필드 누락', async () => {
            const incompleteData = {
                breederId,
                // rating 누락
                comment: '좋은 브리더였습니다',
            };

            await request(app.getHttpServer())
                .post('/api/adopter/review')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(incompleteData)
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('평점은 필수 입력');
                });
        });

        it('POST /api/adopter/review - 존재하지 않는 브리더', async () => {
            const invalidData = {
                ...baseReviewData,
                breederId: 'nonexistent-breeder-id',
                adoptedPetId: 'test-pet-004',
            };

            await request(app.getHttpServer())
                .post('/api/adopter/review')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(invalidData)
                .expect(404)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('브리더를 찾을 수 없습니다');
                });
        });
    });

    describe('Rating Validation', () => {
        const baseReviewData = {
            breederId,
            adoptedPetId: 'test-pet-rating',
            comment: '평점 테스트용 후기',
        };

        it('POST /api/adopter/review - 유효하지 않은 평점 (6점)', async () => {
            await request(app.getHttpServer())
                .post('/api/adopter/review')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({
                    ...baseReviewData,
                    rating: 6, // 1-5 범위를 벗어남
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('평점은 1-5 사이의 값이어야 합니다');
                });
        });

        it('POST /api/adopter/review - 유효하지 않은 평점 (0점)', async () => {
            await request(app.getHttpServer())
                .post('/api/adopter/review')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({
                    ...baseReviewData,
                    rating: 0, // 1-5 범위를 벗어남
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('평점은 1-5 사이의 값이어야 합니다');
                });
        });

        it('POST /api/adopter/review - 소수점 평점', async () => {
            await request(app.getHttpServer())
                .post('/api/adopter/review')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({
                    ...baseReviewData,
                    rating: 4.5, // 소수점 평점
                    adoptedPetId: 'test-pet-decimal',
                })
                .expect(201) // 소수점 평점 허용
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.rating).toBe(4.5);
                });
        });

        it('POST /api/adopter/review - 세부 평점 검증', async () => {
            await request(app.getHttpServer())
                .post('/api/adopter/review')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({
                    ...baseReviewData,
                    rating: 4,
                    petHealthRating: 6, // 범위 초과
                    adoptedPetId: 'test-pet-detailed',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('세부 평점은 1-5 사이의 값이어야 합니다');
                });
        });
    });

    describe('Duplicate Review Prevention', () => {
        it('POST /api/adopter/review - 동일한 브리더에 중복 후기 방지', async () => {
            const duplicateData = {
                breederId, // 이미 후기를 작성한 브리더
                adoptedPetId: 'test-pet-duplicate',
                rating: 3,
                comment: '중복 후기 테스트',
            };

            await request(app.getHttpServer())
                .post('/api/adopter/review')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(duplicateData)
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('이미 해당 브리더에 대한 후기를 작성하셨습니다');
                });
        });

        it('POST /api/adopter/review - 다른 입양자는 같은 브리더에 후기 작성 가능', async () => {
            const sameBreederData = {
                breederId, // 첫 번째 입양자가 후기를 작성한 브리더
                adoptedPetId: 'test-pet-another-adopter',
                rating: 4,
                comment: '다른 입양자의 후기입니다',
            };

            await request(app.getHttpServer())
                .post('/api/adopter/review')
                .set('Authorization', `Bearer ${anotherAdopterToken}`)
                .send(sameBreederData)
                .expect(201)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.reviewId).toBeDefined();
                });
        });
    });

    describe('Review Management', () => {
        it('GET /api/adopter/review/:id - 후기 상세 조회', async () => {
            await request(app.getHttpServer())
                .get(`/api/adopter/review/${reviewId}`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.reviewId).toBe(reviewId);
                    expect(res.body.item.rating).toBeDefined();
                    expect(res.body.item.comment).toBeDefined();
                    expect(res.body.item.createdAt).toBeDefined();
                });
        });

        it('GET /api/adopter/reviews - 내가 작성한 후기 목록', async () => {
            await request(app.getHttpServer())
                .get('/api/adopter/reviews')
                .set('Authorization', `Bearer ${adopterToken}`)
                .query({
                    page: 1,
                    limit: 10,
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(Array.isArray(res.body.item.reviews)).toBe(true);
                    expect(res.body.item.pageInfo).toBeDefined();
                    expect(res.body.item.reviews.length).toBeGreaterThan(0);
                });
        });

        it('PATCH /api/adopter/review/:id - 후기 수정', async () => {
            const updateData = {
                rating: 4,
                comment: '수정된 후기 내용입니다',
                petHealthRating: 4,
            };

            await request(app.getHttpServer())
                .patch(`/api/adopter/review/${reviewId}`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(updateData)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.rating).toBe(updateData.rating);
                    expect(res.body.item.comment).toBe(updateData.comment);
                    expect(res.body.item.updatedAt).toBeDefined();
                    expect(res.body.message).toContain('후기가 수정되었습니다');
                });
        });

        it('DELETE /api/adopter/review/:id - 후기 삭제', async () => {
            // 삭제용 새 후기 생성
            const deleteReviewData = {
                breederId: anotherBreederId,
                adoptedPetId: 'test-pet-delete',
                rating: 3,
                comment: '삭제될 후기입니다',
            };

            const createResponse = await request(app.getHttpServer())
                .post('/api/adopter/review')
                .set('Authorization', `Bearer ${anotherAdopterToken}`)
                .send(deleteReviewData);

            const deleteReviewId = createResponse.body.item.reviewId;

            await request(app.getHttpServer())
                .delete(`/api/adopter/review/${deleteReviewId}`)
                .set('Authorization', `Bearer ${anotherAdopterToken}`)
                .send({
                    reason: '잘못 작성하여 삭제합니다',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.message).toContain('후기가 삭제되었습니다');
                });
        });
    });

    describe('Content Validation', () => {
        it('POST /api/adopter/review - 너무 짧은 후기 내용', async () => {
            await request(app.getHttpServer())
                .post('/api/adopter/review')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({
                    breederId: anotherBreederId,
                    adoptedPetId: 'test-pet-short',
                    rating: 4,
                    comment: '좋음', // 너무 짧은 내용
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('후기 내용은 최소 10자 이상');
                });
        });

        it('POST /api/adopter/review - 너무 긴 후기 내용', async () => {
            await request(app.getHttpServer())
                .post('/api/adopter/review')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({
                    breederId: anotherBreederId,
                    adoptedPetId: 'test-pet-long',
                    rating: 4,
                    comment: 'A'.repeat(2001), // 2000자 초과
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('후기 내용은 최대 2000자까지');
                });
        });

        it('POST /api/adopter/review - 부적절한 언어 사용 차단', async () => {
            await request(app.getHttpServer())
                .post('/api/adopter/review')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({
                    breederId: anotherBreederId,
                    adoptedPetId: 'test-pet-inappropriate',
                    rating: 1,
                    comment: '이 브리더는 정말 나쁜놈이다 욕설욕설욕설', // 부적절한 언어
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('부적절한 언어가 포함되어 있습니다');
                });
        });

        it('POST /api/adopter/review - 개인정보 포함 차단', async () => {
            await request(app.getHttpServer())
                .post('/api/adopter/review')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({
                    breederId: anotherBreederId,
                    adoptedPetId: 'test-pet-privacy',
                    rating: 4,
                    comment: '연락처는 010-1234-5678입니다. 이메일은 test@example.com', // 개인정보 포함
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('개인정보가 포함되어 있습니다');
                });
        });
    });

    describe('Access Control', () => {
        it('GET /api/adopter/review/:id - 다른 입양자의 후기 조회 차단', async () => {
            await request(app.getHttpServer())
                .get(`/api/adopter/review/${reviewId}`)
                .set('Authorization', `Bearer ${anotherAdopterToken}`)
                .expect(403)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('해당 후기에 접근할 권한이 없습니다');
                });
        });

        it('PATCH /api/adopter/review/:id - 다른 입양자의 후기 수정 차단', async () => {
            const updateData = {
                rating: 2,
                comment: '다른 사람의 후기를 수정하려고 시도',
            };

            await request(app.getHttpServer())
                .patch(`/api/adopter/review/${reviewId}`)
                .set('Authorization', `Bearer ${anotherAdopterToken}`)
                .send(updateData)
                .expect(403)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('해당 후기에 접근할 권한이 없습니다');
                });
        });

        it('브리더는 입양자 후기 관리 엔드포인트 접근 불가', async () => {
            await request(app.getHttpServer())
                .get('/api/adopter/reviews')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(403)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('입양자만 접근할 수 있습니다');
                });
        });
    });

    describe('Review Status Management', () => {
        let pendingReviewId: string;

        beforeAll(async () => {
            // 검토 대기 상태 후기 생성
            const pendingReviewData = {
                breederId: anotherBreederId,
                adoptedPetId: 'test-pet-pending',
                rating: 2, // 낮은 평점으로 관리자 검토 대상
                comment: '서비스가 아쉬웠습니다. 개선이 필요해 보입니다.',
            };

            const response = await request(app.getHttpServer())
                .post('/api/adopter/review')
                .set('Authorization', `Bearer ${anotherAdopterToken}`)
                .send(pendingReviewData);

            pendingReviewId = response.body.item.reviewId;
        });

        it('GET /api/adopter/reviews - 상태별 후기 필터링', async () => {
            await request(app.getHttpServer())
                .get('/api/adopter/reviews')
                .set('Authorization', `Bearer ${anotherAdopterToken}`)
                .query({
                    status: 'published',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    const reviews = res.body.item.reviews;
                    reviews.forEach((review) => {
                        expect(review.status).toBe('published');
                    });
                });
        });

        it('GET /api/adopter/review/:id/history - 후기 수정 이력 조회', async () => {
            await request(app.getHttpServer())
                .get(`/api/adopter/review/${reviewId}/history`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(Array.isArray(res.body.item.history)).toBe(true);
                    expect(res.body.item.history.length).toBeGreaterThan(0); // 수정 이력이 있어야 함
                });
        });
    });

    describe('Review Statistics', () => {
        it('GET /api/adopter/reviews/stats - 내 후기 통계 조회', async () => {
            await request(app.getHttpServer())
                .get('/api/adopter/reviews/stats')
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.totalReviews).toBeGreaterThan(0);
                    expect(res.body.item.averageRating).toBeDefined();
                    expect(res.body.item.ratingDistribution).toBeDefined();
                    expect(res.body.item.mostRecentReview).toBeDefined();
                });
        });

        it('GET /api/adopter/reviews/stats - 기간별 통계', async () => {
            await request(app.getHttpServer())
                .get('/api/adopter/reviews/stats')
                .set('Authorization', `Bearer ${adopterToken}`)
                .query({
                    startDate: '2024-01-01',
                    endDate: '2024-12-31',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.periodStart).toBe('2024-01-01T00:00:00.000Z');
                    expect(res.body.item.periodEnd).toBe('2024-12-31T23:59:59.999Z');
                });
        });
    });

    describe('Response Structure Validation', () => {
        it('후기 생성 응답이 표준 구조를 따르는지 확인', async () => {
            const reviewData = {
                breederId: anotherBreederId,
                adoptedPetId: 'test-pet-response',
                rating: 4,
                comment: '응답 구조 테스트용 후기입니다',
            };

            await request(app.getHttpServer())
                .post('/api/adopter/review')
                .set('Authorization', `Bearer ${anotherAdopterToken}`)
                .send(reviewData)
                .expect(201)
                .expect((res: any) => {
                    // API 응답 표준 구조
                    expect(res.body.success).toBe(true);
                    expect(res.body.code).toBe(201);
                    expect(res.body.item).toBeDefined();
                    expect(res.body.message).toBeDefined();
                    expect(res.body.timestamp).toBeDefined();

                    // 후기 생성 전용 구조
                    expect(res.body.item.reviewId).toBeDefined();
                    expect(res.body.item.rating).toBe(reviewData.rating);
                    expect(res.body.item.comment).toBe(reviewData.comment);
                    expect(res.body.item.breederId).toBe(reviewData.breederId);
                    expect(res.body.item.status).toBeDefined();
                    expect(res.body.item.createdAt).toBeDefined();
                });
        });

        it('후기 목록 조회 응답이 페이지네이션 표준을 따르는지 확인', async () => {
            await request(app.getHttpServer())
                .get('/api/adopter/reviews')
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    // 페이지네이션 구조
                    expect(res.body.item.reviews).toBeDefined();
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
