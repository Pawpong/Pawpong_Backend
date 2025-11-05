import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestingApp } from './test-utils';

describe('Debug Breeder Test', () => {
    let app: INestApplication;

    beforeAll(async () => {
        app = await createTestingApp();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should register a breeder', async () => {
        const breederEmail = `breeder_${Date.now()}@test.com`;
        const response = await request(app.getHttpServer())
            .post('/api/auth/register/breeder')
            .send({
                email: breederEmail,
                phoneNumber: '010-9876-5432',
                breederName: '테스트브리더',
                breederLocation: {
                    city: '서울특별시',
                    district: '강남구',
                },
                animal: 'dog',
                breeds: ['포메라니안', '말티즈'],
                plan: 'basic',
                level: 'new',
                agreements: {
                    termsOfService: true,
                    privacyPolicy: true,
                    marketingConsent: false,
                },
            });

        console.log('Status:', response.status);
        console.log('Body:', JSON.stringify(response.body, null, 2));

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });
});
