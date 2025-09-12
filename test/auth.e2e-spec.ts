import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppModule } from '../src/app.module';

/**
 * Auth API End-to-End 테스트
 * 사용자 인증 관련 모든 API 엔드포인트를 테스트합니다.
 * - 입양자 회원가입 및 로그인
 * - 브리더 회원가입 및 로그인
 * - JWT 토큰 검증
 */
describe('Auth API (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    // 메모리 내 MongoDB 서버 시작
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(uri), AppModule],
    })
      .overrideModule(AppModule)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  describe('Adopter Registration & Login', () => {
    const adopterData = {
      email: 'adopter@test.com',
      password: 'testpassword123',
      name: 'Test Adopter',
      phone: '010-1234-5678',
    };

    it('POST /api/auth/register/adopter - 입양자 회원가입 성공', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register/adopter')
        .send(adopterData)
        .expect(201)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
          expect(res.body.user.email).toBe(adopterData.email);
          expect(res.body.user.role).toBe('adopter');
        });
    });

    it('POST /api/auth/register/adopter - 중복 이메일로 회원가입 실패', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register/adopter')
        .send(adopterData)
        .expect(400);
    });

    it('POST /api/auth/login - 입양자 로그인 성공', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: adopterData.email,
          password: adopterData.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
          expect(res.body.user.role).toBe('adopter');
        });
    });

    it('POST /api/auth/login - 잘못된 비밀번호로 로그인 실패', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: adopterData.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('Breeder Registration & Login', () => {
    const breederData = {
      email: 'breeder@test.com',
      password: 'testpassword123',
      name: 'Test Breeder',
      phone: '010-9876-5432',
      businessNumber: '123-45-67890',
      businessName: 'Test Pet Farm',
    };

    it('POST /api/auth/register/breeder - 브리더 회원가입 성공', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register/breeder')
        .send(breederData)
        .expect(201)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
          expect(res.body.user.email).toBe(breederData.email);
          expect(res.body.user.role).toBe('breeder');
        });
    });

    it('POST /api/auth/login - 브리더 로그인 성공', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: breederData.email,
          password: breederData.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
          expect(res.body.user.role).toBe('breeder');
        });
    });
  });

  describe('Invalid Input Validation', () => {
    it('POST /api/auth/register/adopter - 유효하지 않은 이메일', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register/adopter')
        .send({
          email: 'invalid-email',
          password: 'test123',
          name: 'Test',
          phone: '010-1234-5678',
        })
        .expect(400);
    });

    it('POST /api/auth/register/adopter - 짧은 비밀번호', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register/adopter')
        .send({
          email: 'test2@test.com',
          password: '123',
          name: 'Test',
          phone: '010-1234-5678',
        })
        .expect(400);
    });

    it('POST /api/auth/login - 존재하지 않는 사용자', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123',
        })
        .expect(404);
    });
  });
});
