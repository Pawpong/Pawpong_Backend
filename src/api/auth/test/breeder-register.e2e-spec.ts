import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { AppModule } from '../../../app.module';

/**
 * 브리더 회원가입 End-to-End 테스트
 * 브리더 회원가입 관련 모든 시나리오를 테스트합니다.
 * - 성공적인 브리더 회원가입 처리
 * - 사업자 번호 유효성 검증
 * - 중복 사업자 번호 검증
 * - 브리더 전용 필드 검증
 */
describe('Breeder Registration API (e2e)', () => {
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
    });

    afterAll(async () => {
        await app.close();
        await mongod.stop();
    });

    describe('Successful Registration', () => {
        const validBreederData = {
            email: 'breeder@test.com',
            password: 'testpassword123',
            name: 'Test Breeder',
            phone: '010-9876-5432',
            businessNumber: '123-45-67890',
            businessName: 'Test Pet Farm',
        };

        it('POST /api/auth/register/breeder - 브리더 회원가입 성공', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send(validBreederData)
                .expect(201)
                .expect((res: any) => {
                    expect(res.body.access_token).toBeDefined();
                    expect(res.body.user.email).toBe(validBreederData.email);
                    expect(res.body.user.role).toBe('breeder');
                    expect(res.body.user.name).toBe(validBreederData.name);
                    expect(res.body.user.businessNumber).toBe(validBreederData.businessNumber);
                    expect(res.body.user.businessName).toBe(validBreederData.businessName);
                    expect(res.body.user.password).toBeUndefined(); // 비밀번호 응답에서 제외
                    expect(res.body.user.verification.status).toBe('pending'); // 초기 인증 상태
                });
        });
    });

    describe('Business Number Validation', () => {
        it('POST /api/auth/register/breeder - 유효하지 않은 사업자번호 형식', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send({
                    email: 'invalidbiz@test.com',
                    password: 'testpassword123',
                    name: 'Test Breeder',
                    phone: '010-9876-5432',
                    businessNumber: '123-invalid-format', // 잘못된 사업자번호 형식
                    businessName: 'Test Pet Farm',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('사업자번호 형식이 올바르지 않습니다');
                });
        });

        it('POST /api/auth/register/breeder - 중복 사업자번호', async () => {
            const duplicateBusinessData = {
                email: 'duplicate@test.com',
                password: 'testpassword123',
                name: 'Another Breeder',
                phone: '010-1111-1111',
                businessNumber: '123-45-67890', // 이미 등록된 사업자번호
                businessName: 'Another Pet Farm',
            };

            await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send(duplicateBusinessData)
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('이미 등록된 사업자번호입니다');
                });
        });
    });

    describe('Business Name Validation', () => {
        it('POST /api/auth/register/breeder - 사업장명 누락', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send({
                    email: 'nobizname@test.com',
                    password: 'testpassword123',
                    name: 'Test Breeder',
                    phone: '010-9876-5432',
                    businessNumber: '999-88-77766',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('사업장명은 필수 입력');
                });
        });

        it('POST /api/auth/register/breeder - 사업장명 길이 초과', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send({
                    email: 'longbizname@test.com',
                    password: 'testpassword123',
                    name: 'Test Breeder',
                    phone: '010-9876-5432',
                    businessNumber: '888-77-66655',
                    businessName: 'A'.repeat(101), // 100자 초과 사업장명
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('사업장명은 최대 100자까지');
                });
        });
    });

    describe('Required Fields Validation', () => {
        it('POST /api/auth/register/breeder - 사업자번호 누락', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send({
                    email: 'nobiznum@test.com',
                    password: 'testpassword123',
                    name: 'Test Breeder',
                    phone: '010-9876-5432',
                    businessName: 'Test Pet Farm',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('사업자번호는 필수 입력');
                });
        });
    });

    describe('Duplicate Email Validation', () => {
        it('POST /api/auth/register/breeder - 중복 이메일로 회원가입 실패', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send({
                    email: 'breeder@test.com', // 이미 등록된 이메일
                    password: 'newpassword123',
                    name: 'Another Breeder',
                    phone: '010-5555-5555',
                    businessNumber: '555-44-33322',
                    businessName: 'Another Pet Farm',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('이미 존재하는 이메일');
                });
        });
    });

    describe('Common Validation (Inherited from Base User)', () => {
        it('POST /api/auth/register/breeder - 유효하지 않은 이메일 형식', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send({
                    email: 'invalid-email-format',
                    password: 'testpassword123',
                    name: 'Test Breeder',
                    phone: '010-9876-5432',
                    businessNumber: '777-66-55544',
                    businessName: 'Test Pet Farm',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('이메일 형식이 올바르지 않습니다');
                });
        });

        it('POST /api/auth/register/breeder - 짧은 비밀번호', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send({
                    email: 'shortpw2@test.com',
                    password: '123', // 너무 짧은 비밀번호
                    name: 'Test Breeder',
                    phone: '010-9876-5432',
                    businessNumber: '666-55-44433',
                    businessName: 'Test Pet Farm',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('비밀번호는 최소 8자 이상');
                });
        });
    });

    describe('Business Registration Edge Cases', () => {
        it('POST /api/auth/register/breeder - 특수문자가 포함된 사업장명', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send({
                    email: 'specialbiz@test.com',
                    password: 'testpassword123',
                    name: 'Test Breeder',
                    phone: '010-9876-5432',
                    businessNumber: '444-33-22211',
                    businessName: 'Test@Pet#Farm$', // 특수문자 포함 사업장명
                })
                .expect(201) // 사업장명에는 특수문자 허용
                .expect((res: any) => {
                    expect(res.body.user.businessName).toBe('Test@Pet#Farm$');
                });
        });

        it('POST /api/auth/register/breeder - 한글 사업장명', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send({
                    email: 'koreanbiz@test.com',
                    password: 'testpassword123',
                    name: '테스트 브리더',
                    phone: '010-9876-5432',
                    businessNumber: '333-22-11100',
                    businessName: '테스트 반려동물 농장', // 한글 사업장명
                })
                .expect(201)
                .expect((res: any) => {
                    expect(res.body.user.businessName).toBe('테스트 반려동물 농장');
                    expect(res.body.user.name).toBe('테스트 브리더');
                });
        });
    });
});
