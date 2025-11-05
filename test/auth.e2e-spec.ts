import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestingApp, AuthHelper, TestDataHelper, ResponseValidator } from './test-utils';

describe('Auth API E2E Tests', () => {
    let app: INestApplication;
    let authHelper: AuthHelper;

    beforeAll(async () => {
        app = await createTestingApp();
        authHelper = new AuthHelper(app);
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /api/auth/register/adopter', () => {
        it('입양자 회원가입 성공', async () => {
            const timestamp = Date.now();
            const providerId = Math.random().toString().substr(2, 10);
            const registerData = {
                tempId: `temp_kakao_${providerId}_${timestamp}`,
                email: TestDataHelper.generateEmail('adopter'),
                nickname: `테스트입양자${timestamp}`,
                phone: '010-1234-5678',
            };

            const response = await request(app.getHttpServer())
                .post('/api/auth/register/adopter')
                .send(registerData)
                .expect(200);

            ResponseValidator.validateAuthResponse(response);
            expect(response.body.data.userRole).toBe('adopter');
            expect(response.body.message).toBe('입양자 회원가입이 완료되었습니다.');
        });

        it('중복 이메일로 회원가입 실패', async () => {
            const email = TestDataHelper.generateEmail('duplicate');
            const timestamp = Date.now();
            const providerId = Math.random().toString().substr(2, 10);
            const registerData = {
                tempId: `temp_kakao_${providerId}_${timestamp}`,
                email,
                nickname: `테스트입양자${timestamp}`,
                phone: '010-1234-5678',
            };

            // 첫 번째 회원가입
            await request(app.getHttpServer())
                .post('/api/auth/register/adopter')
                .send(registerData)
                .expect(200);

            // 중복 회원가입 시도
            const timestamp2 = Date.now();
            const providerId2 = Math.random().toString().substr(2, 10);
            const response = await request(app.getHttpServer())
                .post('/api/auth/register/adopter')
                .send({ ...registerData, tempId: `temp_kakao_${providerId2}_${timestamp2}`, nickname: `테스트입양자${timestamp2}` })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('이미 사용중인 이메일');
        });

        it('유효하지 않은 이메일 형식으로 회원가입 실패', async () => {
            const timestamp = Date.now();
            const providerId = Math.random().toString().substr(2, 10);
            const registerData = {
                tempId: `temp_kakao_${providerId}_${timestamp}`,
                email: 'invalid-email',
                nickname: `테스트입양자${timestamp}`,
                phone: '010-1234-5678',
            };

            const response = await request(app.getHttpServer())
                .post('/api/auth/register/adopter')
                .send(registerData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('필수 필드 누락으로 회원가입 실패 - tempId', async () => {
            const registerData = {
                email: TestDataHelper.generateEmail('missing'),
                nickname: '테스트 입양자',
                phone: '010-1234-5678',
            };

            const response = await request(app.getHttpServer())
                .post('/api/auth/register/adopter')
                .send(registerData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('필수 필드 누락으로 회원가입 실패 - nickname', async () => {
            const timestamp = Date.now();
            const providerId = Math.random().toString().substr(2, 10);
            const registerData = {
                tempId: `temp_kakao_${providerId}_${timestamp}`,
                email: TestDataHelper.generateEmail('missing'),
                phone: '010-1234-5678',
            };

            const response = await request(app.getHttpServer())
                .post('/api/auth/register/adopter')
                .send(registerData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/register/breeder', () => {
        it('브리더 회원가입 성공', async () => {
            const registerData = {
                email: TestDataHelper.generateEmail('breeder'),
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
            };

            const response = await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send(registerData)
                .expect(200);

            ResponseValidator.validateAuthResponse(response);
            expect(response.body.data.userRole).toBe('breeder');
            expect(response.body.message).toBe('브리더 회원가입이 완료되었습니다.');
        });

        it('프로 플랜으로 브리더 회원가입 성공', async () => {
            const registerData = {
                email: TestDataHelper.generateEmail('breeder-pro'),
                phoneNumber: '010-9876-5432',
                breederName: '프로 브리더',
                breederLocation: {
                    city: '경기도',
                    district: '성남시',
                },
                animal: 'cat',
                breeds: ['페르시안', '샴'],
                plan: 'pro',
                level: 'elite',
                agreements: {
                    termsOfService: true,
                    privacyPolicy: true,
                    marketingConsent: true,
                },
            };

            const response = await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send(registerData)
                .expect(200);

            ResponseValidator.validateAuthResponse(response);
            expect(response.body.data.userRole).toBe('breeder');
        });

        it('필수 필드 누락으로 회원가입 실패 - agreements', async () => {
            const registerData = {
                email: TestDataHelper.generateEmail('breeder-missing'),
                phoneNumber: '010-1111-1111',
                breederName: '브리더',
                breederLocation: {
                    city: '서울특별시',
                    district: '강남구',
                },
                animal: 'dog',
                breeds: ['포메라니안'],
                plan: 'basic',
                level: 'new',
                // agreements 누락
            };

            const response = await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send(registerData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/login', () => {
        let testEmail: string;
        let testPassword: string;

        beforeAll(async () => {
            // 로그인 테스트용 계정 생성
            testEmail = TestDataHelper.generateEmail('login-test');
            testPassword = 'Test1234!@';
            const timestamp = Date.now();
            const providerId = Math.random().toString().substr(2, 10);

            await request(app.getHttpServer())
                .post('/api/auth/register/adopter')
                .send({
                    tempId: `temp_kakao_${providerId}_${timestamp}`,
                    email: testEmail,
                    nickname: `로그인테스트${timestamp}`,
                    phone: '010-0000-0000',
                })
                .expect(200);
        });

        it('올바른 자격증명으로 로그인 성공', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: testEmail,
                    password: testPassword,
                })
                .expect(200);

            ResponseValidator.validateAuthResponse(response);
            expect(response.body.message).toBe('로그인이 완료되었습니다.');
        });

        it('잘못된 이메일로 로그인 실패', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: 'wrong@email.com',
                    password: testPassword,
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('이메일 또는 비밀번호');
        });

        it('잘못된 비밀번호로 로그인 실패', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: testEmail,
                    password: 'WrongPassword123!',
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('이메일 또는 비밀번호');
        });

        it('이메일 형식 오류로 로그인 실패', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: 'not-an-email',
                    password: testPassword,
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/refresh', () => {
        let refreshToken: string;

        beforeAll(async () => {
            // 토큰 재발급 테스트용 토큰 획득
            const timestamp = Date.now();
            const providerId = Math.random().toString().substr(2, 10);
            const loginResponse = await request(app.getHttpServer())
                .post('/api/auth/register/adopter')
                .send({
                    tempId: `temp_kakao_${providerId}_${timestamp}`,
                    email: TestDataHelper.generateEmail('refresh-test'),
                    nickname: `토큰테스트${timestamp}`,
                    phone: '010-1111-1111',
                })
                .expect(200);

            refreshToken = loginResponse.body.data.refreshToken;
        });

        it('유효한 refresh 토큰으로 토큰 재발급 성공', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/refresh')
                .send({
                    refreshToken,
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('accessToken');
            expect(response.body.data).toHaveProperty('refreshToken');
            expect(response.body.message).toBe('토큰이 재발급되었습니다.');
        });

        it('유효하지 않은 refresh 토큰으로 재발급 실패', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/refresh')
                .send({
                    refreshToken: 'invalid-refresh-token',
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('유효하지 않은 토큰');
        });

        it('만료된 refresh 토큰으로 재발급 실패', async () => {
            // 만료된 토큰 시뮬레이션 (실제로는 시간이 지나야 함)
            const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.invalid';
            
            const response = await request(app.getHttpServer())
                .post('/api/auth/refresh')
                .send({
                    refreshToken: expiredToken,
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/logout', () => {
        let accessToken: string;

        beforeAll(async () => {
            const authData = await authHelper.getAdopterToken();
            accessToken = authData.accessToken;
        });

        it('유효한 토큰으로 로그아웃 성공', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('로그아웃되었습니다.');
        });

        it('토큰 없이 로그아웃 시도시 실패', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/logout')
                .expect(401);
        });

        it('유효하지 않은 토큰으로 로그아웃 시도시 실패', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/logout')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });
    });
});