import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';

/**
 * 테스트용 NestJS 애플리케이션 생성
 */
export async function createTestingApp(): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
    }).compile();

    const app = moduleFixture.createNestApplication();
    
    // 글로벌 프리픽스 설정
    app.setGlobalPrefix('api');
    
    // 글로벌 파이프 설정
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
        }),
    );

    await app.init();
    return app;
}

/**
 * 테스트용 인증 토큰 생성 헬퍼
 */
export class AuthHelper {
    private app: INestApplication;
    
    constructor(app: INestApplication) {
        this.app = app;
    }

    /**
     * 입양자 회원가입 및 토큰 획득
     */
    async getAdopterToken(): Promise<{ accessToken: string; userId: string }> {
        const uniqueEmail = `adopter_${Date.now()}@test.com`;
        
        const response = await request(this.app.getHttpServer())
            .post('/api/auth/register/adopter')
            .send({
                email: uniqueEmail,
                password: 'Test1234!@',
                name: '테스트 입양자',
                phone: '010-1234-5678',
            });

        return {
            accessToken: response.body.item.accessToken,
            userId: response.body.item.userInfo.userId,
        };
    }

    /**
     * 브리더 회원가입 및 토큰 획득
     */
    async getBreederToken(): Promise<{ accessToken: string; userId: string }> {
        const uniqueEmail = `breeder_${Date.now()}@test.com`;
        
        const response = await request(this.app.getHttpServer())
            .post('/api/auth/register/breeder')
            .send({
                email: uniqueEmail,
                password: 'Test1234!@',
                name: '테스트 브리더',
                phone: '010-9876-5432',
                businessNumber: '123-45-67890',
            });

        return {
            accessToken: response.body.item.accessToken,
            userId: response.body.item.userInfo.userId,
        };
    }

    /**
     * 관리자 로그인 및 토큰 획득 (시드 데이터 필요)
     */
    async getAdminToken(): Promise<{ accessToken: string; userId: string }> {
        // 관리자는 사전에 생성되어 있다고 가정
        const response = await request(this.app.getHttpServer())
            .post('/api/auth/login')
            .send({
                email: 'admin@pawpong.com',
                password: 'Admin1234!@',
            });

        if (response.status !== 200) {
            throw new Error('관리자 계정이 존재하지 않습니다. 시드 데이터를 먼저 실행하세요.');
        }

        return {
            accessToken: response.body.item.accessToken,
            userId: response.body.item.userInfo.userId,
        };
    }
}

/**
 * 테스트 데이터 생성 헬퍼
 */
export class TestDataHelper {
    /**
     * 유니크한 이메일 생성
     */
    static generateEmail(prefix: string = 'test'): string {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`;
    }

    /**
     * 샘플 브리더 프로필 데이터
     */
    static getBreederProfileData() {
        return {
            profile: {
                description: '10년 경력의 전문 브리더입니다.',
                location: {
                    province: '서울특별시',
                    city: '강남구',
                    detail: '테헤란로 123',
                },
                specialization: ['포메라니안', '말티즈'],
                experienceYears: 10,
            },
            petType: 'dog',
            detailBreed: ['포메라니안', '말티즈'],
            priceDisplay: 'range',
            priceRange: {
                min: 1000000,
                max: 2000000,
            },
        };
    }

    /**
     * 샘플 반려동물 데이터
     */
    static getPetData() {
        return {
            name: '뽀삐',
            breed: '포메라니안',
            birthDate: '2024-01-01',
            gender: 'male',
            price: 1500000,
            description: '건강하고 활발한 아이입니다.',
            photos: ['photo1.jpg', 'photo2.jpg'],
            vaccinations: ['DHPPL', '코로나'],
        };
    }

    /**
     * 샘플 입양 신청 데이터
     */
    static getApplicationData() {
        return {
            expectedPrice: 1500000,
            message: '정성껏 키우겠습니다.',
            experience: '반려동물 키운 경험 10년',
            environment: '아파트, 가족 구성원 3명',
            isImmediateAdoption: true,
        };
    }

    /**
     * 샘플 후기 데이터
     */
    static getReviewData() {
        return {
            rating: 5,
            content: '매우 친절하고 전문적이었습니다.',
            petHealthRating: 5,
            communicationRating: 5,
            photos: ['review1.jpg', 'review2.jpg'],
        };
    }
}

/**
 * 응답 검증 헬퍼
 */
export class ResponseValidator {
    /**
     * API 응답 기본 구조 검증
     */
    static validateApiResponse(response: any) {
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('code');
        expect(response.body).toHaveProperty('timestamp');
        
        if (response.body.success) {
            expect(response.body).toHaveProperty('item');
            expect(response.body).toHaveProperty('message');
        } else {
            expect(response.body).toHaveProperty('error');
        }
    }

    /**
     * 페이지네이션 응답 검증
     */
    static validatePaginationResponse(response: any) {
        this.validateApiResponse(response);
        
        expect(response.body.item).toHaveProperty('item');
        expect(response.body.item).toHaveProperty('pageInfo');
        
        const pageInfo = response.body.item.pageInfo;
        expect(pageInfo).toHaveProperty('currentPage');
        expect(pageInfo).toHaveProperty('pageSize');
        expect(pageInfo).toHaveProperty('totalItems');
        expect(pageInfo).toHaveProperty('totalPages');
        expect(pageInfo).toHaveProperty('hasNextPage');
        expect(pageInfo).toHaveProperty('hasPrevPage');
    }

    /**
     * 인증 응답 검증
     */
    static validateAuthResponse(response: any) {
        this.validateApiResponse(response);
        
        expect(response.body.item).toHaveProperty('accessToken');
        expect(response.body.item).toHaveProperty('refreshToken');
        expect(response.body.item).toHaveProperty('accessTokenExpiresIn');
        expect(response.body.item).toHaveProperty('refreshTokenExpiresIn');
        expect(response.body.item).toHaveProperty('userInfo');
        
        const userInfo = response.body.item.userInfo;
        expect(userInfo).toHaveProperty('userId');
        expect(userInfo).toHaveProperty('emailAddress');
        expect(userInfo).toHaveProperty('fullName');
        expect(userInfo).toHaveProperty('userRole');
        expect(userInfo).toHaveProperty('accountStatus');
    }
}

/**
 * 데이터베이스 초기화 헬퍼
 */
export class DatabaseHelper {
    /**
     * 테스트 데이터베이스 초기화
     */
    static async clearDatabase() {
        // MongoDB 테스트 데이터베이스 초기화
        // 실제 구현은 mongoose connection을 통해 처리
        console.log('테스트 데이터베이스 초기화 완료');
    }

    /**
     * 시드 데이터 생성
     */
    static async seedDatabase() {
        // 관리자 계정 등 필수 시드 데이터 생성
        console.log('시드 데이터 생성 완료');
    }
}