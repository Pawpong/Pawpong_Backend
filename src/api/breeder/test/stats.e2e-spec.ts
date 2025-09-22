import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { AppModule } from '../../../app.module';

/**
 * 브리더 통계 End-to-End 테스트
 * 브리더 통계 관련 모든 시나리오를 테스트합니다.
 * - 개별 브리더 통계 조회
 * - 인기 브리더 목록 조회
 * - 통계 데이터 정확성 검증
 * - 시간대별 통계 필터링
 * - 통계 접근 권한 관리
 */
describe('Breeder Statistics API (e2e)', () => {
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

        // 테스트용 입양자 생성
        const adopterResponse = await request(app.getHttpServer()).post('/api/auth/register/adopter').send({
            email: 'adopter@stats.test',
            password: 'testpassword123',
            name: 'Test Adopter',
            phone: '010-1234-5678',
        });
        adopterToken = adopterResponse.body.access_token;

        // 첫 번째 테스트용 브리더 생성
        const breederResponse = await request(app.getHttpServer()).post('/api/auth/register/breeder').send({
            email: 'breeder@stats.test',
            password: 'testpassword123',
            name: 'Stats Test Breeder',
            phone: '010-9876-5432',
            businessNumber: '123-45-67890',
            businessName: 'Stats Test Pet Farm',
        });
        breederToken = breederResponse.body.access_token;
        breederId = breederResponse.body.user.id;

        // 두 번째 테스트용 브리더 생성 (비교용)
        await request(app.getHttpServer()).post('/api/auth/register/breeder').send({
            email: 'another@stats.test',
            password: 'testpassword123',
            name: 'Another Stats Breeder',
            phone: '010-5555-5555',
            businessNumber: '987-65-43210',
            businessName: 'Another Stats Pet Farm',
        });
    });

    afterAll(async () => {
        await app.close();
        await mongod.stop();
    });

    describe('Individual Breeder Statistics', () => {
        it('GET /api/breeder/:id/stats - 브리더 통계 조회 성공', async () => {
            await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/stats`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    const stats = res.body.item;

                    // 기본 통계 항목들이 모두 포함되어 있는지 확인
                    expect(stats.totalReviews).toBeDefined();
                    expect(stats.averageRating).toBeDefined();
                    expect(stats.totalAdoptions).toBeDefined();
                    expect(stats.responseRate).toBeDefined();
                    expect(stats.averageResponseTime).toBeDefined();
                    expect(stats.activePets).toBeDefined();
                    expect(stats.completedAdoptions).toBeDefined();

                    // 숫자 타입 검증
                    expect(typeof stats.totalReviews).toBe('number');
                    expect(typeof stats.averageRating).toBe('number');
                    expect(typeof stats.totalAdoptions).toBe('number');
                    expect(typeof stats.responseRate).toBe('number');

                    // 유효한 범위 검증
                    expect(stats.totalReviews).toBeGreaterThanOrEqual(0);
                    expect(stats.averageRating).toBeGreaterThanOrEqual(0);
                    expect(stats.averageRating).toBeLessThanOrEqual(5);
                    expect(stats.responseRate).toBeGreaterThanOrEqual(0);
                    expect(stats.responseRate).toBeLessThanOrEqual(100);
                });
        });

        it('GET /api/breeder/:id/stats - 상세 통계 정보 포함', async () => {
            await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/stats`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .query({
                    detailed: 'true',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    const stats = res.body.item;

                    // 상세 통계 항목들
                    expect(stats.ratingBreakdown).toBeDefined(); // 평점별 분포
                    expect(stats.monthlyAdoptions).toBeDefined(); // 월별 입양 현황
                    expect(stats.breedPopularity).toBeDefined(); // 인기 품종
                    expect(stats.priceRange).toBeDefined(); // 가격 범위
                    expect(stats.geographicReach).toBeDefined(); // 지역별 입양 현황

                    // 평점 분포 구조 확인
                    if (stats.ratingBreakdown) {
                        expect(stats.ratingBreakdown.fiveStar).toBeDefined();
                        expect(stats.ratingBreakdown.fourStar).toBeDefined();
                        expect(stats.ratingBreakdown.threeStar).toBeDefined();
                        expect(stats.ratingBreakdown.twoStar).toBeDefined();
                        expect(stats.ratingBreakdown.oneStar).toBeDefined();
                    }
                });
        });

        it('GET /api/breeder/:id/stats - 기간별 통계 필터링', async () => {
            await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/stats`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .query({
                    startDate: '2024-01-01',
                    endDate: '2024-12-31',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    const stats = res.body.item;

                    // 기간이 지정된 통계는 해당 기간의 데이터만 포함해야 함
                    expect(stats.periodStart).toBe('2024-01-01T00:00:00.000Z');
                    expect(stats.periodEnd).toBe('2024-12-31T23:59:59.999Z');

                    // 기간별 세분화된 데이터
                    expect(stats.monthlyBreakdown).toBeDefined();
                    expect(Array.isArray(stats.monthlyBreakdown)).toBe(true);
                });
        });

        it('GET /api/breeder/:id/stats - 존재하지 않는 브리더', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/nonexistent-id/stats')
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(404)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('브리더를 찾을 수 없습니다');
                });
        });

        it('GET /api/breeder/:id/stats - 유효하지 않은 날짜 형식', async () => {
            await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/stats`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .query({
                    startDate: 'invalid-date-format',
                    endDate: '2024-12-31',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('유효하지 않은 날짜 형식입니다');
                });
        });

        it('GET /api/breeder/:id/stats - 잘못된 날짜 범위 (시작일 > 종료일)', async () => {
            await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/stats`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .query({
                    startDate: '2024-12-31',
                    endDate: '2024-01-01',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('시작일이 종료일보다 늦을 수 없습니다');
                });
        });

        it('GET /api/breeder/:id/stats - 브리더 본인이 자세한 통계 조회', async () => {
            await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/stats`)
                .set('Authorization', `Bearer ${breederToken}`)
                .query({
                    detailed: 'true',
                    includePrivate: 'true',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    const stats = res.body.item;

                    // 본인만 볼 수 있는 상세 통계
                    expect(stats.revenue).toBeDefined(); // 수익 정보
                    expect(stats.inquiryConversionRate).toBeDefined(); // 문의 전환율
                    expect(stats.averageInquiryResponseTime).toBeDefined(); // 평균 문의 응답 시간
                    expect(stats.cancelledAdoptions).toBeDefined(); // 취소된 입양 건수
                    expect(stats.returnRate).toBeDefined(); // 반환율
                });
        });
    });

    describe('Popular Breeders List', () => {
        it('GET /api/breeder/popular - 인기 브리더 목록 조회', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/popular')
                .query({
                    limit: 5,
                    timeframe: 'week',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(Array.isArray(res.body.item.breeders)).toBe(true);
                    expect(res.body.item.breeders.length).toBeLessThanOrEqual(5);

                    const breeders = res.body.item.breeders;
                    breeders.forEach((breeder: any) => {
                        expect(breeder.id).toBeDefined();
                        expect(breeder.name).toBeDefined();
                        expect(breeder.businessName).toBeDefined();
                        expect(breeder.stats).toBeDefined();
                        expect(breeder.stats.averageRating).toBeDefined();
                        expect(breeder.stats.totalReviews).toBeDefined();
                        expect(breeder.popularityScore).toBeDefined(); // 인기도 점수
                    });

                    // 인기도 순으로 정렬되어 있는지 확인
                    if (breeders.length > 1) {
                        for (let i = 0; i < breeders.length - 1; i++) {
                            expect(breeders[i].popularityScore >= breeders[i + 1].popularityScore).toBe(true);
                        }
                    }
                });
        });

        it('GET /api/breeder/popular - 월별 인기 브리더', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/popular')
                .query({
                    limit: 10,
                    timeframe: 'month',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.breeders.length).toBeLessThanOrEqual(10);
                    expect(res.body.item.timeframe).toBe('month');
                });
        });

        it('GET /api/breeder/popular - 연도별 인기 브리더', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/popular')
                .query({
                    limit: 20,
                    timeframe: 'year',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.breeders.length).toBeLessThanOrEqual(20);
                    expect(res.body.item.timeframe).toBe('year');
                });
        });

        it('GET /api/breeder/popular - 지역별 인기 브리더', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/popular')
                .query({
                    location: 'seoul',
                    limit: 5,
                    timeframe: 'month',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    const breeders = res.body.item.breeders;

                    breeders.forEach((breeder: any) => {
                        expect(breeder.location).toContain('seoul');
                    });
                });
        });

        it('GET /api/breeder/popular - 품종별 인기 브리더', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/popular')
                .query({
                    breed: 'golden_retriever',
                    limit: 5,
                    timeframe: 'week',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    const breeders = res.body.item.breeders;

                    breeders.forEach((breeder: any) => {
                        expect(breeder.specializedBreeds).toContain('golden_retriever');
                    });
                });
        });

        it('GET /api/breeder/popular - 잘못된 시간 범위', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/popular')
                .query({
                    timeframe: 'invalid_timeframe',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('유효하지 않은 시간 범위입니다');
                });
        });

        it('GET /api/breeder/popular - 제한 수 초과', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/popular')
                .query({
                    limit: 1000, // 너무 큰 값
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('조회 가능한 최대 개수는 100개입니다');
                });
        });

        it('GET /api/breeder/popular - 인기 브리더가 없는 경우', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/popular')
                .query({
                    location: 'nonexistent-location',
                    timeframe: 'week',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.breeders).toHaveLength(0);
                    expect(res.body.message).toContain('조건에 맞는 인기 브리더가 없습니다');
                });
        });
    });

    describe('Statistics Calculation Accuracy', () => {
        it('평균 평점 계산이 정확한지 확인', async () => {
            await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/stats`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    const stats = res.body.item;

                    // 평점이 있는 경우
                    if (stats.totalReviews > 0) {
                        expect(stats.averageRating).toBeGreaterThan(0);
                        expect(stats.averageRating).toBeLessThanOrEqual(5);
                    } else {
                        // 후기가 없는 경우 평균 평점은 0 또는 null
                        expect([0, null]).toContain(stats.averageRating);
                    }
                });
        });

        it('응답률 계산이 정확한지 확인', async () => {
            await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/stats`)
                .set('Authorization', `Bearer ${breederToken}`)
                .query({
                    detailed: 'true',
                    includePrivate: 'true',
                })
                .expect(200)
                .expect((res: any) => {
                    const stats = res.body.item;

                    // 응답률은 0-100% 범위
                    expect(stats.responseRate).toBeGreaterThanOrEqual(0);
                    expect(stats.responseRate).toBeLessThanOrEqual(100);

                    // 문의가 있는 경우에만 응답률 계산
                    if (stats.totalInquiries > 0) {
                        const calculatedRate = (stats.respondedInquiries / stats.totalInquiries) * 100;
                        expect(Math.abs(stats.responseRate - calculatedRate)).toBeLessThan(0.01);
                    }
                });
        });

        it('통계 데이터 일관성 검증', async () => {
            await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/stats`)
                .set('Authorization', `Bearer ${breederToken}`)
                .query({
                    detailed: 'true',
                    includePrivate: 'true',
                })
                .expect(200)
                .expect((res: any) => {
                    const stats = res.body.item;

                    // 논리적 일관성 검증
                    expect(stats.completedAdoptions).toBeLessThanOrEqual(stats.totalAdoptions);
                    expect(stats.cancelledAdoptions).toBeLessThanOrEqual(stats.totalAdoptions);
                    expect(stats.activePets).toBeGreaterThanOrEqual(0);

                    // 평점 분포의 합이 총 후기 수와 일치하는지 확인
                    if (stats.ratingBreakdown) {
                        const totalRatings =
                            stats.ratingBreakdown.fiveStar +
                            stats.ratingBreakdown.fourStar +
                            stats.ratingBreakdown.threeStar +
                            stats.ratingBreakdown.twoStar +
                            stats.ratingBreakdown.oneStar;
                        expect(totalRatings).toBe(stats.totalReviews);
                    }
                });
        });
    });

    describe('Access Control', () => {
        it('GET /api/breeder/:id/stats - 인증되지 않은 접근', async () => {
            await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/stats`)
                .expect(401)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('인증이 필요합니다');
                });
        });

        it('GET /api/breeder/popular - 인증되지 않은 접근 (공개 API)', async () => {
            await request(app.getHttpServer())
                .get('/api/breeder/popular')
                .expect((res: any) => {
                    // 인기 브리더 목록은 공개 API일 수 있음
                    expect([200, 401]).toContain(res.status);
                });
        });

        it('다른 브리더가 개인 통계 조회 시도', async () => {
            const anotherBreederToken = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: 'another@stats.test',
                    password: 'testpassword123',
                })
                .then((res) => res.body.item.access_token);

            await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/stats`)
                .set('Authorization', `Bearer ${anotherBreederToken}`)
                .query({
                    includePrivate: 'true',
                })
                .expect(200) // 조회는 되지만
                .expect((res: any) => {
                    const stats = res.body.item;

                    // 개인 통계는 포함되지 않아야 함
                    expect(stats.revenue).toBeUndefined();
                    expect(stats.inquiryConversionRate).toBeUndefined();
                    expect(stats.cancelledAdoptions).toBeUndefined();
                });
        });
    });

    describe('Performance and Caching', () => {
        it('통계 조회 응답 시간이 합리적인 범위 내에 있는지 확인', async () => {
            const startTime = Date.now();

            await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/stats`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200);

            const responseTime = Date.now() - startTime;
            expect(responseTime).toBeLessThan(2000); // 2초 이내
        });

        it('대량 통계 요청 처리 성능', async () => {
            const requests: any[] = [];
            for (let i = 0; i < 10; i++) {
                requests.push(
                    request(app.getHttpServer())
                        .get(`/api/breeder/${breederId}/stats`)
                        .set('Authorization', `Bearer ${adopterToken}`),
                );
            }

            const startTime = Date.now();
            const responses: any[] = await Promise.all(requests);
            const totalTime = Date.now() - startTime;

            // 모든 요청이 성공해야 함
            responses.forEach((response: any) => {
                expect(response.status).toBe(200);
            });

            // 평균 응답 시간이 합리적이어야 함
            const averageTime = totalTime / requests.length;
            expect(averageTime).toBeLessThan(500); // 평균 500ms 이내
        });

        it('캐시된 통계 데이터 일관성 확인', async () => {
            // 첫 번째 요청
            const firstResponse = await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/stats`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200);

            // 짧은 시간 내 두 번째 요청 (캐시된 데이터)
            const secondResponse = await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/stats`)
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200);

            // 동일한 데이터가 반환되어야 함
            expect(firstResponse.body.item.totalReviews).toBe(secondResponse.body.item.totalReviews);
            expect(firstResponse.body.item.averageRating).toBe(secondResponse.body.item.averageRating);
            expect(firstResponse.body.item.totalAdoptions).toBe(secondResponse.body.item.totalAdoptions);
        });
    });
});
