import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { AppModule } from '../../../app.module';

/**
 * 로그인 End-to-End 테스트
 * 사용자 로그인 관련 모든 시나리오를 테스트합니다.
 * - 입양자/브리더 공통 로그인 처리
 * - JWT 토큰 발급 및 검증
 * - 로그인 실패 시나리오들
 * - 보안 관련 테스트
 */
describe('Login API (e2e)', () => {
    let app: INestApplication;
    let mongod: MongoMemoryServer;

    beforeAll(async () => {
        // 메모리 내 MongoDB 서버 시작
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [MongooseModule.forRoot(uri), AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // 테스트용 사용자 생성
        const adopterData = {
            email: 'adopter@login.test',
            password: 'testpassword123',
            name: 'Test Adopter',
            phone: '010-1234-5678',
        };

        const breederData = {
            email: 'breeder@login.test',
            password: 'testpassword123',
            name: 'Test Breeder',
            phone: '010-9876-5432',
            businessNumber: '123-45-67890',
            businessName: 'Test Pet Farm',
        };

        // 입양자 등록
        await request(app.getHttpServer()).post('/api/auth/register/adopter').send(adopterData);

        // 브리더 등록
        await request(app.getHttpServer()).post('/api/auth/register/breeder').send(breederData);
    });

    afterAll(async () => {
        await app.close();
        await mongod.stop();
    });

    describe('Successful Login', () => {
        it('POST /api/auth/login - 입양자 로그인 성공', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: 'adopter@login.test',
                    password: 'testpassword123',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.access_token).toBeDefined();
                    expect(res.body.item.user.email).toBe('adopter@login.test');
                    expect(res.body.item.user.role).toBe('adopter');
                    expect(res.body.item.user.password).toBeUndefined(); // 비밀번호 응답에서 제외
                    expect(res.body.message).toBe('로그인이 완료되었습니다');
                });
        });

        it('POST /api/auth/login - 브리더 로그인 성공', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: 'breeder@login.test',
                    password: 'testpassword123',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.access_token).toBeDefined();
                    expect(res.body.item.user.email).toBe('breeder@login.test');
                    expect(res.body.item.user.role).toBe('breeder');
                    expect(res.body.item.user.businessNumber).toBeDefined();
                    expect(res.body.item.user.password).toBeUndefined(); // 비밀번호 응답에서 제외
                });
        });
    });

    describe('Login Failure Scenarios', () => {
        it('POST /api/auth/login - 존재하지 않는 사용자', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@test.com',
                    password: 'somepassword123',
                })
                .expect(404)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('사용자를 찾을 수 없습니다');
                });
        });

        it('POST /api/auth/login - 잘못된 비밀번호', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: 'adopter@login.test',
                    password: 'wrongpassword123',
                })
                .expect(401)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('비밀번호가 올바르지 않습니다');
                });
        });

        it('POST /api/auth/login - 이메일 누락', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    password: 'testpassword123',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('이메일은 필수 입력');
                });
        });

        it('POST /api/auth/login - 비밀번호 누락', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: 'adopter@login.test',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('비밀번호는 필수 입력');
                });
        });
    });

    describe('Input Validation', () => {
        it('POST /api/auth/login - 유효하지 않은 이메일 형식', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: 'invalid-email-format',
                    password: 'testpassword123',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('이메일 형식이 올바르지 않습니다');
                });
        });

        it('POST /api/auth/login - 빈 문자열 이메일', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: '',
                    password: 'testpassword123',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('이메일은 필수 입력');
                });
        });

        it('POST /api/auth/login - 빈 문자열 비밀번호', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: 'adopter@login.test',
                    password: '',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('비밀번호는 필수 입력');
                });
        });
    });

    describe('JWT Token Validation', () => {
        let validToken: string;

        beforeAll(async () => {
            const loginResponse = await request(app.getHttpServer()).post('/api/auth/login').send({
                email: 'adopter@login.test',
                password: 'testpassword123',
            });
            validToken = loginResponse.body.item.access_token;
        });

        it('발급된 JWT 토큰이 유효한 형식인지 검증', () => {
            // JWT는 세 부분이 점(.)으로 구분된 형태
            const tokenParts = validToken.split('.');
            expect(tokenParts).toHaveLength(3);
            expect(tokenParts[0]).toBeTruthy(); // Header
            expect(tokenParts[1]).toBeTruthy(); // Payload
            expect(tokenParts[2]).toBeTruthy(); // Signature
        });

        it('JWT 토큰 페이로드에 사용자 정보가 포함되어 있는지 검증', () => {
            const payload = JSON.parse(Buffer.from(validToken.split('.')[1], 'base64').toString());
            expect(payload.sub).toBeDefined(); // 사용자 ID
            expect(payload.email).toBe('adopter@login.test');
            expect(payload.role).toBe('adopter');
            expect(payload.iat).toBeDefined(); // 발급 시간
            expect(payload.exp).toBeDefined(); // 만료 시간
        });
    });

    describe('Security Tests', () => {
        it('POST /api/auth/login - SQL Injection 시도 차단', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: "admin'; DROP TABLE users; --",
                    password: 'testpassword123',
                })
                .expect(400) // 유효하지 않은 이메일 형식으로 차단
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                });
        });

        it('POST /api/auth/login - NoSQL Injection 시도 차단', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: 'adopter@login.test',
                    password: { $ne: null }, // NoSQL injection 시도
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                    expect(res.body.error).toContain('비밀번호 형식이 올바르지 않습니다');
                });
        });

        it('POST /api/auth/login - 과도한 요청 데이터 크기 제한', async () => {
            const largeString = 'A'.repeat(10000); // 10KB 문자열
            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: largeString + '@test.com',
                    password: 'testpassword123',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.success).toBe(false);
                });
        });
    });

    describe('Case Sensitivity Tests', () => {
        it('POST /api/auth/login - 이메일 대소문자 구분 없이 로그인', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: 'ADOPTER@LOGIN.TEST', // 대문자로 입력
                    password: 'testpassword123',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.user.email).toBe('adopter@login.test'); // 소문자로 저장됨
                });
        });
    });

    describe('Login Response Structure', () => {
        it('POST /api/auth/login - 응답 구조가 API 표준을 따르는지 검증', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: 'adopter@login.test',
                    password: 'testpassword123',
                })
                .expect(200)
                .expect((res: any) => {
                    // API 응답 표준 구조 검증
                    expect(res.body.success).toBeDefined();
                    expect(res.body.code).toBe(200);
                    expect(res.body.item).toBeDefined();
                    expect(res.body.message).toBeDefined();
                    expect(res.body.timestamp).toBeDefined();

                    // 로그인 전용 응답 구조 검증
                    expect(res.body.item.access_token).toBeDefined();
                    expect(res.body.item.user).toBeDefined();
                    expect(res.body.item.user.id).toBeDefined();
                    expect(res.body.item.user.email).toBeDefined();
                    expect(res.body.item.user.role).toBeDefined();
                });
        });
    });
});
