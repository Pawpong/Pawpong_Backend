import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestingApp } from './test-utils';

/**
 * 브리더 회원가입 E2E 테스트
 *
 * 테스트 범위:
 * 1. 브리더 회원가입 (일반 가입)
 * 2. 브리더 회원가입 (소셜 로그인)
 * 3. 회원가입 유효성 검증
 */
describe('Breeder Registration E2E Tests', () => {
    let app: INestApplication;
    const testEmail = `breeder-test-${Date.now()}@example.com`;
    const testPhone = '010-1234-5678';

    beforeAll(async () => {
        app = await createTestingApp();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /api/auth/register/breeder - 브리더 회원가입', () => {
        it('성공: 고양이 브리더 회원가입 (Elite 레벨)', async () => {
            const requestBody = {
                email: testEmail,
                phoneNumber: testPhone,
                breederName: '포포 캐터리',
                breederLocation: {
                    city: '서울특별시',
                    district: '강남구',
                },
                animal: 'cat',
                breeds: ['페르시안', '샴', '러시안블루'],
                plan: 'basic',
                level: 'elite',
                agreements: {
                    termsOfService: true,
                    privacyPolicy: true,
                    marketingConsent: false,
                },
            };

            const response = await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send(requestBody)
                .expect(200);

            // 응답 구조 검증
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('code', 200);
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('message', '브리더 회원가입이 완료되었습니다.');

            // 응답 데이터 검증
            const { data } = response.body;
            expect(data).toHaveProperty('breederId');
            expect(data).toHaveProperty('email', testEmail);
            expect(data).toHaveProperty('breederName', '포포 캐터리');
            expect(data).toHaveProperty('animal', 'cat');
            expect(data).toHaveProperty('breeds');
            expect(data.breeds).toEqual(['페르시안', '샴', '러시안블루']);
            expect(data).toHaveProperty('plan', 'basic');
            expect(data).toHaveProperty('level', 'elite');
            expect(data).toHaveProperty('accessToken');

            // JWT 토큰 형식 검증
            expect(data.accessToken).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
        });

        it('성공: 강아지 브리더 회원가입 (New 레벨)', async () => {
            const requestBody = {
                email: `dog-breeder-${Date.now()}@example.com`,
                phoneNumber: '010-9876-5432',
                breederName: '멍멍이 브리더',
                breederLocation: {
                    city: '경기도',
                    district: '성남시',
                },
                animal: 'dog',
                breeds: ['골든 리트리버', '래브라도'],
                plan: 'basic',
                level: 'new',
                agreements: {
                    termsOfService: true,
                    privacyPolicy: true,
                    marketingConsent: true,
                },
            };

            const response = await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send(requestBody)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.animal).toBe('dog');
            expect(response.body.data.level).toBe('new');
            expect(response.body.data.breeds).toEqual(['골든 리트리버', '래브라도']);
        });

        it('성공: Pro 플랜으로 회원가입', async () => {
            const requestBody = {
                email: `pro-breeder-${Date.now()}@example.com`,
                phoneNumber: '010-5555-6666',
                breederName: '프로 캐터리',
                breederLocation: {
                    city: '서울특별시',
                    district: '송파구',
                },
                animal: 'cat',
                breeds: ['메인쿤', '노르웨이숲'],
                plan: 'pro',
                level: 'elite',
                agreements: {
                    termsOfService: true,
                    privacyPolicy: true,
                    marketingConsent: false,
                },
            };

            const response = await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send(requestBody)
                .expect(200);

            expect(response.body.data.plan).toBe('pro');
        });

        it('성공: 소셜 로그인 (카카오) 브리더 회원가입', async () => {
            const tempId = `temp_kakao_123456_${Date.now()}`;
            const requestBody = {
                email: `kakao-breeder-${Date.now()}@example.com`,
                phoneNumber: '010-7777-8888',
                breederName: '카카오 캐터리',
                breederLocation: {
                    city: '부산광역시',
                    district: '해운대구',
                },
                animal: 'cat',
                breeds: ['브리티시 숏헤어'],
                plan: 'basic',
                level: 'new',
                agreements: {
                    termsOfService: true,
                    privacyPolicy: true,
                    marketingConsent: false,
                },
                tempId: tempId,
                provider: 'kakao',
                profileImage: 'https://example.com/profile.jpg',
            };

            const response = await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send(requestBody)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.breederId).toBeDefined();
        });
    });

    describe('POST /api/auth/register/breeder - 유효성 검증', () => {
        it('실패: 필수 약관 미동의 (termsOfService)', async () => {
            const requestBody = {
                email: `test-${Date.now()}@example.com`,
                phoneNumber: testPhone,
                breederName: '테스트 브리더',
                breederLocation: {
                    city: '서울특별시',
                    district: '강남구',
                },
                animal: 'cat',
                breeds: ['페르시안'],
                plan: 'basic',
                level: 'new',
                agreements: {
                    termsOfService: false, // 필수 약관 미동의
                    privacyPolicy: true,
                    marketingConsent: false,
                },
            };

            const response = await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send(requestBody)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('실패: 필수 약관 미동의 (privacyPolicy)', async () => {
            const requestBody = {
                email: `test-${Date.now()}@example.com`,
                phoneNumber: testPhone,
                breederName: '테스트 브리더',
                breederLocation: {
                    city: '서울특별시',
                    district: '강남구',
                },
                animal: 'cat',
                breeds: ['페르시안'],
                plan: 'basic',
                level: 'new',
                agreements: {
                    termsOfService: true,
                    privacyPolicy: false, // 필수 약관 미동의
                    marketingConsent: false,
                },
            };

            const response = await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send(requestBody)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('실패: 이메일 중복', async () => {
            const duplicateEmail = `duplicate-${Date.now()}@example.com`;

            // 첫 번째 회원가입
            await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send({
                    email: duplicateEmail,
                    phoneNumber: '010-1111-2222',
                    breederName: '첫 번째 브리더',
                    breederLocation: {
                        city: '서울특별시',
                        district: '강남구',
                    },
                    animal: 'cat',
                    breeds: ['페르시안'],
                    plan: 'basic',
                    level: 'new',
                    agreements: {
                        termsOfService: true,
                        privacyPolicy: true,
                        marketingConsent: false,
                    },
                })
                .expect(200);

            // 두 번째 회원가입 (같은 이메일)
            const response = await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send({
                    email: duplicateEmail, // 중복 이메일
                    phoneNumber: '010-3333-4444',
                    breederName: '두 번째 브리더',
                    breederLocation: {
                        city: '서울특별시',
                        district: '강남구',
                    },
                    animal: 'dog',
                    breeds: ['골든 리트리버'],
                    plan: 'basic',
                    level: 'new',
                    agreements: {
                        termsOfService: true,
                        privacyPolicy: true,
                        marketingConsent: false,
                    },
                })
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('이미 가입된 이메일');
        });

        it('실패: 잘못된 이메일 형식', async () => {
            const requestBody = {
                email: 'invalid-email', // 잘못된 이메일 형식
                phoneNumber: testPhone,
                breederName: '테스트 브리더',
                breederLocation: {
                    city: '서울특별시',
                    district: '강남구',
                },
                animal: 'cat',
                breeds: ['페르시안'],
                plan: 'basic',
                level: 'new',
                agreements: {
                    termsOfService: true,
                    privacyPolicy: true,
                    marketingConsent: false,
                },
            };

            await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send(requestBody)
                .expect(400);
        });

        it('실패: 품종 배열이 비어있음', async () => {
            const requestBody = {
                email: `test-${Date.now()}@example.com`,
                phoneNumber: testPhone,
                breederName: '테스트 브리더',
                breederLocation: {
                    city: '서울특별시',
                    district: '강남구',
                },
                animal: 'cat',
                breeds: [], // 빈 배열
                plan: 'basic',
                level: 'new',
                agreements: {
                    termsOfService: true,
                    privacyPolicy: true,
                    marketingConsent: false,
                },
            };

            await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send(requestBody)
                .expect(400);
        });

        it('실패: 품종이 6개 이상 (최대 5개)', async () => {
            const requestBody = {
                email: `test-${Date.now()}@example.com`,
                phoneNumber: testPhone,
                breederName: '테스트 브리더',
                breederLocation: {
                    city: '서울특별시',
                    district: '강남구',
                },
                animal: 'cat',
                breeds: ['페르시안', '샴', '러시안블루', '메인쿤', '노르웨이숲', '브리티시'], // 6개
                plan: 'basic',
                level: 'new',
                agreements: {
                    termsOfService: true,
                    privacyPolicy: true,
                    marketingConsent: false,
                },
            };

            await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send(requestBody)
                .expect(400);
        });

        it('실패: 잘못된 animal 값', async () => {
            const requestBody = {
                email: `test-${Date.now()}@example.com`,
                phoneNumber: testPhone,
                breederName: '테스트 브리더',
                breederLocation: {
                    city: '서울특별시',
                    district: '강남구',
                },
                animal: 'bird', // 잘못된 값 (cat 또는 dog만 허용)
                breeds: ['페르시안'],
                plan: 'basic',
                level: 'new',
                agreements: {
                    termsOfService: true,
                    privacyPolicy: true,
                    marketingConsent: false,
                },
            };

            await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send(requestBody)
                .expect(400);
        });

        it('실패: 잘못된 plan 값', async () => {
            const requestBody = {
                email: `test-${Date.now()}@example.com`,
                phoneNumber: testPhone,
                breederName: '테스트 브리더',
                breederLocation: {
                    city: '서울특별시',
                    district: '강남구',
                },
                animal: 'cat',
                breeds: ['페르시안'],
                plan: 'premium', // 잘못된 값 (basic 또는 pro만 허용)
                level: 'new',
                agreements: {
                    termsOfService: true,
                    privacyPolicy: true,
                    marketingConsent: false,
                },
            };

            await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send(requestBody)
                .expect(400);
        });

        it('실패: 잘못된 level 값', async () => {
            const requestBody = {
                email: `test-${Date.now()}@example.com`,
                phoneNumber: testPhone,
                breederName: '테스트 브리더',
                breederLocation: {
                    city: '서울특별시',
                    district: '강남구',
                },
                animal: 'cat',
                breeds: ['페르시안'],
                plan: 'basic',
                level: 'master', // 잘못된 값 (elite 또는 new만 허용)
                agreements: {
                    termsOfService: true,
                    privacyPolicy: true,
                    marketingConsent: false,
                },
            };

            await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send(requestBody)
                .expect(400);
        });
    });

    describe('POST /api/auth/register/breeder - 위치 정보', () => {
        it('성공: 시도 + 시군구 형식', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send({
                    email: `location-test-1-${Date.now()}@example.com`,
                    phoneNumber: testPhone,
                    breederName: '위치 테스트 1',
                    breederLocation: {
                        city: '서울특별시',
                        district: '강남구',
                    },
                    animal: 'cat',
                    breeds: ['페르시안'],
                    plan: 'basic',
                    level: 'new',
                    agreements: {
                        termsOfService: true,
                        privacyPolicy: true,
                        marketingConsent: false,
                    },
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('성공: 시도 + 시군구 상세 형식', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send({
                    email: `location-test-2-${Date.now()}@example.com`,
                    phoneNumber: testPhone,
                    breederName: '위치 테스트 2',
                    breederLocation: {
                        city: '경기도',
                        district: '성남시',
                    },
                    animal: 'cat',
                    breeds: ['페르시안'],
                    plan: 'basic',
                    level: 'new',
                    agreements: {
                        termsOfService: true,
                        privacyPolicy: true,
                        marketingConsent: false,
                    },
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });
});
