import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { AppModule } from '../../../app.module';

/**
 * Adopter API End-to-End 테스트
 * 입양자 관련 모든 API 엔드포인트를 테스트합니다.
 * - 입양 신청 관리
 * - 후기 작성
 * - 즐겨찾기 관리
 * - 신고 기능
 * - 프로필 관리
 */
describe('Adopter API (e2e)', () => {
    let app: INestApplication;
    let mongod: MongoMemoryServer;
    let adopterToken: string;
    let breederToken: string;
    let breederId: string;

    beforeAll(async () => {
        // 메모리 내 MongoDB 서버 시작
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [MongooseModule.forRoot(uri), AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // 테스트용 입양자 생성 및 로그인
        const adopterResponse = await request(app.getHttpServer()).post('/api/auth/register/adopter').send({
            email: 'adopter@test.com',
            password: 'testpassword123',
            name: 'Test Adopter',
            phone: '010-1234-5678',
        });
        adopterToken = adopterResponse.body.access_token;

        // 테스트용 브리더 생성 및 로그인
        const breederResponse = await request(app.getHttpServer()).post('/api/auth/register/breeder').send({
            email: 'breeder@test.com',
            password: 'testpassword123',
            name: 'Test Breeder',
            phone: '010-9876-5432',
            businessNumber: '123-45-67890',
            businessName: 'Test Pet Farm',
        });
        breederToken = breederResponse.body.access_token;
        breederId = breederResponse.body.user.id;
    });

    afterAll(async () => {
        await app.close();
        await mongod.stop();
    });

    describe('Application Management', () => {
        const applicationData = {
            breederId: 'test-breeder-id',
            petId: 'test-pet-id',
            message: 'I would like to adopt this pet',
            experienceLevel: 'beginner',
            livingEnvironment: 'apartment',
            hasOtherPets: false,
        };

        it('POST /api/adopter/application - 입양 신청 생성 성공', async () => {
            // 실제 브리더 ID로 업데이트
            applicationData.breederId = breederId;

            await request(app.getHttpServer())
                .post('/api/adopter/application')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(applicationData)
                .expect(201)
                .expect((res) => {
                    expect(res.body.applicationId).toBeDefined();
                    expect(res.body.status).toBe('pending');
                });
        });

        it('POST /api/adopter/application - 인증되지 않은 요청 실패', async () => {
            await request(app.getHttpServer()).post('/api/adopter/application').send(applicationData).expect(401);
        });

        it('POST /api/adopter/application - 중복 신청 방지', async () => {
            await request(app.getHttpServer())
                .post('/api/adopter/application')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(applicationData)
                .expect(400);
        });
    });

    describe('Review Management', () => {
        const reviewData = {
            breederId: '',
            rating: 5,
            comment: 'Great breeder, very professional and caring',
            petHealthRating: 5,
            communicationRating: 4,
        };

        beforeEach(() => {
            reviewData.breederId = breederId;
        });

        it('POST /api/adopter/review - 후기 작성 성공', async () => {
            await request(app.getHttpServer())
                .post('/api/adopter/review')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(reviewData)
                .expect(201)
                .expect((res) => {
                    expect(res.body.reviewId).toBeDefined();
                    expect(res.body.rating).toBe(reviewData.rating);
                });
        });

        it('POST /api/adopter/review - 유효하지 않은 평점', async () => {
            await request(app.getHttpServer())
                .post('/api/adopter/review')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({
                    ...reviewData,
                    rating: 6, // 1-5 범위를 벗어남
                })
                .expect(400);
        });

        it('POST /api/adopter/review - 중복 후기 작성 방지', async () => {
            await request(app.getHttpServer())
                .post('/api/adopter/review')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(reviewData)
                .expect(400);
        });
    });

    describe('Favorite Management', () => {
        const favoriteData = {
            breederId: '',
        };

        beforeEach(() => {
            favoriteData.breederId = breederId;
        });

        it('POST /api/adopter/favorite - 즐겨찾기 추가 성공', async () => {
            await request(app.getHttpServer())
                .post('/api/adopter/favorite')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(favoriteData)
                .expect(201)
                .expect((res) => {
                    expect(res.body.success).toBe(true);
                });
        });

        it('DELETE /api/adopter/favorite/:breederId - 즐겨찾기 제거 성공', async () => {
            await request(app.getHttpServer())
                .delete(`/api/adopter/favorite/${breederId}`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.success).toBe(true);
                });
        });

        it('POST /api/adopter/favorite - 중복 즐겨찾기 방지', async () => {
            // 다시 추가
            await request(app.getHttpServer())
                .post('/api/adopter/favorite')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(favoriteData);

            // 중복 추가 시도
            await request(app.getHttpServer())
                .post('/api/adopter/favorite')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(favoriteData)
                .expect(400);
        });
    });

    describe('Report Management', () => {
        const reportData = {
            breederId: '',
            reason: 'inappropriate_content',
            description: 'This breeder posted inappropriate content',
            evidence: ['screenshot1.jpg', 'screenshot2.jpg'],
        };

        beforeEach(() => {
            reportData.breederId = breederId;
        });

        it('POST /api/adopter/report - 신고 제출 성공', async () => {
            await request(app.getHttpServer())
                .post('/api/adopter/report')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(reportData)
                .expect(201)
                .expect((res) => {
                    expect(res.body.reportId).toBeDefined();
                    expect(res.body.status).toBe('pending');
                });
        });

        it('POST /api/adopter/report - 필수 필드 누락', async () => {
            await request(app.getHttpServer())
                .post('/api/adopter/report')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({
                    breederId: breederId,
                    reason: 'inappropriate_content',
                    // description 누락
                })
                .expect(400);
        });
    });

    describe('Profile Management', () => {
        it('GET /api/adopter/profile - 프로필 조회 성공', async () => {
            await request(app.getHttpServer())
                .get('/api/adopter/profile')
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.email).toBe('adopter@test.com');
                    expect(res.body.name).toBe('Test Adopter');
                });
        });

        it('PATCH /api/adopter/profile - 프로필 업데이트 성공', async () => {
            const updateData = {
                name: 'Updated Adopter Name',
                phone: '010-0000-0000',
                profileImage: 'https://example.com/new-image.jpg',
            };

            await request(app.getHttpServer())
                .patch('/api/adopter/profile')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(updateData)
                .expect(200)
                .expect((res) => {
                    expect(res.body.name).toBe(updateData.name);
                    expect(res.body.phone).toBe(updateData.phone);
                });
        });

        it('GET /api/adopter/profile - 인증되지 않은 요청 실패', async () => {
            await request(app.getHttpServer()).get('/api/adopter/profile').expect(401);
        });
    });
});
