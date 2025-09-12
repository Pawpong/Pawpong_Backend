import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppModule } from '../src/app.module';

/**
 * Breeder API End-to-End 테스트
 * 브리더 관련 모든 API 엔드포인트를 테스트합니다.
 * - 브리더 검색 및 필터링
 * - 브리더 프로필 조회
 * - 브리더 관리 기능 (인증된 브리더만)
 */
describe('Breeder API (e2e)', () => {
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
    })
      .overrideModule(AppModule)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // 테스트용 입양자 생성
    const adopterResponse = await request(app.getHttpServer())
      .post('/api/auth/register/adopter')
      .send({
        email: 'adopter@test.com',
        password: 'testpassword123',
        name: 'Test Adopter',
        phone: '010-1234-5678',
      });
    adopterToken = adopterResponse.body.access_token;

    // 테스트용 브리더 생성
    const breederResponse = await request(app.getHttpServer())
      .post('/api/auth/register/breeder')
      .send({
        email: 'breeder@test.com',
        password: 'testpassword123',
        name: 'Test Breeder',
        phone: '010-9876-5432',
        businessNumber: '123-45-67890',
        businessName: 'Test Pet Farm',
      });
    breederToken = breederResponse.body.access_token;
    breederId = breederResponse.body.user.id;
  });

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  describe('Breeder Search & Filtering', () => {
    it('GET /api/breeder/search - 기본 검색 성공', () => {
      return request(app.getHttpServer())
        .get('/api/breeder/search')
        .set('Authorization', `Bearer ${adopterToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.breeders)).toBe(true);
          expect(res.body.pagination).toBeDefined();
        });
    });

    it('GET /api/breeder/search - 위치 필터링', () => {
      return request(app.getHttpServer())
        .get('/api/breeder/search')
        .query({
          location: 'seoul',
          page: 1,
          limit: 10,
        })
        .set('Authorization', `Bearer ${adopterToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.breeders).toBeDefined();
          expect(res.body.pagination.page).toBe(1);
        });
    });

    it('GET /api/breeder/search - 품종 필터링', () => {
      return request(app.getHttpServer())
        .get('/api/breeder/search')
        .query({
          breed: 'golden_retriever',
          verified: 'true',
        })
        .set('Authorization', `Bearer ${adopterToken}`)
        .expect(200);
    });

    it('GET /api/breeder/search - 가격대 필터링', () => {
      return request(app.getHttpServer())
        .get('/api/breeder/search')
        .query({
          minPrice: '500000',
          maxPrice: '1500000',
        })
        .set('Authorization', `Bearer ${adopterToken}`)
        .expect(200);
    });

    it('GET /api/breeder/search - 정렬 옵션', () => {
      return request(app.getHttpServer())
        .get('/api/breeder/search')
        .query({
          sortBy: 'rating',
          sortOrder: 'desc',
        })
        .set('Authorization', `Bearer ${adopterToken}`)
        .expect(200);
    });

    it('GET /api/breeder/search - 인증되지 않은 요청 실패', () => {
      return request(app.getHttpServer())
        .get('/api/breeder/search')
        .expect(401);
    });
  });

  describe('Breeder Profile', () => {
    it('GET /api/breeder/:id - 브리더 프로필 조회 성공', () => {
      return request(app.getHttpServer())
        .get(`/api/breeder/${breederId}`)
        .set('Authorization', `Bearer ${adopterToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(breederId);
          expect(res.body.name).toBe('Test Breeder');
          expect(res.body.verification).toBeDefined();
          expect(res.body.profile).toBeDefined();
        });
    });

    it('GET /api/breeder/:id - 존재하지 않는 브리더', () => {
      return request(app.getHttpServer())
        .get('/api/breeder/nonexistent-id')
        .set('Authorization', `Bearer ${adopterToken}`)
        .expect(404);
    });

    it('GET /api/breeder/:id/reviews - 브리더 후기 조회', () => {
      return request(app.getHttpServer())
        .get(`/api/breeder/${breederId}/reviews`)
        .set('Authorization', `Bearer ${adopterToken}`)
        .query({
          page: 1,
          limit: 10,
        })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.reviews)).toBe(true);
          expect(res.body.pagination).toBeDefined();
        });
    });

    it('GET /api/breeder/:id/pets - 브리더 반려동물 목록 조회', () => {
      return request(app.getHttpServer())
        .get(`/api/breeder/${breederId}/pets`)
        .set('Authorization', `Bearer ${adopterToken}`)
        .query({
          available: 'true',
        })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.pets)).toBe(true);
        });
    });
  });

  describe('Breeder Statistics', () => {
    it('GET /api/breeder/:id/stats - 브리더 통계 조회', () => {
      return request(app.getHttpServer())
        .get(`/api/breeder/${breederId}/stats`)
        .set('Authorization', `Bearer ${adopterToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.totalReviews).toBeDefined();
          expect(res.body.averageRating).toBeDefined();
          expect(res.body.totalAdoptions).toBeDefined();
        });
    });

    it('GET /api/breeder/popular - 인기 브리더 목록', () => {
      return request(app.getHttpServer())
        .get('/api/breeder/popular')
        .query({
          limit: 5,
          timeframe: 'week',
        })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.breeders)).toBe(true);
        });
    });
  });

  describe('Public Access Tests', () => {
    // 일부 API는 인증 없이도 접근 가능해야 함 (브리더 검색 등)
    it('GET /api/breeder/search - 공개 검색 (인증 없음)', () => {
      return request(app.getHttpServer())
        .get('/api/breeder/search')
        .query({
          location: 'seoul',
          verified: 'true',
        })
        .expect((res) => {
          // 인증이 필요한 경우 401, 공개인 경우 200
          expect([200, 401]).toContain(res.status);
        });
    });
  });

  describe('Input Validation', () => {
    it('GET /api/breeder/search - 잘못된 페이지 번호', () => {
      return request(app.getHttpServer())
        .get('/api/breeder/search')
        .query({
          page: -1,
          limit: 10,
        })
        .set('Authorization', `Bearer ${adopterToken}`)
        .expect(400);
    });

    it('GET /api/breeder/search - 잘못된 정렬 옵션', () => {
      return request(app.getHttpServer())
        .get('/api/breeder/search')
        .query({
          sortBy: 'invalid_field',
          sortOrder: 'desc',
        })
        .set('Authorization', `Bearer ${adopterToken}`)
        .expect(400);
    });

    it('GET /api/breeder/search - 잘못된 가격 범위', () => {
      return request(app.getHttpServer())
        .get('/api/breeder/search')
        .query({
          minPrice: '1000000',
          maxPrice: '500000', // min > max
        })
        .set('Authorization', `Bearer ${adopterToken}`)
        .expect(400);
    });
  });
});
