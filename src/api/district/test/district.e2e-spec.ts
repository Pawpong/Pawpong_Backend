import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { createTestingApp } from '../../../common/test/test-utils';

/**
 * District 도메인 E2E 테스트 (간소화 버전)
 *
 * 테스트 대상 핵심 API:
 * 1. 모든 지역 데이터 조회 (공개 API)
 */
describe('District API E2E Tests (Simple)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        app = await createTestingApp();
    });

    afterAll(async () => {
        await app.close();
    });

    /**
     * 1. 지역 데이터 조회 테스트
     */
    describe('지역 데이터 조회', () => {
        it('GET /api/districts - 모든 지역 데이터 조회 성공', async () => {
            const response = await request(app.getHttpServer()).get('/api/districts').expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
            console.log('✅ 모든 지역 데이터 조회 성공');
        });

        it('GET /api/districts - 인증 없이 접근 가능', async () => {
            // Authorization 헤더 없이 요청
            const response = await request(app.getHttpServer()).get('/api/districts').expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            console.log('✅ 인증 없이 지역 데이터 조회 성공');
        });

        it('GET /api/districts - 응답 구조 검증', async () => {
            const response = await request(app.getHttpServer()).get('/api/districts').expect(200);

            const districts = response.body.data;
            if (districts && districts.length > 0) {
                const district = districts[0];
                expect(district).toHaveProperty('city');
                expect(district).toHaveProperty('districts');
                expect(Array.isArray(district.districts)).toBe(true);
                console.log('✅ 지역 데이터 구조 검증 완료');
            } else {
                console.log('⚠️  지역 데이터가 아직 없습니다 (시딩 필요)');
            }
        });

        it('GET /api/districts - 서울특별시 포함 여부 확인', async () => {
            const response = await request(app.getHttpServer()).get('/api/districts').expect(200);

            const districts = response.body.data;
            if (districts && districts.length > 0) {
                const hasSeoul = districts.some((district: any) => district.city === '서울특별시');
                expect(hasSeoul).toBe(true);
                console.log('✅ 서울특별시 포함 확인');
            } else {
                console.log('⚠️  지역 데이터가 아직 없습니다 (시딩 필요)');
            }
        });

        it('GET /api/districts - 각 지역의 districts 배열 확인', async () => {
            const response = await request(app.getHttpServer()).get('/api/districts').expect(200);

            const districtData = response.body.data;
            if (districtData && districtData.length > 0) {
                const allHaveDistricts = districtData.every(
                    (item: any) => Array.isArray(item.districts) && item.districts.length > 0,
                );
                expect(allHaveDistricts).toBe(true);
                console.log('✅ 모든 지역이 districts 배열을 포함함');
            } else {
                console.log('⚠️  지역 데이터가 아직 없습니다 (시딩 필요)');
            }
        });
    });

    /**
     * 2. 응답 형식 검증 테스트
     */
    describe('응답 형식 검증', () => {
        it('표준 API 응답 형식 확인', async () => {
            const response = await request(app.getHttpServer()).get('/api/districts').expect(200);

            // 표준 ApiResponseDto 형식 검증
            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('code');
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body.success).toBe(true);
            expect(response.body.code).toBe(200);
            console.log('✅ 표준 API 응답 형식 검증 완료');
        });

        it('타임스탬프 형식 확인', async () => {
            const response = await request(app.getHttpServer()).get('/api/districts').expect(200);

            // ISO 8601 형식의 타임스탬프 검증
            expect(response.body.timestamp).toBeDefined();
            const timestamp = new Date(response.body.timestamp);
            expect(timestamp.toString()).not.toBe('Invalid Date');
            console.log('✅ 타임스탬프 형식 검증 완료');
        });
    });
});
