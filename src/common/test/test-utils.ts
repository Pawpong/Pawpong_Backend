import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ObjectId } from 'mongodb';

import { AppModule } from '../../app.module';

/**
 * E2E 테스트용 NestJS 애플리케이션 생성
 *
 * @description
 * 모든 E2E 테스트에서 사용하는 통일된 테스트 앱 생성 함수입니다.
 * - 글로벌 프리픽스: /api
 * - 글로벌 파이프: ValidationPipe (transform, whitelist 활성화)
 *
 * @example
 * ```typescript
 * let app: INestApplication;
 *
 * beforeAll(async () => {
 *   app = await createTestingApp();
 * });
 *
 * afterAll(async () => {
 *   await app.close();
 * });
 * ```
 */
export async function createTestingApp(): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
    }).compile();

    const app = moduleFixture.createNestApplication();

    // 글로벌 프리픽스 설정 (/api)
    app.setGlobalPrefix('api');

    // 글로벌 파이프 설정 (DTO 검증)
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true, // DTO 자동 변환
            whitelist: true, // DTO에 정의되지 않은 속성 제거
            forbidNonWhitelisted: true, // DTO에 정의되지 않은 속성 있으면 에러
        }),
    );

    await app.init();
    return app;
}

/**
 * 테스트 데이터베이스의 모든 컬렉션 데이터 삭제
 *
 * @description
 * 각 테스트 전후로 데이터베이스를 깨끗하게 정리합니다.
 * Districts 컬렉션은 시딩 데이터이므로 삭제하지 않습니다.
 *
 * @example
 * ```typescript
 * beforeEach(async () => {
 *   await cleanupDatabase(app);
 * });
 * ```
 */
export async function cleanupDatabase(app: INestApplication): Promise<void> {
    const connection = app.get<Connection>(getConnectionToken());

    // Districts는 시딩 데이터이므로 삭제하지 않음
    const excludedCollections = ['districts', 'breeds'];

    const collections = connection.collections;

    for (const key in collections) {
        const collection = collections[key];

        // 제외 목록에 없는 컬렉션만 삭제
        if (!excludedCollections.includes(collection.collectionName)) {
            await collection.deleteMany({});
        }
    }
}

/**
 * 특정 컬렉션의 데이터만 삭제
 *
 * @description
 * 특정 도메인의 데이터만 삭제하고 싶을 때 사용합니다.
 *
 * @example
 * ```typescript
 * beforeEach(async () => {
 *   await cleanupCollections(app, ['adopters', 'breeders']);
 * });
 * ```
 */
export async function cleanupCollections(app: INestApplication, collectionNames: string[]): Promise<void> {
    const connection = app.get<Connection>(getConnectionToken());

    for (const collectionName of collectionNames) {
        const collection = connection.collection(collectionName);
        await collection.deleteMany({});
    }
}

/**
 * 테스트용 타임스탬프 생성
 *
 * @description
 * 유니크한 이메일, 닉네임 등을 생성할 때 사용합니다.
 *
 * @example
 * ```typescript
 * const timestamp = getTestTimestamp();
 * const email = `test_${timestamp}@test.com`;
 * ```
 */
export function getTestTimestamp(): number {
    return Date.now();
}

/**
 * 테스트용 랜덤 문자열 생성
 *
 * @description
 * 유니크한 데이터를 생성할 때 사용합니다.
 *
 * @example
 * ```typescript
 * const randomId = getRandomString(10);
 * ```
 */
export function getRandomString(length: number = 10): string {
    return Math.random()
        .toString(36)
        .substring(2, 2 + length);
}

/**
 * 테스트용 관리자 시드 데이터 생성
 *
 * @description
 * 관리자 계정을 생성합니다. 비밀번호는 bcrypt로 해시됩니다.
 *
 * @param app - NestJS 애플리케이션
 * @param password - 관리자 비밀번호 (기본값: 'admin1234')
 * @returns 생성된 관리자 ID와 이메일
 *
 * @example
 * ```typescript
 * const { adminId, email } = await seedAdmin(app);
 * ```
 */
export async function seedAdmin(
    app: INestApplication,
    password: string = 'admin1234',
): Promise<{ adminId: string; email: string }> {
    const bcrypt = require('bcryptjs');
    const connection = app.get<Connection>(getConnectionToken());
    const adminCollection = connection.collection('admins');

    const timestamp = Date.now();
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = {
        name: '테스트관리자',
        email: `admin_${timestamp}@test.com`,
        password: hashedPassword,
        status: 'active',
        adminLevel: 'super_admin',
        permissions: {
            canManageUsers: true,
            canManageBreeders: true,
            canManageReports: true,
            canViewStatistics: true,
            canManageAdmins: true,
        },
        activityLogs: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const result = await adminCollection.insertOne(admin);
    return {
        adminId: result.insertedId.toString(),
        email: admin.email,
    };
}

/**
 * 테스트용 입양자 시드 데이터 생성
 *
 * @description
 * 입양자 계정을 생성합니다.
 *
 * @param app - NestJS 애플리케이션
 * @returns 생성된 입양자 ID와 이메일
 *
 * @example
 * ```typescript
 * const { adopterId, email } = await seedAdopter(app);
 * ```
 */
export async function seedAdopter(app: INestApplication): Promise<{ adopterId: string; email: string }> {
    const connection = app.get<Connection>(getConnectionToken());
    const adopterCollection = connection.collection('adopters');

    const timestamp = Date.now();
    const providerId = getRandomString(10);

    const adopter = {
        tempId: `temp_kakao_${providerId}_${timestamp}`,
        email: `adopter_${timestamp}_${providerId}@test.com`,
        nickname: `테스트입양자${timestamp}`,
        phone: `010-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        profileImage: 'https://example.com/profile.jpg',
        provider: 'kakao',
        providerId: providerId,
        status: 'active',
        role: 'adopter',
        favoriteBreeder: [],
        adoptionApplications: [],
        reviews: [],
        reports: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const result = await adopterCollection.insertOne(adopter);
    return {
        adopterId: result.insertedId.toString(),
        email: adopter.email,
    };
}

/**
 * 테스트용 브리더 시드 데이터 생성
 *
 * @description
 * 브리더 계정을 생성합니다.
 *
 * @param app - NestJS 애플리케이션
 * @param verificationStatus - 인증 상태 (기본값: 'approved')
 * @returns 생성된 브리더 ID와 이메일
 *
 * @example
 * ```typescript
 * const { breederId, email } = await seedBreeder(app, 'approved');
 * ```
 */
export async function seedBreeder(
    app: INestApplication,
    verificationStatus: string = 'approved',
): Promise<{ breederId: string; email: string }> {
    const connection = app.get<Connection>(getConnectionToken());
    const breederCollection = connection.collection('breeders');

    const timestamp = Date.now();

    const breeder = {
        email: `breeder_${timestamp}@test.com`,
        phoneNumber: `010-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        breederName: `테스트브리더${timestamp}`,
        breederLocation: {
            city: '서울특별시',
            district: '강남구',
        },
        animal: 'dog',
        breeds: ['포메라니안'],
        plan: 'basic',
        level: 'new',
        status: 'active',
        role: 'breeder',
        verification: {
            status: verificationStatus,
            documents: [],
            appliedAt: new Date(),
            approvedAt: verificationStatus === 'approved' ? new Date() : null,
        },
        profile: {
            description: '테스트 브리더입니다',
            photoUrls: [],
        },
        parentPets: [],
        availablePets: [],
        applicationForm: {
            questions: [],
        },
        receivedApplications: [],
        reviews: [],
        stats: {
            totalReviews: 0,
            averageRating: 0,
            totalAdoptions: 0,
        },
        reports: [],
        agreements: {
            termsOfService: true,
            privacyPolicy: true,
            marketingConsent: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const result = await breederCollection.insertOne(breeder);
    return {
        breederId: result.insertedId.toString(),
        email: breeder.email,
    };
}

/**
 * 테스트용 분양 가능 반려동물 시드 데이터 생성
 *
 * @description
 * 브리더의 분양 가능한 반려동물을 생성합니다.
 *
 * @param app - NestJS 애플리케이션
 * @param breederId - 브리더 ID
 * @returns 생성된 반려동물 ID
 *
 * @example
 * ```typescript
 * const { petId } = await seedAvailablePet(app, breederId);
 * ```
 */
export async function seedAvailablePet(
    app: INestApplication,
    breederId: string,
): Promise<{ petId: string }> {
    const connection = app.get<Connection>(getConnectionToken());
    const breederCollection = connection.collection('breeders');

    const petId = `pet_${Date.now()}_${getRandomString(6)}`;

    const availablePet = {
        petId,
        name: `테스트강아지${Date.now()}`,
        breed: '포메라니안',
        birthDate: new Date(),
        gender: 'male',
        price: 1500000,
        photoUrls: ['https://example.com/pet.jpg'],
        description: '건강한 강아지입니다',
        vaccinations: [],
        availableFrom: new Date(),
        isAvailable: true,
    };

    await breederCollection.updateOne({ _id: new ObjectId(breederId) }, { $push: { availablePets: availablePet } } as any);

    return { petId };
}

/**
 * 테스트용 입양 신청 시드 데이터 생성
 *
 * @description
 * 입양 신청을 생성합니다.
 *
 * @param app - NestJS 애플리케이션
 * @param adopterId - 입양자 ID
 * @param breederId - 브리더 ID
 * @param petId - 반려동물 ID (선택사항)
 * @returns 생성된 신청 ID
 *
 * @example
 * ```typescript
 * const { applicationId } = await seedAdoptionApplication(app, adopterId, breederId);
 * ```
 */
export async function seedAdoptionApplication(
    app: INestApplication,
    adopterId: string,
    breederId: string,
    petId?: string,
): Promise<{ applicationId: string }> {
    const connection = app.get<Connection>(getConnectionToken());
    const applicationCollection = connection.collection('adoption-applications');

    const applicationId = `app_${Date.now()}_${getRandomString(6)}`;

    const application = {
        applicationId,
        adopterId,
        breederId,
        petId: petId || null,
        status: 'pending',
        applicationData: {
            reason: '반려동물을 정말 사랑합니다',
            experience: '5년 경력',
        },
        appliedAt: new Date(),
        updatedAt: new Date(),
    };

    await applicationCollection.insertOne(application);

    return { applicationId };
}

/**
 * 테스트용 브리더 후기 시드 데이터 생성
 *
 * @description
 * 브리더에 대한 후기를 생성합니다.
 *
 * @param app - NestJS 애플리케이션
 * @param adopterId - 입양자 ID
 * @param breederId - 브리더 ID
 * @returns 생성된 후기 ID
 *
 * @example
 * ```typescript
 * const { reviewId } = await seedBreederReview(app, adopterId, breederId);
 * ```
 */
export async function seedBreederReview(
    app: INestApplication,
    adopterId: string,
    breederId: string,
): Promise<{ reviewId: string }> {
    const connection = app.get<Connection>(getConnectionToken());
    const reviewCollection = connection.collection('breeder-reviews');

    const reviewId = `review_${Date.now()}_${getRandomString(6)}`;

    const review = {
        reviewId,
        breederId,
        adopterId,
        rating: 5,
        content: '정말 좋은 브리더입니다!',
        petHealthRating: 5,
        communicationRating: 5,
        photoUrls: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    await reviewCollection.insertOne(review);

    return { reviewId };
}

/**
 * 테스트용 즐겨찾기 시드 데이터 생성
 *
 * @description
 * 입양자의 즐겨찾기 브리더를 생성합니다.
 *
 * @param app - NestJS 애플리케이션
 * @param adopterId - 입양자 ID
 * @param breederId - 브리더 ID
 * @returns 성공 여부
 *
 * @example
 * ```typescript
 * await seedFavorite(app, adopterId, breederId);
 * ```
 */
export async function seedFavorite(
    app: INestApplication,
    adopterId: string,
    breederId: string,
): Promise<void> {
    const connection = app.get<Connection>(getConnectionToken());
    const favoriteCollection = connection.collection('favorites');

    const favorite = {
        adopterId,
        breederId,
        addedAt: new Date(),
    };

    await favoriteCollection.insertOne(favorite);
}

/**
 * 테스트용 브리더 신고 시드 데이터 생성
 *
 * @description
 * 브리더에 대한 신고를 생성합니다.
 *
 * @param app - NestJS 애플리케이션
 * @param adopterId - 신고자 ID
 * @param breederId - 브리더 ID
 * @returns 생성된 신고 ID
 *
 * @example
 * ```typescript
 * const { reportId } = await seedBreederReport(app, adopterId, breederId);
 * ```
 */
export async function seedBreederReport(
    app: INestApplication,
    adopterId: string,
    breederId: string,
): Promise<{ reportId: string }> {
    const connection = app.get<Connection>(getConnectionToken());
    const reportCollection = connection.collection('breeder-reports');

    const reportId = `report_${Date.now()}_${getRandomString(6)}`;

    const report = {
        reportId,
        breederId,
        reporterId: adopterId,
        reason: 'inappropriate',
        description: '부적절한 행동이 있었습니다',
        status: 'pending',
        reportedAt: new Date(),
    };

    await reportCollection.insertOne(report);

    return { reportId };
}
