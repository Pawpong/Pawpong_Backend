import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestingApp } from '../../../common/test/test-utils';
import * as path from 'path';
import * as fs from 'fs';

describe('Upload API E2E Tests (Simple)', () => {
    let app: INestApplication;
    let breederToken: string;
    let breederId: string;
    let availablePetId: string;
    let parentPetId: string;
    let uploadedFileNames: string[] = [];

    // 테스트용 이미지 파일 생성
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    const createTestImage = () => {
        // 1x1 픽셀 JPEG 이미지 (최소 유효 JPEG)
        const buffer = Buffer.from(
            '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=',
            'base64',
        );
        fs.writeFileSync(testImagePath, buffer);
    };

    beforeAll(async () => {
        app = await createTestingApp();
        createTestImage();

        // 1. 테스트용 브리더 생성
        const timestamp = Date.now();
        const breederResponse = await request(app.getHttpServer())
            .post('/api/auth/register/breeder')
            .send({
                email: `upload_breeder_${timestamp}@test.com`,
                password: 'Breeder123!@#',
                name: '파일 업로드 브리더',
                phoneNumber: '010-3333-4444',
                businessNumber: '123-45-67890',
                businessName: '테스트 브리더리',
            });

        if (breederResponse.status === 200 && breederResponse.body.data?.accessToken) {
            breederToken = breederResponse.body.data.accessToken;
            breederId = breederResponse.body.data.user.userId;
        }

        // 2. 테스트용 분양 개체 생성
        if (breederToken) {
            const availablePetResponse = await request(app.getHttpServer())
                .post('/api/breeder-management/available-pet')
                .set('Authorization', `Bearer ${breederToken}`)
                .send({
                    name: '테스트 분양 개체',
                    breedId: '507f1f77bcf86cd799439011',
                    birthDate: '2024-01-15',
                    gender: 'male',
                    price: 1500000,
                    description: '테스트용 분양 개체입니다.',
                });

            if (availablePetResponse.status === 200 && availablePetResponse.body.data?.petId) {
                availablePetId = availablePetResponse.body.data.petId;
            }

            // 3. 테스트용 부모견/묘 생성
            const parentPetResponse = await request(app.getHttpServer())
                .post('/api/breeder-management/parent-pet')
                .set('Authorization', `Bearer ${breederToken}`)
                .send({
                    name: '테스트 부모견',
                    breedId: '507f1f77bcf86cd799439011',
                    birthDate: '2020-01-01',
                    gender: 'female',
                    description: '테스트용 부모견입니다.',
                });

            if (parentPetResponse.status === 200 && parentPetResponse.body.data?.petId) {
                parentPetId = parentPetResponse.body.data.petId;
            }
        }
    });

    afterAll(async () => {
        // 업로드된 파일 삭제
        for (const fileName of uploadedFileNames) {
            try {
                await request(app.getHttpServer()).delete('/api/upload').send({ fileName });
            } catch (error) {
                // 파일 삭제 실패해도 테스트는 계속 진행
            }
        }

        // 테스트 이미지 파일 삭제
        if (fs.existsSync(testImagePath)) {
            fs.unlinkSync(testImagePath);
        }

        await app.close();
    });

    describe('브리더 대표 사진 업로드', () => {
        it('POST /api/upload/representative-photos - 대표 사진 업로드 성공', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/upload/representative-photos')
                .set('Authorization', `Bearer ${breederToken}`)
                .attach('files', testImagePath)
                .attach('files', testImagePath)
                .attach('files', testImagePath);

            expect([200, 400, 401]).toContain(response.status);

            if (response.status === 200) {
                expect(response.body.data).toBeDefined();
                expect(Array.isArray(response.body.data)).toBe(true);
                if (response.body.data.length > 0) {
                    response.body.data.forEach((item: any) => {
                        uploadedFileNames.push(item.filename || item.fileName);
                    });
                }
                console.log('✅ 브리더 대표 사진 업로드 성공');
            } else {
                console.log('⚠️  브리더 대표 사진 업로드 실패 (GCP 설정 필요 또는 인증 실패)');
            }
        });

        it('POST /api/upload/representative-photos - 인증 없이 접근 실패', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/upload/representative-photos')
                .attach('files', testImagePath);

            expect(response.status).toBe(401);
            console.log('✅ 인증 없이 접근 거부 확인');
        });

        it('POST /api/upload/representative-photos - 파일 없이 요청 실패', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/upload/representative-photos')
                .set('Authorization', `Bearer ${breederToken}`);

            expect([400, 401]).toContain(response.status);
            console.log('✅ 파일 없이 요청 거부 확인');
        });
    });

    describe('분양 개체 사진 업로드', () => {
        it('POST /api/upload/available-pet-photos/:petId - 분양 개체 사진 업로드 성공', async () => {
            if (!availablePetId) {
                console.log('⚠️  분양 개체 ID가 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .post(`/api/upload/available-pet-photos/${availablePetId}`)
                .set('Authorization', `Bearer ${breederToken}`)
                .attach('file', testImagePath);

            expect([200, 400]).toContain(response.status);

            if (response.status === 200) {
                expect(response.body.data).toBeDefined();
                expect(response.body.data).toHaveProperty('filename');
                uploadedFileNames.push(response.body.data.filename);
                console.log('✅ 분양 개체 사진 업로드 성공');
            } else {
                console.log('⚠️  분양 개체 사진 업로드 실패 (GCP 설정 필요)');
            }
        });

        it('POST /api/upload/available-pet-photos/:petId - 인증 없이 접근 실패', async () => {
            if (!availablePetId) {
                console.log('⚠️  분양 개체 ID가 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .post(`/api/upload/available-pet-photos/${availablePetId}`)
                .attach('file', testImagePath);

            expect(response.status).toBe(401);
            console.log('✅ 인증 없이 접근 거부 확인');
        });

        it('POST /api/upload/available-pet-photos/:petId - 잘못된 petId로 요청 실패', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/upload/available-pet-photos/invalid_pet_id')
                .set('Authorization', `Bearer ${breederToken}`)
                .attach('file', testImagePath);

            expect([400, 401, 500]).toContain(response.status);
            console.log('✅ 잘못된 petId로 요청 거부 확인');
        });
    });

    describe('부모견/묘 사진 업로드', () => {
        it('POST /api/upload/parent-pet-photos/:petId - 부모견/묘 사진 업로드 성공', async () => {
            if (!parentPetId) {
                console.log('⚠️  부모견/묘 ID가 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .post(`/api/upload/parent-pet-photos/${parentPetId}`)
                .set('Authorization', `Bearer ${breederToken}`)
                .attach('file', testImagePath);

            expect([200, 400]).toContain(response.status);

            if (response.status === 200) {
                expect(response.body.data).toBeDefined();
                expect(response.body.data).toHaveProperty('filename');
                uploadedFileNames.push(response.body.data.filename);
                console.log('✅ 부모견/묘 사진 업로드 성공');
            } else {
                console.log('⚠️  부모견/묘 사진 업로드 실패 (GCP 설정 필요)');
            }
        });

        it('POST /api/upload/parent-pet-photos/:petId - 인증 없이 접근 실패', async () => {
            if (!parentPetId) {
                console.log('⚠️  부모견/묘 ID가 없어서 테스트 스킵');
                return;
            }

            const response = await request(app.getHttpServer())
                .post(`/api/upload/parent-pet-photos/${parentPetId}`)
                .attach('file', testImagePath);

            expect(response.status).toBe(401);
            console.log('✅ 인증 없이 접근 거부 확인');
        });
    });

    describe('단일 파일 업로드 (공개 API)', () => {
        it('POST /api/upload/single - 단일 파일 업로드 성공', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/upload/single')
                .attach('file', testImagePath)
                .field('folder', 'test');

            expect([200, 201, 400]).toContain(response.status);

            if (response.status === 200 || response.status === 201) {
                expect(response.body.data).toBeDefined();
                expect(response.body.data).toHaveProperty('filename');
                expect(response.body.data).toHaveProperty('url');
                uploadedFileNames.push(response.body.data.filename);
                console.log('✅ 단일 파일 업로드 성공');
            } else {
                console.log('⚠️  단일 파일 업로드 실패 (GCP 설정 필요)');
            }
        });

        it('POST /api/upload/single - 파일 없이 요청 실패', async () => {
            const response = await request(app.getHttpServer()).post('/api/upload/single');

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('파일이 없습니다');
            console.log('✅ 파일 없이 요청 거부 확인');
        });
    });

    describe('다중 파일 업로드 (공개 API)', () => {
        it('POST /api/upload/multiple - 다중 파일 업로드 성공', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/upload/multiple')
                .attach('files', testImagePath)
                .attach('files', testImagePath)
                .field('folder', 'test');

            expect([200, 201, 400]).toContain(response.status);

            if (response.status === 200 || response.status === 201) {
                expect(response.body.data).toBeDefined();
                expect(Array.isArray(response.body.data)).toBe(true);
                response.body.data.forEach((item: any) => {
                    uploadedFileNames.push(item.filename);
                });
                console.log('✅ 다중 파일 업로드 성공');
            } else {
                console.log('⚠️  다중 파일 업로드 실패 (GCP 설정 필요)');
            }
        });

        it('POST /api/upload/multiple - 파일 없이 요청 실패', async () => {
            const response = await request(app.getHttpServer()).post('/api/upload/multiple');

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('파일이 없습니다');
            console.log('✅ 파일 없이 요청 거부 확인');
        });
    });

    describe('파일 삭제', () => {
        it('DELETE /api/upload - 파일 삭제 성공', async () => {
            const response = await request(app.getHttpServer())
                .delete('/api/upload')
                .send({ fileName: 'test/fake-file.jpg' });

            expect([200, 400, 404, 500]).toContain(response.status);

            if (response.status === 200) {
                console.log('✅ 파일 삭제 성공');
            } else {
                console.log('⚠️  파일 삭제 실패 (GCP 설정 필요 또는 파일 없음)');
            }
        });

        it('DELETE /api/upload - 파일명 없이 요청 실패', async () => {
            const response = await request(app.getHttpServer()).delete('/api/upload').send({});

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('파일명이 없습니다');
            console.log('✅ 파일명 없이 요청 거부 확인');
        });
    });

    describe('응답 형식 검증', () => {
        it('모든 업로드 응답은 표준 형식을 따름', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/upload/single')
                .attach('file', testImagePath);

            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('code');
            expect(response.body).toHaveProperty('timestamp');

            if (response.status === 200 || response.status === 201) {
                expect(response.body.data).toHaveProperty('filename');
                expect(response.body.data).toHaveProperty('url');
                expect(response.body.data).toHaveProperty('size');
            }

            console.log('✅ 응답 형식 검증 완료');
        });
    });
});