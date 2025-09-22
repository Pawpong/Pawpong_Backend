import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { AppModule } from '../../../app.module';

/**
 * 브리더 프로필 End-to-End 테스트
 * 브리더 프로필 조회 관련 모든 시나리오를 테스트합니다.
 * - 브리더 상세 프로필 조회
 * - 브리더 후기 목록 조회
 * - 브리더 반려동물 목록 조회
 * - 프로필 접근 권한 관리
 * - 데이터 보안 검증
 */
describe('Breeder Profile API (e2e)', () => {
    let app: INestApplication;
    let mongod: MongoMemoryServer;
    let adopterToken: string;
    let breederToken: string;
    let breederId: string;
    let anotherBreederId: string;

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
            email: 'adopter@profile.test',
            password: 'testpassword123',
            name: 'Test Adopter',
            phone: '010-1234-5678',
        });
        adopterToken = adopterResponse.body.access_token;

        // 첫 번째 테스트용 브리더 생성
        const breederResponse = await request(app.getHttpServer()).post('/api/auth/register/breeder').send({
            email: 'breeder@profile.test',
            password: 'testpassword123',
            name: 'Test Breeder',
            phone: '010-9876-5432',
            businessNumber: '123-45-67890',
            businessName: 'Test Pet Farm',
        });
        breederToken = breederResponse.body.access_token;
        breederId = breederResponse.body.user.id;

        // 두 번째 테스트용 브리더 생성
        const anotherBreederResponse = await request(app.getHttpServer()).post('/api/auth/register/breeder').send({
            email: 'another@profile.test',
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

    describe('Breeder Profile Details', () => {
        it('GET /api/breeder/:id - 브리더 프로필 조회 성공', async () => {
            await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.id).toBe(breederId);
                    expect(res.body.item.name).toBe('Test Breeder');
                    expect(res.body.item.businessName).toBe('Test Pet Farm');
                    expect(res.body.item.verification).toBeDefined();
                    expect(res.body.item.profile).toBeDefined();

                    // 민감한 정보는 응답에서 제외되어야 함
                    expect(res.body.item.password).toBeUndefined();
                    expect(res.body.item.businessNumber).toBeUndefined(); // 입양자에게는 비공개
                    expect(res.body.item.email).toBeUndefined(); // 직접 연락 방지
                    expect(res.body.item.phone).toBeUndefined(); // 직접 연락 방지
                });
        });

        it('GET /api/breeder/:id - 브리더 본인이 자신의 프로필 조회', async () => {
            await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}`)
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.id).toBe(breederId);

                    // 본인은 모든 정보 조회 가능 (단, 비밀번호는 여전히 제외)
                    expect(res.body.item.businessNumber).toBeDefined();
                    expect(res.body.item.email).toBeDefined();
                    expect(res.body.item.phone).toBeDefined();
                    expect(res.body.item.password).toBeUndefined();
                });
        });

        it('GET /api/breeder/:id - 존재하지 않는 브리더 ID', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/nonexistent-id')
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(404)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('브리더를 찾을 수 없습니다');
                });
        });

        it('GET /api/breeder/:id - 유효하지 않은 ID 형식', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/invalid-id-format')
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('유효하지 않은 브리더 ID 형식입니다');
                });
        });

        it('GET /api/breeder/:id - 인증되지 않은 접근', async () => {
            await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}`)
                .expect(401)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('인증이 필요합니다');
                });
        });
    });

    describe('Breeder Reviews', () => {
        it('GET /api/breeder/:id/reviews - 브리더 후기 조회', async () => {
            await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/reviews`)
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
                    expect(res.body.item.pageInfo.currentPage).toBe(1);
                    expect(res.body.item.pageInfo.pageSize).toBe(10);
                });
        });

        it('GET /api/breeder/:id/reviews - 평점별 필터링', async () => {
            await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/reviews`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .query({
                    minRating: 4,
                    page: 1,
                    limit: 5,
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    const reviews = res.body.item.reviews;
                    reviews.forEach((review) => {
                        expect(review.rating).toBeGreaterThanOrEqual(4);
                    });
                });
        });

        it('GET /api/breeder/:id/reviews - 최신순 정렬', async () => {
            await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/reviews`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .query({
                    sortBy: 'createdAt',
                    sortOrder: 'desc',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    const reviews = res.body.item.reviews;
                    if (reviews.length > 1) {
                        const firstDate = new Date(reviews[0].createdAt);
                        const secondDate = new Date(reviews[1].createdAt);
                        expect(firstDate >= secondDate).toBe(true);
                    }
                });
        });

        it('GET /api/breeder/:id/reviews - 존재하지 않는 브리더의 후기 조회', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/nonexistent-id/reviews')
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(404)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('브리더를 찾을 수 없습니다');
                });
        });

        it('GET /api/breeder/:id/reviews - 잘못된 평점 범위', async () => {
            await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/reviews`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .query({
                    minRating: 6, // 1-5 범위를 벗어남
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('평점은 1-5 범위이어야 합니다');
                });
        });
    });

    describe('Breeder Pets', () => {
        it('GET /api/breeder/:id/pets - 브리더 반려동물 목록 조회', async () => {
            await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/pets`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .query({
                    available: 'true',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(Array.isArray(res.body.item.pets)).toBe(true);
                    expect(res.body.item.pageInfo).toBeDefined();

                    // 분양 가능한 개체만 조회했으므로 모든 개체가 분양 가능해야 함
                    const pets = res.body.item.pets;
                    pets.forEach((pet) => {
                        expect(pet.isAvailable).toBe(true);
                    });
                });
        });

        it('GET /api/breeder/:id/pets - 품종별 필터링', async () => {
            await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/pets`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .query({
                    breed: 'golden_retriever',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    const pets = res.body.item.pets;
                    pets.forEach((pet) => {
                        expect(pet.breed).toBe('golden_retriever');
                    });
                });
        });

        it('GET /api/breeder/:id/pets - 성별 필터링', async () => {
            await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/pets`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .query({
                    gender: 'male',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    const pets = res.body.item.pets;
                    pets.forEach((pet) => {
                        expect(pet.gender).toBe('male');
                    });
                });
        });

        it('GET /api/breeder/:id/pets - 가격 범위 필터링', async () => {
            await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/pets`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .query({
                    minPrice: '500000',
                    maxPrice: '1500000',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    const pets = res.body.item.pets;
                    pets.forEach((pet) => {
                        expect(pet.price).toBeGreaterThanOrEqual(500000);
                        expect(pet.price).toBeLessThanOrEqual(1500000);
                    });
                });
        });

        it('GET /api/breeder/:id/pets - 나이 범위 필터링', async () => {
            await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/pets`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .query({
                    minAge: '2',
                    maxAge: '12',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    const pets = res.body.item.pets;
                    pets.forEach((pet) => {
                        expect(pet.ageInMonths).toBeGreaterThanOrEqual(2);
                        expect(pet.ageInMonths).toBeLessThanOrEqual(12);
                    });
                });
        });

        it('GET /api/breeder/:id/pets - 모든 개체 조회 (분양 완료 포함)', async () => {
            await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/pets`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .query({
                    available: 'all',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(Array.isArray(res.body.item.pets)).toBe(true);
                    // 분양 완료된 개체도 포함되어야 함
                });
        });

        it('GET /api/breeder/:id/pets - 존재하지 않는 브리더의 반려동물 조회', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/nonexistent-id/pets')
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(404)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('브리더를 찾을 수 없습니다');
                });
        });
    });

    describe('Data Privacy and Security', () => {
        it('브리더 프로필에서 민감한 정보가 적절히 필터링되는지 확인', async () => {
            await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    const profile = res.body.item;

                    // 입양자에게는 공개되지 않아야 할 정보들
                    expect(profile.password).toBeUndefined();
                    expect(profile.businessNumber).toBeUndefined();
                    expect(profile.email).toBeUndefined();
                    expect(profile.phone).toBeUndefined();
                    expect(profile.adminNotes).toBeUndefined();
                    expect(profile.internalId).toBeUndefined();

                    // 공개되어야 할 정보들
                    expect(profile.id).toBeDefined();
                    expect(profile.name).toBeDefined();
                    expect(profile.businessName).toBeDefined();
                    expect(profile.verification.status).toBeDefined();
                    expect(profile.profile).toBeDefined();
                    expect(profile.stats).toBeDefined();
                });
        });

        it('후기 목록에서 개인정보가 적절히 보호되는지 확인', async () => {
            await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/reviews`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    const reviews = res.body.item.reviews;
                    reviews.forEach((review) => {
                        // 후기 작성자의 민감한 정보는 보호되어야 함
                        expect(review.reviewer.password).toBeUndefined();
                        expect(review.reviewer.email).toBeUndefined();
                        expect(review.reviewer.phone).toBeUndefined();

                        // 공개 가능한 정보들
                        expect(review.reviewer.name).toBeDefined(); // 익명 처리되거나 부분 공개
                        expect(review.rating).toBeDefined();
                        expect(review.content).toBeDefined();
                        expect(review.createdAt).toBeDefined();
                    });
                });
        });

        it('반려동물 정보에서 불필요한 내부 정보가 제외되는지 확인', async () => {
            await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/pets`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    const pets = res.body.item.pets;
                    pets.forEach((pet) => {
                        // 내부 관리용 정보는 제외되어야 함
                        expect(pet.internalNotes).toBeUndefined();
                        expect(pet.costPrice).toBeUndefined();
                        expect(pet.supplierInfo).toBeUndefined();

                        // 공개되어야 할 정보들
                        expect(pet.id).toBeDefined();
                        expect(pet.name).toBeDefined();
                        expect(pet.breed).toBeDefined();
                        expect(pet.photos).toBeDefined();
                        expect(pet.price).toBeDefined();
                        expect(pet.isAvailable).toBeDefined();
                    });
                });
        });
    });

    describe('Access Control Variations', () => {
        it('다른 브리더가 브리더 프로필을 조회할 때 적절한 정보만 공개', async () => {
            const anotherBreederToken = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: 'another@profile.test',
                    password: 'testpassword123',
                })
                .then((res) => res.body.item.access_token);

            await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}`)
                .set('Authorization', `Bearer ${anotherBreederToken}`)
                .expect(200)
                .expect((res: any) => {
                    const profile = res.body.item;

                    // 다른 브리더에게도 민감한 정보는 비공개
                    expect(profile.password).toBeUndefined();
                    expect(profile.businessNumber).toBeUndefined();
                    expect(profile.email).toBeUndefined();
                    expect(profile.phone).toBeUndefined();

                    // 일반 공개 정보는 접근 가능
                    expect(profile.name).toBeDefined();
                    expect(profile.businessName).toBeDefined();
                    expect(profile.verification.status).toBeDefined();
                });
        });

        it('유효하지 않은 토큰으로 접근 시도', async () => {
            await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}`)
                .set('Authorization', 'Bearer invalid-token-here')
                .expect(401)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('유효하지 않은 토큰입니다');
                });
        });
    });

    describe('Response Structure Validation', () => {
        it('브리더 프로필 응답 구조가 표준을 따르는지 검증', async () => {
            await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    // API 응답 표준 구조
                    expect(res.body.success).toBe(true);
                    expect(res.body.code).toBe(200);
                    expect(res.body.item).toBeDefined();
                    expect(res.body.timestamp).toBeDefined();

                    // 브리더 프로필 구조
                    const profile = res.body.item;
                    expect(profile.id).toBeDefined();
                    expect(profile.name).toBeDefined();
                    expect(profile.businessName).toBeDefined();
                    expect(profile.verification).toBeDefined();
                    expect(profile.profile).toBeDefined();
                    expect(profile.stats).toBeDefined();
                });
        });

        it('후기 목록 응답 구조가 페이지네이션 표준을 따르는지 검증', async () => {
            await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/reviews`)
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
