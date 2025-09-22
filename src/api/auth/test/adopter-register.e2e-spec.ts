import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { AppModule } from '../../../app.module';

/**
 * 입양자 회원가입 End-to-End 테스트
 * 입양자 회원가입 관련 모든 시나리오를 테스트합니다.
 * - 성공적인 회원가입 처리
 * - 중복 이메일 검증
 * - 입력 값 유효성 검증
 * - 비밀번호 강도 검증
 */
describe('Adopter Registration API (e2e)', () => {
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
        const validAdopterData = {
            email: 'adopter@test.com',
            password: 'testpassword123',
            name: 'Test Adopter',
            phone: '010-1234-5678',
        };

        it('POST /api/auth/register/adopter - 입양자 회원가입 성공', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register/adopter')
                .send(validAdopterData)
                .expect(201)
                .expect((res: any) => {
                    expect(res.body.access_token).toBeDefined();
                    expect(res.body.user.email).toBe(validAdopterData.email);
                    expect(res.body.user.role).toBe('adopter');
                    expect(res.body.user.name).toBe(validAdopterData.name);
                    expect(res.body.user.phone).toBe(validAdopterData.phone);
                    expect(res.body.user.password).toBeUndefined(); // 비밀번호 응답에서 제외
                });
        });
    });

    describe('Duplicate Email Validation', () => {
        const duplicateEmailData = {
            email: 'adopter@test.com', // 이미 등록된 이메일
            password: 'newpassword123',
            name: 'Another Adopter',
            phone: '010-9999-9999',
        };

        it('POST /api/auth/register/adopter - 중복 이메일로 회원가입 실패', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register/adopter')
                .send(duplicateEmailData)
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('이미 존재하는 이메일');
                });
        });
    });

    describe('Input Validation', () => {
        it('POST /api/auth/register/adopter - 유효하지 않은 이메일 형식', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register/adopter')
                .send({
                    email: 'invalid-email-format',
                    password: 'validpassword123',
                    name: 'Test User',
                    phone: '010-1234-5678',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('이메일 형식이 올바르지 않습니다');
                });
        });

        it('POST /api/auth/register/adopter - 짧은 비밀번호', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register/adopter')
                .send({
                    email: 'shortpw@test.com',
                    password: '123', // 너무 짧은 비밀번호
                    name: 'Test User',
                    phone: '010-1234-5678',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('비밀번호는 최소 8자 이상');
                });
        });

        it('POST /api/auth/register/adopter - 빈 이름', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register/adopter')
                .send({
                    email: 'noname@test.com',
                    password: 'validpassword123',
                    name: '', // 빈 이름
                    phone: '010-1234-5678',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('이름은 필수 입력');
                });
        });

        it('POST /api/auth/register/adopter - 유효하지 않은 전화번호 형식', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register/adopter')
                .send({
                    email: 'invalidphone@test.com',
                    password: 'validpassword123',
                    name: 'Test User',
                    phone: '123-invalid-phone', // 잘못된 전화번호 형식
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('전화번호 형식이 올바르지 않습니다');
                });
        });
    });

    describe('Missing Required Fields', () => {
        it('POST /api/auth/register/adopter - 이메일 누락', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register/adopter')
                .send({
                    password: 'validpassword123',
                    name: 'Test User',
                    phone: '010-1234-5678',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('이메일은 필수 입력');
                });
        });

        it('POST /api/auth/register/adopter - 비밀번호 누락', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register/adopter')
                .send({
                    email: 'nopw@test.com',
                    name: 'Test User',
                    phone: '010-1234-5678',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('비밀번호는 필수 입력');
                });
        });

        it('POST /api/auth/register/adopter - 전화번호 누락', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register/adopter')
                .send({
                    email: 'nophone@test.com',
                    password: 'validpassword123',
                    name: 'Test User',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('전화번호는 필수 입력');
                });
        });
    });

    describe('Edge Cases', () => {
        it('POST /api/auth/register/adopter - 특수문자가 포함된 이름', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register/adopter')
                .send({
                    email: 'specialname@test.com',
                    password: 'validpassword123',
                    name: 'Test@User#123', // 특수문자 포함 이름
                    phone: '010-1234-5678',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('이름에는 특수문자를 사용할 수 없습니다');
                });
        });

        it('POST /api/auth/register/adopter - 매우 긴 이름', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register/adopter')
                .send({
                    email: 'longname@test.com',
                    password: 'validpassword123',
                    name: 'A'.repeat(101), // 100자 초과 이름
                    phone: '010-1234-5678',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('이름은 최대 50자까지');
                });
        });
    });
});
