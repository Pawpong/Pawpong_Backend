import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
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
            const registerData = {
                email: TestDataHelper.generateEmail('adopter'),
                password: 'Test1234!@',
                name: '테스트 입양자',
                phone: '010-1234-5678',
            };

            const response = await request(app.getHttpServer())
                .post('/api/auth/register/adopter')
                .send(registerData)
                .expect(200);

            ResponseValidator.validateAuthResponse(response);
            expect(response.body.item.userInfo.userRole).toBe('adopter');
            expect(response.body.message).toBe('입양자 회원가입이 완료되었습니다.');
        });

        it('중복 이메일로 회원가입 실패', async () => {
            const email = TestDataHelper.generateEmail('duplicate');
            const registerData = {
                email,
                password: 'Test1234!@',
                name: '테스트 입양자',
                phone: '010-1234-5678',
            };

            // 첫 번째 회원가입
            await request(app.getHttpServer())
                .post('/api/auth/register/adopter')
                .send(registerData)
                .expect(200);

            // 중복 회원가입 시도
            const response = await request(app.getHttpServer())
                .post('/api/auth/register/adopter')
                .send(registerData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('이미 사용중인 이메일');
        });

        it('유효하지 않은 이메일 형식으로 회원가입 실패', async () => {
            const registerData = {
                email: 'invalid-email',
                password: 'Test1234!@',
                name: '테스트 입양자',
                phone: '010-1234-5678',
            };

            const response = await request(app.getHttpServer())
                .post('/api/auth/register/adopter')
                .send(registerData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('약한 비밀번호로 회원가입 실패', async () => {
            const registerData = {
                email: TestDataHelper.generateEmail('weak'),
                password: '1234',
                name: '테스트 입양자',
                phone: '010-1234-5678',
            };

            const response = await request(app.getHttpServer())
                .post('/api/auth/register/adopter')
                .send(registerData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('필수 필드 누락으로 회원가입 실패', async () => {
            const registerData = {
                email: TestDataHelper.generateEmail('missing'),
                password: 'Test1234!@',
                // name 누락
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
                password: 'Test1234!@',
                name: '테스트 브리더',
                phone: '010-9876-5432',
                businessNumber: '123-45-67890',
            };

            const response = await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send(registerData)
                .expect(200);

            ResponseValidator.validateAuthResponse(response);
            expect(response.body.item.userInfo.userRole).toBe('breeder');
            expect(response.body.message).toBe('브리더 회원가입이 완료되었습니다.');
        });

        it('사업자번호 없이 브리더 회원가입 성공', async () => {
            const registerData = {
                email: TestDataHelper.generateEmail('breeder-no-business'),
                password: 'Test1234!@',
                name: '개인 브리더',
                phone: '010-9876-5432',
            };

            const response = await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send(registerData)
                .expect(200);

            ResponseValidator.validateAuthResponse(response);
            expect(response.body.item.userInfo.userRole).toBe('breeder');
        });

        it('중복 사업자번호로 회원가입 실패', async () => {
            const businessNumber = '999-88-77777';
            
            // 첫 번째 브리더 등록
            await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send({
                    email: TestDataHelper.generateEmail('breeder1'),
                    password: 'Test1234!@',
                    name: '브리더1',
                    phone: '010-1111-1111',
                    businessNumber,
                })
                .expect(200);

            // 동일한 사업자번호로 두 번째 브리더 등록 시도
            const response = await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send({
                    email: TestDataHelper.generateEmail('breeder2'),
                    password: 'Test1234!@',
                    name: '브리더2',
                    phone: '010-2222-2222',
                    businessNumber,
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('사업자번호');
        });
    });

    describe('POST /api/auth/login', () => {
        let testEmail: string;
        let testPassword: string;

        beforeAll(async () => {
            // 로그인 테스트용 계정 생성
            testEmail = TestDataHelper.generateEmail('login-test');
            testPassword = 'Test1234!@';

            await request(app.getHttpServer())
                .post('/api/auth/register/adopter')
                .send({
                    email: testEmail,
                    password: testPassword,
                    name: '로그인 테스트',
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
            const loginResponse = await request(app.getHttpServer())
                .post('/api/auth/register/adopter')
                .send({
                    email: TestDataHelper.generateEmail('refresh-test'),
                    password: 'Test1234!@',
                    name: '토큰 테스트',
                    phone: '010-1111-1111',
                })
                .expect(200);

            refreshToken = loginResponse.body.item.refreshToken;
        });

        it('유효한 refresh 토큰으로 토큰 재발급 성공', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/refresh')
                .send({
                    refreshToken,
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.item).toHaveProperty('accessToken');
            expect(response.body.item).toHaveProperty('refreshToken');
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