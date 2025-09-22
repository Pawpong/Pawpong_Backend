import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestingApp, AuthHelper, TestDataHelper, ResponseValidator } from './test-utils';

describe('Breeder API E2E Tests', () => {
    let app: INestApplication;
    let authHelper: AuthHelper;
    let adopterToken: string;
    let breederToken: string;
    let breederId: string;

    beforeAll(async () => {
        app = await createTestingApp();
        authHelper = new AuthHelper(app);

        // 테스트용 토큰 생성
        const adopterAuth = await authHelper.getAdopterToken();
        adopterToken = adopterAuth.accessToken;

        const breederAuth = await authHelper.getBreederToken();
        breederToken = breederAuth.accessToken;
        breederId = breederAuth.userId;
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /api/breeder/explore', () => {
        it('필터 없이 브리더 목록 조회 성공', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder/explore')
                .expect(200);

            ResponseValidator.validatePaginationResponse(response);
            expect(response.body.message).toBe('브리더 목록이 조회되었습니다.');
        });

        it('강아지 타입으로 필터링', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder/explore')
                .query({ petType: 'dog' })
                .expect(200);

            ResponseValidator.validatePaginationResponse(response);
            
            // 결과가 있다면 모두 강아지 타입이어야 함
            if (response.body.item.item.length > 0) {
                response.body.item.item.forEach((breeder: any) => {
                    expect(['dog', null]).toContain(breeder.petType);
                });
            }
        });

        it('고양이 타입으로 필터링', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder/explore')
                .query({ petType: 'cat' })
                .expect(200);

            ResponseValidator.validatePaginationResponse(response);
            
            // 결과가 있다면 모두 고양이 타입이어야 함
            if (response.body.item.item.length > 0) {
                response.body.item.item.forEach((breeder: any) => {
                    expect(['cat', null]).toContain(breeder.petType);
                });
            }
        });

        it('강아지 크기로 필터링', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder/explore')
                .query({ 
                    petType: 'dog',
                    dogSize: 'small' 
                })
                .expect(200);

            ResponseValidator.validatePaginationResponse(response);
        });

        it('고양이 털 길이로 필터링', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder/explore')
                .query({ 
                    petType: 'cat',
                    catFur: 'short' 
                })
                .expect(200);

            ResponseValidator.validatePaginationResponse(response);
        });

        it('지역으로 필터링', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder/explore')
                .query({ 
                    province: '서울특별시',
                    city: '강남구' 
                })
                .expect(200);

            ResponseValidator.validatePaginationResponse(response);
        });

        it('입양 가능 여부로 필터링', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder/explore')
                .query({ isAdoptionAvailable: true })
                .expect(200);

            ResponseValidator.validatePaginationResponse(response);
            
            // 결과가 있다면 모두 입양 가능해야 함
            if (response.body.item.item.length > 0) {
                response.body.item.item.forEach((breeder: any) => {
                    expect(breeder.isAdoptionAvailable).toBe(true);
                });
            }
        });

        it('브리더 레벨로 필터링', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder/explore')
                .query({ level: 'elite' })
                .expect(200);

            ResponseValidator.validatePaginationResponse(response);
            
            // 결과가 있다면 모두 엘리트 레벨이어야 함
            if (response.body.item.item.length > 0) {
                response.body.item.item.forEach((breeder: any) => {
                    expect(breeder.breederLevel).toBe('elite');
                });
            }
        });

        it('정렬 옵션 - 최신순', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder/explore')
                .query({ sortBy: 'latest' })
                .expect(200);

            ResponseValidator.validatePaginationResponse(response);
            
            // 최신순 정렬 확인
            if (response.body.item.item.length > 1) {
                const dates = response.body.item.item.map((b: any) => new Date(b.createdAt).getTime());
                for (let i = 0; i < dates.length - 1; i++) {
                    expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
                }
            }
        });

        it('정렬 옵션 - 찜 많은 순', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder/explore')
                .query({ sortBy: 'favorite' })
                .expect(200);

            ResponseValidator.validatePaginationResponse(response);
            
            // 찜 개수 내림차순 정렬 확인
            if (response.body.item.item.length > 1) {
                const counts = response.body.item.item.map((b: any) => b.favoriteCount);
                for (let i = 0; i < counts.length - 1; i++) {
                    expect(counts[i]).toBeGreaterThanOrEqual(counts[i + 1]);
                }
            }
        });

        it('정렬 옵션 - 리뷰 많은 순', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder/explore')
                .query({ sortBy: 'review' })
                .expect(200);

            ResponseValidator.validatePaginationResponse(response);
            
            // 리뷰 개수 내림차순 정렬 확인
            if (response.body.item.item.length > 1) {
                const reviews = response.body.item.item.map((b: any) => b.totalReviews);
                for (let i = 0; i < reviews.length - 1; i++) {
                    expect(reviews[i]).toBeGreaterThanOrEqual(reviews[i + 1]);
                }
            }
        });

        it('정렬 옵션 - 가격 낮은 순', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder/explore')
                .query({ sortBy: 'price_asc' })
                .set('Authorization', `Bearer ${adopterToken}`) // 가격 정보는 로그인 필요
                .expect(200);

            ResponseValidator.validatePaginationResponse(response);
        });

        it('페이지네이션 테스트', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder/explore')
                .query({ 
                    page: 1,
                    take: 5 
                })
                .expect(200);

            ResponseValidator.validatePaginationResponse(response);
            expect(response.body.item.pageInfo.currentPage).toBe(1);
            expect(response.body.item.pageInfo.pageSize).toBe(5);
            expect(response.body.item.item.length).toBeLessThanOrEqual(5);
        });

        it('로그인한 사용자는 가격 정보를 볼 수 있음', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder/explore')
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200);

            ResponseValidator.validatePaginationResponse(response);
            
            // 로그인한 사용자는 가격 정보를 볼 수 있어야 함
            if (response.body.item.item.length > 0) {
                response.body.item.item.forEach((breeder: any) => {
                    if (breeder.priceDisplay === 'range') {
                        expect(breeder).toHaveProperty('priceRange');
                    }
                });
            }
        });

        it('로그인하지 않은 사용자는 가격 정보를 볼 수 없음', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder/explore')
                .expect(200);

            ResponseValidator.validatePaginationResponse(response);
            
            // 로그인하지 않은 사용자는 가격 정보가 없어야 함
            if (response.body.item.item.length > 0) {
                response.body.item.item.forEach((breeder: any) => {
                    expect(breeder.priceRange).toBeUndefined();
                });
            }
        });
    });

    describe('GET /api/breeder/popular', () => {
        it('인기 브리더 목록 조회 성공', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder/popular')
                .expect(200);

            ResponseValidator.validateApiResponse(response);
            expect(response.body.message).toBe('인기 브리더 목록이 조회되었습니다.');
            expect(Array.isArray(response.body.item)).toBe(true);
            expect(response.body.item.length).toBeLessThanOrEqual(10);
        });

        it('인기 브리더는 찜과 평점이 높아야 함', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder/popular')
                .expect(200);

            if (response.body.item.length > 1) {
                // 첫 번째 브리더가 가장 인기가 높아야 함
                const first = response.body.item[0];
                const second = response.body.item[1];
                
                // 찜 개수 또는 평점이 더 높아야 함
                const firstScore = first.favoriteCount + first.averageRating;
                const secondScore = second.favoriteCount + second.averageRating;
                expect(firstScore).toBeGreaterThanOrEqual(secondScore);
            }
        });
    });

    describe('GET /api/breeder/search (레거시)', () => {
        it('레거시 검색 API 동작 확인', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder/search')
                .query({ keyword: '테스트' })
                .expect(200);

            ResponseValidator.validateApiResponse(response);
            expect(response.body.message).toBe('브리더 검색이 완료되었습니다.');
        });

        it('레거시 API 위치 필터링', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder/search')
                .query({ location: '서울' })
                .expect(200);

            ResponseValidator.validateApiResponse(response);
        });

        it('레거시 API 품종 필터링', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder/search')
                .query({ breed: '포메라니안' })
                .expect(200);

            ResponseValidator.validateApiResponse(response);
        });
    });

    describe('GET /api/breeder/:id', () => {
        it('인증된 사용자가 브리더 프로필 상세 조회', async () => {
            // 먼저 브리더 목록에서 ID를 가져옴
            const listResponse = await request(app.getHttpServer())
                .get('/api/breeder/explore')
                .expect(200);

            if (listResponse.body.item.item.length > 0) {
                const testBreederId = listResponse.body.item.item[0].breederId;

                const response = await request(app.getHttpServer())
                    .get(`/api/breeder/${testBreederId}`)
                    .set('Authorization', `Bearer ${adopterToken}`)
                    .expect(200);

                ResponseValidator.validateApiResponse(response);
                expect(response.body.message).toBe('브리더 프로필이 조회되었습니다.');
                
                // 프로필 상세 정보 확인
                expect(response.body.item).toHaveProperty('breederId');
                expect(response.body.item).toHaveProperty('breederName');
                expect(response.body.item).toHaveProperty('breederLevel');
                expect(response.body.item).toHaveProperty('verificationStatus');
            }
        });

        it('인증되지 않은 사용자는 브리더 상세 조회 불가', async () => {
            await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}`)
                .expect(401);
        });

        it('존재하지 않는 브리더 ID로 조회시 실패', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder/invalid-breeder-id')
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('브리더를 찾을 수 없습니다');
        });

        it('브리더 프로필에는 부모견/묘 정보가 포함되어야 함', async () => {
            const listResponse = await request(app.getHttpServer())
                .get('/api/breeder/explore')
                .expect(200);

            if (listResponse.body.item.item.length > 0) {
                const testBreederId = listResponse.body.item.item[0].breederId;

                const response = await request(app.getHttpServer())
                    .get(`/api/breeder/${testBreederId}`)
                    .set('Authorization', `Bearer ${adopterToken}`)
                    .expect(200);

                expect(response.body.item).toHaveProperty('parentPets');
                expect(Array.isArray(response.body.item.parentPets)).toBe(true);
            }
        });

        it('브리더 프로필에는 분양 가능한 아이들 정보가 포함되어야 함', async () => {
            const listResponse = await request(app.getHttpServer())
                .get('/api/breeder/explore')
                .expect(200);

            if (listResponse.body.item.item.length > 0) {
                const testBreederId = listResponse.body.item.item[0].breederId;

                const response = await request(app.getHttpServer())
                    .get(`/api/breeder/${testBreederId}`)
                    .set('Authorization', `Bearer ${adopterToken}`)
                    .expect(200);

                expect(response.body.item).toHaveProperty('availablePets');
                expect(Array.isArray(response.body.item.availablePets)).toBe(true);
            }
        });

        it('브리더 프로필에는 후기 정보가 포함되어야 함', async () => {
            const listResponse = await request(app.getHttpServer())
                .get('/api/breeder/explore')
                .expect(200);

            if (listResponse.body.item.item.length > 0) {
                const testBreederId = listResponse.body.item.item[0].breederId;

                const response = await request(app.getHttpServer())
                    .get(`/api/breeder/${testBreederId}`)
                    .set('Authorization', `Bearer ${adopterToken}`)
                    .expect(200);

                expect(response.body.item).toHaveProperty('reviews');
                expect(response.body.item).toHaveProperty('averageRating');
                expect(response.body.item).toHaveProperty('totalReviews');
            }
        });
    });
});