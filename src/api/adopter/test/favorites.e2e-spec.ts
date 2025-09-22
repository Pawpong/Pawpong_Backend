import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { AppModule } from '../../../app.module';

/**
 * 입양자 즐겨찾기 End-to-End 테스트
 * 입양자의 즐겨찾기 관리 관련 모든 시나리오를 테스트합니다.
 * - 브리더 즐겨찾기 추가 및 제거
 * - 즐겨찾기 목록 조회 및 정렬
 * - 즐겨찾기 상태 확인
 * - 중복 즐겨찾기 처리
 * - 권한 및 보안 검증
 */
describe('Adopter Favorites API (e2e)', () => {
    let app: INestApplication;
    let mongod: MongoMemoryServer;
    let adopterToken: string;
    let breederToken: string;
    let adopterId: string;
    let breederId: string;
    let secondBreederId: string;

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
            email: 'adopter@test.com',
            password: 'testpassword123',
            name: 'Test Adopter',
            phone: '010-1234-5678',
        });
        adopterToken = adopterResponse.body.access_token;
        adopterId = adopterResponse.body.user.id;

        // 테스트용 브리더 생성
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

        // 추가 브리더 생성 (다중 즐겨찾기 테스트용)
        const secondBreederResponse = await request(app.getHttpServer()).post('/api/auth/register/breeder').send({
            email: 'breeder2@test.com',
            password: 'testpassword123',
            name: 'Second Breeder',
            phone: '010-8765-4321',
            businessNumber: '987-65-43210',
            businessName: 'Second Pet Farm',
        });
        secondBreederId = secondBreederResponse.body.user.id;
    });

    afterAll(async () => {
        await app.close();
        await mongod.stop();
    });

    describe('Successful Favorite Management', () => {
        it('POST /api/adopter/favorites - 브리더 즐겨찾기 추가 성공', async () => {
            await request(app.getHttpServer())
                .post('/api/adopter/favorites')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({
                    breederId: breederId,
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.breederId).toBe(breederId);
                    expect(res.body.item.addedAt).toBeDefined();
                    expect(res.body.message).toContain('즐겨찾기에 추가되었습니다');
                });
        });

        it('GET /api/adopter/favorites - 즐겨찾기 목록 조회 성공', async () => {
            await request(app.getHttpServer())
                .get('/api/adopter/favorites')
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(Array.isArray(res.body.item)).toBe(true);
                    expect(res.body.item.length).toBeGreaterThan(0);
                    expect(res.body.item[0]).toHaveProperty('breederId');
                    expect(res.body.item[0]).toHaveProperty('breederName');
                    expect(res.body.item[0]).toHaveProperty('addedAt');
                });
        });

        it('DELETE /api/adopter/favorites/:breederId - 즐겨찾기 제거 성공', async () => {
            await request(app.getHttpServer())
                .delete(`/api/adopter/favorites/${breederId}`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.message).toContain('즐겨찾기에서 제거되었습니다');
                });
        });
    });

    describe('Multiple Favorites Management', () => {
        beforeEach(async () => {
            // 각 테스트 전에 즐겨찾기 추가
            await request(app.getHttpServer())
                .post('/api/adopter/favorites')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({ breederId: breederId });

            await request(app.getHttpServer())
                .post('/api/adopter/favorites')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({ breederId: secondBreederId });
        });

        afterEach(async () => {
            // 각 테스트 후에 즐겨찾기 정리
            await request(app.getHttpServer())
                .delete(`/api/adopter/favorites/${breederId}`)
                .set('Authorization', `Bearer ${adopterToken}`);

            await request(app.getHttpServer())
                .delete(`/api/adopter/favorites/${secondBreederId}`)
                .set('Authorization', `Bearer ${adopterToken}`);
        });

        it('GET /api/adopter/favorites - 다중 즐겨찾기 목록 조회', async () => {
            await request(app.getHttpServer())
                .get('/api/adopter/favorites')
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.length).toBe(2);
                    const breederIds = res.body.item.map((fav: any) => fav.breederId);
                    expect(breederIds).toContain(breederId);
                    expect(breederIds).toContain(secondBreederId);
                });
        });

        it('GET /api/adopter/favorites - 최신순 정렬 확인', async () => {
            await request(app.getHttpServer())
                .get('/api/adopter/favorites')
                .set('Authorization', `Bearer ${adopterToken}`)
                .query({ sortBy: 'recent' })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    const favorites = res.body.item;
                    if (favorites.length > 1) {
                        const firstDate = new Date(favorites[0].addedAt);
                        const secondDate = new Date(favorites[1].addedAt);
                        expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
                    }
                });
        });
    });

    describe('Favorite Status Check', () => {
        beforeEach(async () => {
            // 테스트용 즐겨찾기 추가
            await request(app.getHttpServer())
                .post('/api/adopter/favorites')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({ breederId: breederId });
        });

        afterEach(async () => {
            // 테스트 후 정리
            await request(app.getHttpServer())
                .delete(`/api/adopter/favorites/${breederId}`)
                .set('Authorization', `Bearer ${adopterToken}`);
        });

        it('GET /api/adopter/favorites/status/:breederId - 즐겨찾기 상태 확인 (등록됨)', async () => {
            await request(app.getHttpServer())
                .get(`/api/adopter/favorites/status/${breederId}`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.isFavorite).toBe(true);
                    expect(res.body.item.addedAt).toBeDefined();
                });
        });

        it('GET /api/adopter/favorites/status/:breederId - 즐겨찾기 상태 확인 (미등록)', async () => {
            await request(app.getHttpServer())
                .get(`/api/adopter/favorites/status/${secondBreederId}`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.isFavorite).toBe(false);
                    expect(res.body.item.addedAt).toBeNull();
                });
        });
    });

    describe('Duplicate and Invalid Operations', () => {
        beforeEach(async () => {
            // 테스트용 즐겨찾기 추가
            await request(app.getHttpServer())
                .post('/api/adopter/favorites')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({ breederId: breederId });
        });

        afterEach(async () => {
            // 테스트 후 정리
            await request(app.getHttpServer())
                .delete(`/api/adopter/favorites/${breederId}`)
                .set('Authorization', `Bearer ${adopterToken}`);
        });

        it('POST /api/adopter/favorites - 중복 즐겨찾기 추가 실패', async () => {
            await request(app.getHttpServer())
                .post('/api/adopter/favorites')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({
                    breederId: breederId,
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('이미 즐겨찾기에 추가된 브리더입니다');
                });
        });

        it('POST /api/adopter/favorites - 존재하지 않는 브리더 즐겨찾기 실패', async () => {
            await request(app.getHttpServer())
                .post('/api/adopter/favorites')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({
                    breederId: '507f1f77bcf86cd799439011', // 존재하지 않는 ID
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('존재하지 않는 브리더입니다');
                });
        });

        it('DELETE /api/adopter/favorites/:breederId - 존재하지 않는 즐겨찾기 제거', async () => {
            await request(app.getHttpServer())
                .delete(`/api/adopter/favorites/${secondBreederId}`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('즐겨찾기에 등록되지 않은 브리더입니다');
                });
        });
    });

    describe('Input Validation', () => {
        it('POST /api/adopter/favorites - 브리더 ID 누락', async () => {
            await request(app.getHttpServer())
                .post('/api/adopter/favorites')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({})
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('브리더 ID는 필수 입력 항목입니다');
                });
        });

        it('POST /api/adopter/favorites - 유효하지 않은 브리더 ID 형식', async () => {
            await request(app.getHttpServer())
                .post('/api/adopter/favorites')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({
                    breederId: 'invalid-id-format',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('올바르지 않은 브리더 ID 형식입니다');
                });
        });

        it('DELETE /api/adopter/favorites/:breederId - 유효하지 않은 브리더 ID 형식', async () => {
            await request(app.getHttpServer())
                .delete('/api/adopter/favorites/invalid-id')
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('올바르지 않은 브리더 ID 형식입니다');
                });
        });
    });

    describe('Self-Favorite Prevention', () => {
        it('POST /api/adopter/favorites - 브리더가 자신을 즐겨찾기 시도', async () => {
            await request(app.getHttpServer())
                .post('/api/adopter/favorites')
                .set('Authorization', `Bearer ${breederToken}`)
                .send({
                    breederId: breederId,
                })
                .expect(403)
                .expect((res: any) => {
                    expect(res.body.message).toContain('입양자만 브리더를 즐겨찾기할 수 있습니다');
                });
        });
    });

    describe('Pagination and Filtering', () => {
        beforeEach(async () => {
            // 다중 즐겨찾기 추가
            await request(app.getHttpServer())
                .post('/api/adopter/favorites')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({ breederId: breederId });

            await request(app.getHttpServer())
                .post('/api/adopter/favorites')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({ breederId: secondBreederId });
        });

        afterEach(async () => {
            // 테스트 후 정리
            await request(app.getHttpServer())
                .delete(`/api/adopter/favorites/${breederId}`)
                .set('Authorization', `Bearer ${adopterToken}`);

            await request(app.getHttpServer())
                .delete(`/api/adopter/favorites/${secondBreederId}`)
                .set('Authorization', `Bearer ${adopterToken}`);
        });

        it('GET /api/adopter/favorites - 페이지네이션 적용', async () => {
            await request(app.getHttpServer())
                .get('/api/adopter/favorites')
                .set('Authorization', `Bearer ${adopterToken}`)
                .query({
                    page: 1,
                    limit: 1,
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.pageInfo).toBeDefined();
                    expect(res.body.pageInfo.currentPage).toBe(1);
                    expect(res.body.pageInfo.pageSize).toBe(1);
                    expect(res.body.item.length).toBeLessThanOrEqual(1);
                });
        });

        it('GET /api/adopter/favorites - 브리더명으로 검색', async () => {
            await request(app.getHttpServer())
                .get('/api/adopter/favorites')
                .set('Authorization', `Bearer ${adopterToken}`)
                .query({
                    search: 'Test Breeder',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    const matchingFavorites = res.body.item.filter((fav: any) => 
                        fav.breederName.includes('Test Breeder')
                    );
                    expect(matchingFavorites.length).toBeGreaterThan(0);
                });
        });
    });

    describe('Access Control and Security', () => {
        it('모든 즐겨찾기 API - 인증 없는 접근 거부', async () => {
            const endpoints = [
                { method: 'get', path: '/api/adopter/favorites' },
                { method: 'post', path: '/api/adopter/favorites' },
                { method: 'delete', path: `/api/adopter/favorites/${breederId}` },
                { method: 'get', path: `/api/adopter/favorites/status/${breederId}` },
            ];

            for (const endpoint of endpoints) {
                await request(app.getHttpServer())[endpoint.method](endpoint.path)
                    .expect(401);
            }
        });

        it('GET /api/adopter/favorites - 다른 입양자의 즐겨찾기 접근 불가', async () => {
            // 다른 입양자 생성
            const otherAdopterResponse = await request(app.getHttpServer())
                .post('/api/auth/register/adopter')
                .send({
                    email: 'other@test.com',
                    password: 'testpassword123',
                    name: 'Other Adopter',
                    phone: '010-5555-5555',
                });

            const otherAdopterToken = otherAdopterResponse.body.access_token;

            await request(app.getHttpServer())
                .get('/api/adopter/favorites')
                .set('Authorization', `Bearer ${otherAdopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.length).toBe(0); // 다른 입양자의 즐겨찾기는 비어있음
                });
        });

        it('즐겨찾기 API - 관리자 접근 제한', async () => {
            await request(app.getHttpServer())
                .get('/api/adopter/favorites')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(403)
                .expect((res: any) => {
                    expect(res.body.message).toContain('입양자만 접근할 수 있습니다');
                });
        });
    });

    describe('Response Data Validation', () => {
        beforeEach(async () => {
            await request(app.getHttpServer())
                .post('/api/adopter/favorites')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({ breederId: breederId });
        });

        afterEach(async () => {
            await request(app.getHttpServer())
                .delete(`/api/adopter/favorites/${breederId}`)
                .set('Authorization', `Bearer ${adopterToken}`);
        });

        it('GET /api/adopter/favorites - 응답 데이터 구조 검증', async () => {
            await request(app.getHttpServer())
                .get('/api/adopter/favorites')
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body).toHaveProperty('success');
                    expect(res.body).toHaveProperty('item');
                    expect(res.body).toHaveProperty('timestamp');
                    
                    if (res.body.item.length > 0) {
                        const favorite = res.body.item[0];
                        expect(favorite).toHaveProperty('breederId');
                        expect(favorite).toHaveProperty('breederName');
                        expect(favorite).toHaveProperty('addedAt');
                        expect(typeof favorite.breederId).toBe('string');
                        expect(typeof favorite.breederName).toBe('string');
                        expect(new Date(favorite.addedAt)).toBeInstanceOf(Date);
                    }
                });
        });

        it('GET /api/adopter/favorites/status/:breederId - 상태 응답 구조 검증', async () => {
            await request(app.getHttpServer())
                .get(`/api/adopter/favorites/status/${breederId}`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item).toHaveProperty('isFavorite');
                    expect(res.body.item).toHaveProperty('addedAt');
                    expect(typeof res.body.item.isFavorite).toBe('boolean');
                    
                    if (res.body.item.isFavorite) {
                        expect(res.body.item.addedAt).not.toBeNull();
                        expect(new Date(res.body.item.addedAt)).toBeInstanceOf(Date);
                    }
                });
        });
    });
});