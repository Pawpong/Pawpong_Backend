import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestingApp } from './test-utils';

/**
 * Breeder 도메인 E2E 테스트
 *
 * 테스트 범위:
 * 1. 브리더 탐색 (POST /api/breeder/explore) - 필터링 및 정렬
 * 2. 인기 브리더 조회 (GET /api/breeder/popular)
 * 3. 브리더 프로필 상세 (GET /api/breeder/:id)
 * 4. 브리더 후기 목록 (GET /api/breeder/:id/reviews)
 * 5. 브리더 반려동물 목록 (GET /api/breeder/:id/pets)
 * 6. 반려동물 상세 정보 (GET /api/breeder/:id/pet/:petId)
 * 7. 부모견/부모묘 목록 (GET /api/breeder/:id/parent-pets)
 * 8. 입양 신청 폼 구조 (GET /api/breeder/:id/application-form)
 * 9. 레거시 브리더 검색 (GET /api/breeder/search)
 *
 * 모든 API는 공개 API이므로 인증 불필요 (일부 기능은 인증 시 추가 정보 제공)
 */
describe('Breeder API E2E Tests', () => {
    let app: INestApplication;
    let adopterToken: string;
    let adopterId: string;
    let breederToken: string;
    let breederId: string;

    beforeAll(async () => {
        app = await createTestingApp();
        await setupTestUsers();
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    /**
     * 테스트용 사용자 계정 생성 및 토큰 획득
     */
    async function setupTestUsers() {
        // 1. 입양자 회원가입
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
        breederId = breederResponse.body.data.userId;
    }

    // ==================== 1. 브리더 탐색 (POST /api/breeder/explore) ====================
    describe('POST /api/breeder/explore - 브리더 탐색', () => {
        it('[성공] 기본 검색 - 강아지 브리더 조회', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/breeder/explore')
                .send({
                    petType: 'dog',
                    page: 1,
                    take: 20,
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.code).toBe(200);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.items).toBeInstanceOf(Array);
            expect(response.body.data.pagination).toBeDefined();
            expect(response.body.data.pagination.currentPage).toBe(1);
            expect(response.body.data.pagination.pageSize).toBeLessThanOrEqual(20);

            // 브리더 카드 정보 검증
            if (response.body.data.items.length > 0) {
                const breeder = response.body.data.items[0];
                expect(breeder.breederId).toBeDefined();
                expect(breeder.breederName).toBeDefined();
                expect(breeder.breederLevel).toMatch(/^(new|elite)$/);
                expect(breeder.location).toBeDefined();
                expect(breeder.mainBreed).toBeDefined();
                expect(typeof breeder.isAdoptionAvailable).toBe('boolean');
                expect(typeof breeder.favoriteCount).toBe('number');
                expect(typeof breeder.isFavorited).toBe('boolean');
                expect(breeder.representativePhotos).toBeInstanceOf(Array);
                expect(typeof breeder.totalReviews).toBe('number');
                expect(typeof breeder.averageRating).toBe('number');
                expect(breeder.createdAt).toBeDefined();
            }
        });

        it('[성공] 고양이 브리더 검색 with 털 길이 필터', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/breeder/explore')
                .send({
                    petType: 'cat',
                    catFurLength: ['long'],
                    page: 1,
                    take: 20,
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.items).toBeInstanceOf(Array);
        });

        it('[성공] 강아지 브리더 검색 with 크기 필터 (소형, 중형)', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/breeder/explore')
                .send({
                    petType: 'dog',
                    dogSize: ['small', 'medium'],
                    page: 1,
                    take: 20,
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.items).toBeInstanceOf(Array);
        });

        it('[성공] 지역 필터 적용 (도 + 시/군/구)', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/breeder/explore')
                .send({
                    petType: 'dog',
                    province: ['경기도'],
                    city: ['파주시'],
                    page: 1,
                    take: 20,
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.items).toBeInstanceOf(Array);
        });

        it('[성공] 입양 가능 여부 필터', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/breeder/explore')
                .send({
                    petType: 'dog',
                    isAdoptionAvailable: true,
                    page: 1,
                    take: 20,
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.items).toBeInstanceOf(Array);

            // 모든 브리더가 입양 가능 상태인지 확인
            if (response.body.data.items.length > 0) {
                response.body.data.items.forEach((breeder: any) => {
                    expect(breeder.isAdoptionAvailable).toBe(true);
                });
            }
        });

        it('[성공] 브리더 레벨 필터 (new, elite)', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/breeder/explore')
                .send({
                    petType: 'dog',
                    breederLevel: ['elite'],
                    page: 1,
                    take: 20,
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.items).toBeInstanceOf(Array);

            // 모든 브리더가 elite 레벨인지 확인
            if (response.body.data.items.length > 0) {
                response.body.data.items.forEach((breeder: any) => {
                    expect(breeder.breederLevel).toBe('elite');
                });
            }
        });

        it('[성공] 정렬 - 최신순 (latest)', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/breeder/explore')
                .send({
                    petType: 'dog',
                    sortBy: 'latest',
                    page: 1,
                    take: 20,
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.items).toBeInstanceOf(Array);

            // 날짜 내림차순 확인 (최신순)
            if (response.body.data.items.length > 1) {
                const dates = response.body.data.items.map((b: any) => new Date(b.createdAt).getTime());
                for (let i = 0; i < dates.length - 1; i++) {
                    expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
                }
            }
        });

        it('[성공] 정렬 - 찜 많은순 (favorite)', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/breeder/explore')
                .send({
                    petType: 'dog',
                    sortBy: 'favorite',
                    page: 1,
                    take: 20,
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.items).toBeInstanceOf(Array);

            // 찜 개수 내림차순 확인
            if (response.body.data.items.length > 1) {
                const favoriteCounts = response.body.data.items.map((b: any) => b.favoriteCount);
                for (let i = 0; i < favoriteCounts.length - 1; i++) {
                    expect(favoriteCounts[i]).toBeGreaterThanOrEqual(favoriteCounts[i + 1]);
                }
            }
        });

        it('[성공] 정렬 - 리뷰 많은순 (review)', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/breeder/explore')
                .send({
                    petType: 'dog',
                    sortBy: 'review',
                    page: 1,
                    take: 20,
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.items).toBeInstanceOf(Array);
        });

        it('[성공] 복합 필터 - 강아지 + 대형견 + 경기도 + 입양가능 + 엘리트 + 최신순', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/breeder/explore')
                .send({
                    petType: 'dog',
                    dogSize: ['large'],
                    province: ['경기도'],
                    isAdoptionAvailable: true,
                    breederLevel: ['elite'],
                    sortBy: 'latest',
                    page: 1,
                    take: 20,
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.items).toBeInstanceOf(Array);
        });

        it('[성공] 페이지네이션 - 2페이지 조회', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/breeder/explore')
                .send({
                    petType: 'dog',
                    page: 2,
                    take: 10,
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.pagination.currentPage).toBe(2);
            expect(response.body.data.pagination.pageSize).toBeLessThanOrEqual(10);
        });

        it('[성공] 인증된 사용자 - 찜 여부 포함', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/breeder/explore')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({
                    petType: 'dog',
                    page: 1,
                    take: 20,
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.items).toBeInstanceOf(Array);

            // 인증된 사용자는 찜 여부 확인 가능
            if (response.body.data.items.length > 0) {
                expect(typeof response.body.data.items[0].isFavorited).toBe('boolean');
            }
        });

        it('[실패] petType 누락', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/breeder/explore')
                .send({
                    page: 1,
                    take: 20,
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('[실패] 잘못된 petType 값', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/breeder/explore')
                .send({
                    petType: 'bird', // dog 또는 cat만 허용
                    page: 1,
                    take: 20,
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    // ==================== 2. 인기 브리더 조회 (GET /api/breeder/popular) ====================
    describe('GET /api/breeder/popular - 인기 브리더 조회', () => {
        it('[성공] 인기 브리더 Top 10 조회', async () => {
            const response = await request(app.getHttpServer()).get('/api/breeder/popular').expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.code).toBe(200);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.data.length).toBeLessThanOrEqual(10);

            // 브리더 카드 정보 검증
            if (response.body.data.length > 0) {
                const breeder = response.body.data[0];
                expect(breeder.breederId).toBeDefined();
                expect(breeder.breederName).toBeDefined();
                expect(breeder.location).toBeDefined();
                expect(breeder.mainBreed).toBeDefined();
                expect(typeof breeder.favoriteCount).toBe('number');
                expect(typeof breeder.averageRating).toBe('number');
                expect(breeder.representativePhotos).toBeInstanceOf(Array);

                // 인기 브리더는 찜 또는 평점이 높은 순
                expect(breeder.favoriteCount).toBeGreaterThanOrEqual(0);
                expect(breeder.averageRating).toBeGreaterThanOrEqual(0);
            }
        });

        it('[성공] 공개 API - 인증 없이 접근 가능', async () => {
            const response = await request(app.getHttpServer()).get('/api/breeder/popular').expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    // ==================== 3. 브리더 프로필 상세 (GET /api/breeder/:id) ====================
    describe('GET /api/breeder/:id - 브리더 프로필 상세', () => {
        it('[성공] 브리더 프로필 상세 조회', async () => {
            const response = await request(app.getHttpServer()).get(`/api/breeder/${breederId}`).expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.code).toBe(200);
            expect(response.body.data).toBeDefined();

            const profile = response.body.data;
            expect(profile.breederId).toBe(breederId);
            expect(profile.breederName).toBeDefined();
            expect(profile.breederEmail).toBeDefined();
            expect(profile.profileInfo).toBeDefined();
            expect(profile.statsInfo).toBeDefined();
            expect(profile.verificationInfo).toBeDefined();

            // 프로필 상세 정보
            expect(profile.profileInfo.profileDescription).toBeDefined();
            expect(profile.profileInfo.locationInfo).toBeDefined();
            expect(profile.profileInfo.priceRangeInfo).toBeDefined();
            expect(profile.profileInfo.specializationAreas).toBeInstanceOf(Array);

            // 통계 정보
            expect(typeof profile.statsInfo.totalApplicationCount).toBe('number');
            expect(typeof profile.statsInfo.completedAdoptionCount).toBe('number');
            expect(typeof profile.statsInfo.averageRatingScore).toBe('number');
            expect(typeof profile.statsInfo.totalReviewCount).toBe('number');
            expect(typeof profile.statsInfo.profileViewCount).toBe('number');

            // 인증 정보
            expect(profile.verificationInfo.verificationStatus).toMatch(/^(pending|approved|rejected)$/);
        });

        it('[성공] 공개 API - 인증 없이 조회 가능', async () => {
            const response = await request(app.getHttpServer()).get(`/api/breeder/${breederId}`).expect(200);

            expect(response.body.success).toBe(true);
        });

        it('[실패] 존재하지 않는 브리더 ID', async () => {
            const invalidBreederId = '507f1f77bcf86cd799439099';
            const response = await request(app.getHttpServer()).get(`/api/breeder/${invalidBreederId}`).expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('브리더');
        });
    });

    // ==================== 4. 브리더 후기 목록 (GET /api/breeder/:id/reviews) ====================
    describe('GET /api/breeder/:id/reviews - 브리더 후기 목록', () => {
        it('[성공] 브리더 후기 목록 조회 - 기본 페이징', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/reviews`)
                .query({ page: 1, limit: 10 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.items).toBeInstanceOf(Array);
            expect(response.body.data.pagination).toBeDefined();
            expect(response.body.data.pagination.currentPage).toBe(1);
            expect(response.body.data.pagination.pageSize).toBeLessThanOrEqual(10);

            // 후기 정보 검증
            if (response.body.data.items.length > 0) {
                const review = response.body.data.items[0];
                expect(review.reviewId).toBeDefined();
                expect(review.adopterId).toBeDefined();
                expect(review.adopterName).toBeDefined();
                expect(typeof review.rating).toBe('number');
                expect(review.rating).toBeGreaterThanOrEqual(1);
                expect(review.rating).toBeLessThanOrEqual(5);
                expect(review.content).toBeDefined();
                expect(review.createdAt).toBeDefined();
            }
        });

        it('[성공] 페이지네이션 - 2페이지 조회', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/reviews`)
                .query({ page: 2, limit: 5 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.pagination.currentPage).toBe(2);
            expect(response.body.data.pagination.pageSize).toBeLessThanOrEqual(5);
        });

        it('[실패] 존재하지 않는 브리더 ID', async () => {
            const invalidBreederId = '507f1f77bcf86cd799439099';
            const response = await request(app.getHttpServer())
                .get(`/api/breeder/${invalidBreederId}/reviews`)
                .query({ page: 1, limit: 10 })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    // ==================== 5. 브리더 반려동물 목록 (GET /api/breeder/:id/pets) ====================
    describe('GET /api/breeder/:id/pets - 브리더 반려동물 목록', () => {
        it('[성공] 전체 반려동물 목록 조회', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/pets`)
                .query({ page: 1, limit: 20 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.items).toBeInstanceOf(Array);
            expect(response.body.data.pagination).toBeDefined();

            // 반려동물 정보 검증
            if (response.body.data.items.length > 0) {
                const pet = response.body.data.items[0];
                expect(pet.petId).toBeDefined();
                expect(pet.petName).toBeDefined();
                expect(pet.breed).toBeDefined();
                expect(pet.gender).toMatch(/^(male|female)$/);
                expect(pet.birthDate).toBeDefined();
                expect(typeof pet.price).toBe('number');
                expect(pet.status).toMatch(/^(available|reserved|adopted)$/);
                expect(pet.photos).toBeInstanceOf(Array);
            }
        });

        it('[성공] 상태 필터 - 분양 가능 (available)', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/pets`)
                .query({ status: 'available', page: 1, limit: 20 })
                .expect(200);

            expect(response.body.success).toBe(true);

            // 모든 반려동물이 available 상태인지 확인
            if (response.body.data.items.length > 0) {
                response.body.data.items.forEach((pet: any) => {
                    expect(pet.status).toBe('available');
                });
            }
        });

        it('[실패] 존재하지 않는 브리더 ID', async () => {
            const invalidBreederId = '507f1f77bcf86cd799439099';
            const response = await request(app.getHttpServer())
                .get(`/api/breeder/${invalidBreederId}/pets`)
                .query({ page: 1, limit: 20 })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    // ==================== 6. 반려동물 상세 정보 (GET /api/breeder/:id/pet/:petId) ====================
    describe('GET /api/breeder/:id/pet/:petId - 반려동물 상세 정보', () => {
        let testPetId: string;

        beforeAll(async () => {
            // 테스트용 반려동물 ID 조회
            const petsResponse = await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/pets`)
                .query({ page: 1, limit: 1 });

            if (petsResponse.body.data.items.length > 0) {
                testPetId = petsResponse.body.data.items[0].petId;
            }
        });

        it('[성공] 반려동물 상세 정보 조회', async () => {
            if (!testPetId) {
                console.log('테스트용 반려동물이 없어서 스킵합니다.');
                return;
            }

            const response = await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/pet/${testPetId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();

            const pet = response.body.data;
            expect(pet.petId).toBe(testPetId);
            expect(pet.petName).toBeDefined();
            expect(pet.breed).toBeDefined();
            expect(pet.gender).toMatch(/^(male|female)$/);
            expect(pet.birthDate).toBeDefined();
            expect(typeof pet.price).toBe('number');
            expect(pet.status).toMatch(/^(available|reserved|adopted)$/);
            expect(pet.description).toBeDefined();
            expect(pet.photos).toBeInstanceOf(Array);
            expect(pet.vaccinations).toBeInstanceOf(Array);
            expect(pet.healthRecords).toBeInstanceOf(Array);
            expect(pet.parentInfo).toBeDefined();
        });

        it('[실패] 존재하지 않는 반려동물 ID', async () => {
            const invalidPetId = '507f1f77bcf86cd799439099';
            const response = await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/pet/${invalidPetId}`)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('반려동물');
        });
    });

    // ==================== 7. 부모견/부모묘 목록 (GET /api/breeder/:id/parent-pets) ====================
    describe('GET /api/breeder/:id/parent-pets - 부모견/부모묘 목록', () => {
        it('[성공] 부모견/부모묘 목록 조회', async () => {
            const response = await request(app.getHttpServer()).get(`/api/breeder/${breederId}/parent-pets`).expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.parentPets).toBeInstanceOf(Array);

            // 부모견/부모묘 정보 검증
            if (response.body.data.parentPets.length > 0) {
                const parentPet = response.body.data.parentPets[0];
                expect(parentPet.parentPetId).toBeDefined();
                expect(parentPet.name).toBeDefined();
                expect(parentPet.breed).toBeDefined();
                expect(parentPet.gender).toMatch(/^(male|female)$/);
                expect(parentPet.age).toBeDefined();
                expect(parentPet.photos).toBeInstanceOf(Array);
                expect(parentPet.healthInfo).toBeDefined();
                expect(parentPet.pedigreeInfo).toBeDefined();
            }
        });

        it('[실패] 존재하지 않는 브리더 ID', async () => {
            const invalidBreederId = '507f1f77bcf86cd799439099';
            const response = await request(app.getHttpServer())
                .get(`/api/breeder/${invalidBreederId}/parent-pets`)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    // ==================== 8. 입양 신청 폼 구조 (GET /api/breeder/:id/application-form) ====================
    describe('GET /api/breeder/:id/application-form - 입양 신청 폼 구조', () => {
        it('[성공] 입양 신청 폼 구조 조회', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/application-form`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();

            const form = response.body.data;
            expect(form.breederId).toBe(breederId);
            expect(form.standardQuestions).toBeInstanceOf(Array);
            expect(form.customQuestions).toBeInstanceOf(Array);

            // 표준 질문 14개 확인
            expect(form.standardQuestions.length).toBe(14);
            form.standardQuestions.forEach((q: any) => {
                expect(q.questionId).toBeDefined();
                expect(q.questionText).toBeDefined();
                expect(q.questionType).toMatch(/^(text|textarea|boolean|number|date|select)$/);
                expect(typeof q.isRequired).toBe('boolean');
            });

            // 커스텀 질문 검증 (있는 경우)
            if (form.customQuestions.length > 0) {
                form.customQuestions.forEach((q: any) => {
                    expect(q.questionId).toBeDefined();
                    expect(q.questionText).toBeDefined();
                    expect(q.questionType).toBeDefined();
                    expect(typeof q.isRequired).toBe('boolean');
                });
            }
        });

        it('[성공] 표준 14개 질문 필드명 검증', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}/application-form`)
                .expect(200);

            const standardQuestions = response.body.data.standardQuestions;
            const expectedFieldNames = [
                'privacyConsent',
                'selfIntroduction',
                'familyMembers',
                'allFamilyConsent',
                'allergyTestInfo',
                'timeAwayFromHome',
                'livingSpaceDescription',
                'previousPetExperience',
                'canProvideBasicCare',
                'canAffordMedicalExpenses',
                'neuteringConsent',
                'preferredPetDescription',
                'desiredAdoptionTiming',
                'additionalNotes',
            ];

            const actualFieldNames = standardQuestions.map((q: any) => q.questionId);
            expectedFieldNames.forEach((fieldName) => {
                expect(actualFieldNames).toContain(fieldName);
            });
        });

        it('[실패] 존재하지 않는 브리더 ID', async () => {
            const invalidBreederId = '507f1f77bcf86cd799439099';
            const response = await request(app.getHttpServer())
                .get(`/api/breeder/${invalidBreederId}/application-form`)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('브리더');
        });
    });

    // ==================== 9. 레거시 브리더 검색 (GET /api/breeder/search) ====================
    describe('GET /api/breeder/search - 레거시 브리더 검색', () => {
        it('[성공] 기본 검색 (하위 호환성)', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder/search')
                .query({ page: 1, limit: 20 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.breeders).toBeInstanceOf(Array);
            expect(response.body.data.totalCount).toBeDefined();
            expect(typeof response.body.data.totalCount).toBe('number');

            // 브리더 정보 검증
            if (response.body.data.breeders.length > 0) {
                const breeder = response.body.data.breeders[0];
                expect(breeder.breederId).toBeDefined();
                expect(breeder.breederName).toBeDefined();
                expect(breeder.location).toBeDefined();
            }
        });

        it('[성공] 지역 필터 적용', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/breeder/search')
                .query({ location: '서울', page: 1, limit: 20 })
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    // ==================== 통합 시나리오 ====================
    describe('통합 시나리오 - 입양자의 브리더 탐색 프로세스', () => {
        it('[시나리오] 브리더 탐색 → 프로필 확인 → 반려동물 조회 → 후기 확인 → 신청 폼 확인', async () => {
            // Step 1: 브리더 탐색 (강아지, 소형견, 서울/경기)
            const exploreResponse = await request(app.getHttpServer())
                .post('/api/breeder/explore')
                .send({
                    petType: 'dog',
                    dogSize: ['small'],
                    province: ['서울특별시', '경기도'],
                    isAdoptionAvailable: true,
                    sortBy: 'favorite',
                    page: 1,
                    take: 10,
                })
                .expect(200);

            expect(exploreResponse.body.success).toBe(true);
            expect(exploreResponse.body.data.items.length).toBeGreaterThan(0);

            const targetBreederId = exploreResponse.body.data.items[0].breederId;

            // Step 2: 브리더 프로필 상세 조회
            const profileResponse = await request(app.getHttpServer())
                .get(`/api/breeder/${targetBreederId}`)
                .expect(200);

            expect(profileResponse.body.success).toBe(true);
            expect(profileResponse.body.data.breederId).toBe(targetBreederId);

            // Step 3: 브리더의 반려동물 목록 조회
            const petsResponse = await request(app.getHttpServer())
                .get(`/api/breeder/${targetBreederId}/pets`)
                .query({ status: 'available', page: 1, limit: 20 })
                .expect(200);

            expect(petsResponse.body.success).toBe(true);

            // Step 4: 특정 반려동물 상세 조회 (있는 경우)
            if (petsResponse.body.data.items.length > 0) {
                const targetPetId = petsResponse.body.data.items[0].petId;
                const petDetailResponse = await request(app.getHttpServer())
                    .get(`/api/breeder/${targetBreederId}/pet/${targetPetId}`)
                    .expect(200);

                expect(petDetailResponse.body.success).toBe(true);
                expect(petDetailResponse.body.data.petId).toBe(targetPetId);
            }

            // Step 5: 브리더 후기 확인
            const reviewsResponse = await request(app.getHttpServer())
                .get(`/api/breeder/${targetBreederId}/reviews`)
                .query({ page: 1, limit: 10 })
                .expect(200);

            expect(reviewsResponse.body.success).toBe(true);

            // Step 6: 부모견/부모묘 확인
            const parentPetsResponse = await request(app.getHttpServer())
                .get(`/api/breeder/${targetBreederId}/parent-pets`)
                .expect(200);

            expect(parentPetsResponse.body.success).toBe(true);

            // Step 7: 입양 신청 폼 구조 확인
            const formResponse = await request(app.getHttpServer())
                .get(`/api/breeder/${targetBreederId}/application-form`)
                .expect(200);

            expect(formResponse.body.success).toBe(true);
            expect(formResponse.body.data.standardQuestions.length).toBe(14);

            console.log('✅ 입양자의 브리더 탐색 프로세스 시나리오 완료');
        });
    });
});
