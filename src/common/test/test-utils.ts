import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../app.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

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
    return Math.random().toString(36).substring(2, 2 + length);
}
