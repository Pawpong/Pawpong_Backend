import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestingApp } from './test-utils';

describe('Check API Response Structure', () => {
    let app: INestApplication;

    beforeAll(async () => {
        app = await createTestingApp();
    });

    afterAll(async () => {
        await app.close();
    });

    it('브리더 회원가입 응답 구조 확인', async () => {
        const breederEmail = `breeder_check_${Date.now()}@test.com`;
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

        console.log('\n=== 브리더 회원가입 응답 ===');
        console.log('Status:', response.status);
        console.log('Body Keys:', Object.keys(response.body));
        console.log('Full Body:', JSON.stringify(response.body, null, 2));

        if (response.body.data) {
            console.log('Data Keys:', Object.keys(response.body.data));
        }
    });

    it('입양자 회원가입 응답 구조 확인', async () => {
        const timestamp = Date.now();
        const adopterEmail = `adopter_check_${timestamp}@test.com`;
        const providerId = Math.random().toString().substr(2, 10);
        const response = await request(app.getHttpServer())
            .post('/api/auth/register/adopter')
            .send({
                tempId: `temp_kakao_${providerId}_${timestamp}`,
                email: adopterEmail,
                nickname: `테스트입양자${timestamp}`,
                phone: '010-1234-5678',
                profileImage: 'https://example.com/adopter.jpg',
            });

        console.log('\n=== 입양자 회원가입 응답 ===');
        console.log('Status:', response.status);
        console.log('Body Keys:', Object.keys(response.body));
        console.log('Full Body:', JSON.stringify(response.body, null, 2));

        if (response.body.data) {
            console.log('Data Keys:', Object.keys(response.body.data));
        }
    });
});
