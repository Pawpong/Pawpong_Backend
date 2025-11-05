import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestingApp } from './test-utils';

describe('Simple Test', () => {
    let app: INestApplication;

    beforeAll(async () => {
        app = await createTestingApp();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should work with supertest', async () => {
        const response = await request(app.getHttpServer())
            .get('/api/health')
            .expect(200);

        console.log('Response:', response.body);
        expect(response.body).toHaveProperty('success');
    });
});
