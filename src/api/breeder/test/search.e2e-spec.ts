import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { AppModule } from '../../../app.module';

/**
 * 브리더 검색 End-to-End 테스트
 * 브리더 검색 및 필터링 관련 모든 시나리오를 테스트합니다.
 * - 기본 검색 기능
 * - 다양한 필터링 옵션 (위치, 품종, 가격대, 인증 상태)
 * - 정렬 기능
 * - 페이지네이션 처리
 * - 공개/비공개 접근 제어
 */
describe('Breeder Search API (e2e)', () => {
    let app: INestApplication;
    let mongod: MongoMemoryServer;
    let adopterToken: string;

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
            email: 'adopter@search.test',
            password: 'testpassword123',
            name: 'Test Adopter',
            phone: '010-1234-5678',
        });
        adopterToken = adopterResponse.body.access_token;

        // 테스트용 브리더 생성
        await request(app.getHttpServer()).post('/api/auth/register/breeder').send({
            email: 'breeder@search.test',
            password: 'testpassword123',
            name: 'Test Breeder',
            phone: '010-9876-5432',
            businessNumber: '123-45-67890',
            businessName: 'Test Pet Farm',
        });
    });

    afterAll(async () => {
        await app.close();
        await mongod.stop();
    });

    describe('Basic Search Functionality', () => {
        it('GET /api/breeder/search - 기본 검색 성공', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/search')
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(Array.isArray(res.body.item.breeders)).toBe(true);
                    expect(res.body.item.pageInfo).toBeDefined();
                    expect(res.body.item.pageInfo.currentPage).toBe(1);
                    expect(res.body.item.pageInfo.totalItems).toBeGreaterThanOrEqual(0);
                });
        });

        it('GET /api/breeder/search - 빈 검색 결과도 정상 처리', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/search')
                .query({
                    location: 'nonexistent-location',
                })
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.breeders).toHaveLength(0);
                    expect(res.body.item.pageInfo.totalItems).toBe(0);
                });
        });
    });

    describe('Location Filtering', () => {
        it('GET /api/breeder/search - 위치별 필터링', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/search')
                .query({
                    location: 'seoul',
                    page: 1,
                    limit: 10,
                })
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.breeders).toBeDefined();
                    expect(res.body.item.pageInfo.currentPage).toBe(1);
                    expect(res.body.item.pageInfo.pageSize).toBe(10);
                });
        });

        it('GET /api/breeder/search - 여러 지역 검색', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/search')
                .query({
                    location: 'seoul,busan,incheon',
                })
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(Array.isArray(res.body.item.breeders)).toBe(true);
                });
        });

        it('GET /api/breeder/search - 유효하지 않은 지역명', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/search')
                .query({
                    location: 'invalid-location-name',
                })
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200) // 빈 결과로 처리
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                });
        });
    });

    describe('Breed Filtering', () => {
        it('GET /api/breeder/search - 품종별 필터링', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/search')
                .query({
                    breed: 'golden_retriever',
                    verified: 'true',
                })
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(Array.isArray(res.body.item.breeders)).toBe(true);
                });
        });

        it('GET /api/breeder/search - 여러 품종 검색', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/search')
                .query({
                    breed: 'golden_retriever,labrador,poodle',
                })
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200);
        });

        it('GET /api/breeder/search - 존재하지 않는 품종', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/search')
                .query({
                    breed: 'nonexistent_breed',
                })
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200) // 빈 결과로 처리
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                });
        });
    });

    describe('Price Range Filtering', () => {
        it('GET /api/breeder/search - 가격대 필터링', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/search')
                .query({
                    minPrice: '500000',
                    maxPrice: '1500000',
                })
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(Array.isArray(res.body.item.breeders)).toBe(true);
                });
        });

        it('GET /api/breeder/search - 최소 가격만 지정', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/search')
                .query({
                    minPrice: '1000000',
                })
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200);
        });

        it('GET /api/breeder/search - 최대 가격만 지정', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/search')
                .query({
                    maxPrice: '2000000',
                })
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200);
        });

        it('GET /api/breeder/search - 잘못된 가격 범위 (최소 > 최대)', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/search')
                .query({
                    minPrice: '1000000',
                    maxPrice: '500000', // min > max
                })
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('최소 가격이 최대 가격보다 클 수 없습니다');
                });
        });

        it('GET /api/breeder/search - 음수 가격', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/search')
                .query({
                    minPrice: '-500000',
                })
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('가격은 0 이상의 값이어야 합니다');
                });
        });
    });

    describe('Sorting Options', () => {
        it('GET /api/breeder/search - 평점순 정렬 (내림차순)', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/search')
                .query({
                    sortBy: 'rating',
                    sortOrder: 'desc',
                })
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    const breeders = res.body.item.breeders;
                    if (breeders.length > 1) {
                        // 정렬이 올바르게 적용되었는지 확인
                        expect(breeders[0].stats.averageRating >= breeders[1].stats.averageRating).toBe(true);
                    }
                });
        });

        it('GET /api/breeder/search - 가입일순 정렬 (최신순)', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/search')
                .query({
                    sortBy: 'createdAt',
                    sortOrder: 'desc',
                })
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200);
        });

        it('GET /api/breeder/search - 입양 완료 수순 정렬', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/search')
                .query({
                    sortBy: 'adoptionCount',
                    sortOrder: 'desc',
                })
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200);
        });

        it('GET /api/breeder/search - 잘못된 정렬 필드', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/search')
                .query({
                    sortBy: 'invalid_field',
                    sortOrder: 'desc',
                })
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('유효하지 않은 정렬 필드입니다');
                });
        });

        it('GET /api/breeder/search - 잘못된 정렬 순서', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/search')
                .query({
                    sortBy: 'rating',
                    sortOrder: 'invalid_order',
                })
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('정렬 순서는 asc 또는 desc이어야 합니다');
                });
        });
    });

    describe('Pagination', () => {
        it('GET /api/breeder/search - 기본 페이지네이션', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/search')
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.item.pageInfo.currentPage).toBe(1);
                    expect(res.body.item.pageInfo.pageSize).toBe(10); // 기본값
                    expect(res.body.item.pageInfo.totalPages).toBeGreaterThanOrEqual(0);
                    expect(typeof res.body.item.pageInfo.hasNextPage).toBe('boolean');
                    expect(typeof res.body.item.pageInfo.hasPrevPage).toBe('boolean');
                });
        });

        it('GET /api/breeder/search - 커스텀 페이지 크기', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/search')
                .query({
                    page: 1,
                    limit: 20,
                })
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.item.pageInfo.pageSize).toBe(20);
                    expect(res.body.item.breeders.length).toBeLessThanOrEqual(20);
                });
        });

        it('GET /api/breeder/search - 잘못된 페이지 번호 (음수)', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/search')
                .query({
                    page: -1,
                    limit: 10,
                })
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('페이지 번호는 1 이상이어야 합니다');
                });
        });

        it('GET /api/breeder/search - 잘못된 페이지 크기 (너무 큰 값)', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/search')
                .query({
                    page: 1,
                    limit: 1000, // 너무 큰 값
                })
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('페이지 크기는 최대 100까지 가능합니다');
                });
        });
    });

    describe('Verification Status Filtering', () => {
        it('GET /api/breeder/search - 인증된 브리더만 검색', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/search')
                .query({
                    verified: 'true',
                })
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    const breeders = res.body.item.breeders;
                    breeders.forEach((breeder: any) => {
                        expect(breeder.verification.status).toBe('approved');
                    });
                });
        });

        it('GET /api/breeder/search - 인증 대기 중인 브리더 검색', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/search')
                .query({
                    verified: 'pending',
                })
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200);
        });

        it('GET /api/breeder/search - 모든 브리더 검색 (인증 상태 무관)', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/search')
                .query({
                    verified: 'all',
                })
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200);
        });
    });

    describe('Access Control', () => {
        it('GET /api/breeder/search - 인증되지 않은 요청 실패', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/search')
                .expect(401)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('인증이 필요합니다');
                });
        });

        it('GET /api/breeder/search - 공개 검색 (설정에 따라)', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/search')
                .query({
                    location: 'seoul',
                    verified: 'true',
                })
                .expect((res: any) => {
                    // 설정에 따라 인증이 필요할 수도, 공개일 수도 있음
                    expect([200, 401]).toContain(res.status);
                });
        });

        it('GET /api/breeder/search - 유효하지 않은 토큰', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/search')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                });
        });
    });

    describe('Complex Search Scenarios', () => {
        it('GET /api/breeder/search - 모든 필터 조건 조합', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/search')
                .query({
                    location: 'seoul',
                    breed: 'golden_retriever',
                    minPrice: '500000',
                    maxPrice: '1500000',
                    verified: 'true',
                    sortBy: 'rating',
                    sortOrder: 'desc',
                    page: 1,
                    limit: 5,
                })
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.pageInfo.pageSize).toBe(5);
                });
        });

        it('GET /api/breeder/search - 특수 문자를 포함한 검색어', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/search')
                .query({
                    keyword: 'test@farm#special$chars',
                })
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200); // 특수문자도 정상 처리
        });

        it('GET /api/breeder/search - 매우 긴 검색어', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/search')
                .query({
                    keyword: 'A'.repeat(500), // 500자 검색어
                })
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(400) // 검색어 길이 제한
                .expect((res: any) => {
                    expect(res.body.error).toContain('검색어는 최대 100자까지');
                });
        });
    });

    describe('Response Structure Validation', () => {
        it('GET /api/breeder/search - 응답 구조가 표준을 따르는지 검증', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/search')
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    // API 응답 표준 구조
                    expect(res.body.success).toBe(true);
                    expect(res.body.code).toBe(200);
                    expect(res.body.item).toBeDefined();
                    expect(res.body.timestamp).toBeDefined();

                    // 브리더 검색 전용 구조
                    expect(res.body.item.breeders).toBeDefined();
                    expect(Array.isArray(res.body.item.breeders)).toBe(true);
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
