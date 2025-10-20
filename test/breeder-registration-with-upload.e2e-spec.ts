import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestingApp } from './test-utils';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 브리더 회원가입 + 서류 업로드 통합 E2E 테스트
 *
 * 테스트 범위:
 * 1. 서류 업로드 API 호출 (POST /api/upload/verification-documents)
 * 2. 업로드된 서류 URL을 포함한 브리더 회원가입 (POST /api/auth/register/breeder)
 * 3. 전체 플로우 통합 테스트
 */
describe('Breeder Registration with Document Upload E2E Tests', () => {
    let app: INestApplication;

    beforeAll(async () => {
        app = await createTestingApp();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('전체 플로우: 서류 업로드 → 회원가입', () => {
        it('성공: Elite 레벨 - 서류 업로드 후 회원가입', async () => {
            const testEmail = `elite-upload-test-${Date.now()}@example.com`;

            // 1단계: 서류 업로드
            // 임시 테스트 파일 생성
            const testFilePath1 = path.join(__dirname, 'temp_id_card.pdf');
            const testFilePath2 = path.join(__dirname, 'temp_license.pdf');
            const testFilePath3 = path.join(__dirname, 'temp_contract.pdf');
            const testFilePath4 = path.join(__dirname, 'temp_pedigree.pdf');
            const testFilePath5 = path.join(__dirname, 'temp_certification.pdf');

            fs.writeFileSync(testFilePath1, 'Mock ID Card PDF Content');
            fs.writeFileSync(testFilePath2, 'Mock License PDF Content');
            fs.writeFileSync(testFilePath3, 'Mock Contract PDF Content');
            fs.writeFileSync(testFilePath4, 'Mock Pedigree PDF Content');
            fs.writeFileSync(testFilePath5, 'Mock Certification PDF Content');

            try {
                const uploadResponse = await request(app.getHttpServer())
                    .post('/api/upload/verification-documents')
                    .field(
                        'types',
                        JSON.stringify([
                            'id_card',
                            'animal_production_license',
                            'adoption_contract_sample',
                            'pedigree',
                            'breeder_certification',
                        ]),
                    )
                    .attach('files', testFilePath1)
                    .attach('files', testFilePath2)
                    .attach('files', testFilePath3)
                    .attach('files', testFilePath4)
                    .attach('files', testFilePath5)
                    .expect(200);

                expect(uploadResponse.body.success).toBe(true);
                expect(uploadResponse.body.data).toHaveProperty('uploadedDocuments');
                expect(uploadResponse.body.data.uploadedDocuments).toHaveLength(5);

                // 업로드된 서류 URL 추출
                const documentUrls = uploadResponse.body.data.allDocuments.map(
                    (doc: any) => doc.url,
                );

                // 2단계: 업로드된 서류 URL을 포함한 브리더 회원가입
                const registrationResponse = await request(app.getHttpServer())
                    .post('/api/auth/register/breeder')
                    .send({
                        email: testEmail,
                        phoneNumber: '010-9999-8888',
                        breederName: '서류 포함 엘리트 캐터리',
                        breederLocation: '서울특별시 강남구',
                        animal: 'cat',
                        breeds: ['페르시안', '샴', '러시안블루'],
                        plan: 'pro',
                        level: 'elite',
                        termAgreed: true,
                        privacyAgreed: true,
                        marketingAgreed: true,
                        documentUrls: documentUrls, // 업로드된 서류 URL 전달
                    })
                    .expect(200);

                // 회원가입 응답 검증
                expect(registrationResponse.body.success).toBe(true);
                expect(registrationResponse.body.data).toHaveProperty('breederId');
                expect(registrationResponse.body.data).toHaveProperty('accessToken');
                expect(registrationResponse.body.data.email).toBe(testEmail);
                expect(registrationResponse.body.data.level).toBe('elite');
                expect(registrationResponse.body.data.plan).toBe('pro');
            } finally {
                // 임시 파일 정리
                fs.unlinkSync(testFilePath1);
                fs.unlinkSync(testFilePath2);
                fs.unlinkSync(testFilePath3);
                fs.unlinkSync(testFilePath4);
                fs.unlinkSync(testFilePath5);
            }
        });

        it('성공: New 레벨 - 필수 서류만 업로드 후 회원가입', async () => {
            const testEmail = `new-upload-test-${Date.now()}@example.com`;

            // 1단계: 필수 서류만 업로드 (신분증, 동물생산업 등록증)
            const testFilePath1 = path.join(__dirname, 'temp_id_card_new.pdf');
            const testFilePath2 = path.join(__dirname, 'temp_license_new.pdf');

            fs.writeFileSync(testFilePath1, 'Mock ID Card PDF Content');
            fs.writeFileSync(testFilePath2, 'Mock License PDF Content');

            try {
                const uploadResponse = await request(app.getHttpServer())
                    .post('/api/upload/verification-documents')
                    .field(
                        'types',
                        JSON.stringify(['id_card', 'animal_production_license']),
                    )
                    .attach('files', testFilePath1)
                    .attach('files', testFilePath2)
                    .expect(200);

                expect(uploadResponse.body.success).toBe(true);
                expect(uploadResponse.body.data.uploadedDocuments).toHaveLength(2);

                const documentUrls = uploadResponse.body.data.allDocuments.map(
                    (doc: any) => doc.url,
                );

                // 2단계: 회원가입
                const registrationResponse = await request(app.getHttpServer())
                    .post('/api/auth/register/breeder')
                    .send({
                        email: testEmail,
                        phoneNumber: '010-7777-6666',
                        breederName: '서류 포함 뉴 브리더',
                        breederLocation: '경기도 성남시',
                        animal: 'dog',
                        breeds: ['골든 리트리버'],
                        plan: 'basic',
                        level: 'new',
                        termAgreed: true,
                        privacyAgreed: true,
                        documentUrls: documentUrls,
                    })
                    .expect(200);

                expect(registrationResponse.body.success).toBe(true);
                expect(registrationResponse.body.data.level).toBe('new');
                expect(registrationResponse.body.data.plan).toBe('basic');
            } finally {
                fs.unlinkSync(testFilePath1);
                fs.unlinkSync(testFilePath2);
            }
        });

        it('성공: 서류 업로드 없이 회원가입 (나중에 제출)', async () => {
            const testEmail = `no-docs-test-${Date.now()}@example.com`;

            // 서류 업로드 없이 바로 회원가입
            const registrationResponse = await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send({
                    email: testEmail,
                    phoneNumber: '010-5555-4444',
                    breederName: '서류 나중 제출 브리더',
                    breederLocation: '부산광역시 해운대구',
                    animal: 'cat',
                    breeds: ['브리티시 숏헤어'],
                    plan: 'basic',
                    level: 'new',
                    termAgreed: true,
                    privacyAgreed: true,
                    // documentUrls 필드 없음
                })
                .expect(200);

            expect(registrationResponse.body.success).toBe(true);
            expect(registrationResponse.body.data).toHaveProperty('breederId');
            expect(registrationResponse.body.data.verificationStatus).toBe('pending');
        });

        it('성공: 소셜 로그인 + 서류 업로드 + 회원가입', async () => {
            const testEmail = `social-upload-test-${Date.now()}@example.com`;
            const tempId = `temp_kakao_123456_${Date.now()}`;

            // 1단계: 서류 업로드
            const testFilePath1 = path.join(__dirname, 'temp_social_id_card.pdf');
            const testFilePath2 = path.join(__dirname, 'temp_social_license.pdf');

            fs.writeFileSync(testFilePath1, 'Mock Social ID Card PDF Content');
            fs.writeFileSync(testFilePath2, 'Mock Social License PDF Content');

            try {
                const uploadResponse = await request(app.getHttpServer())
                    .post('/api/upload/verification-documents')
                    .field(
                        'types',
                        JSON.stringify(['id_card', 'animal_production_license']),
                    )
                    .attach('files', testFilePath1)
                    .attach('files', testFilePath2)
                    .expect(200);

                const documentUrls = uploadResponse.body.data.allDocuments.map(
                    (doc: any) => doc.url,
                );

                // 2단계: 소셜 로그인 정보 포함 회원가입
                const registrationResponse = await request(app.getHttpServer())
                    .post('/api/auth/register/breeder')
                    .send({
                        email: testEmail,
                        phoneNumber: '010-3333-2222',
                        breederName: '소셜 로그인 브리더',
                        breederLocation: '인천광역시 남동구',
                        animal: 'cat',
                        breeds: ['메인쿤'],
                        plan: 'basic',
                        level: 'new',
                        termAgreed: true,
                        privacyAgreed: true,
                        tempId: tempId,
                        provider: 'kakao',
                        profileImage: 'https://example.com/kakao-profile.jpg',
                        documentUrls: documentUrls,
                    })
                    .expect(200);

                expect(registrationResponse.body.success).toBe(true);
                expect(registrationResponse.body.data.breederId).toBeDefined();
            } finally {
                fs.unlinkSync(testFilePath1);
                fs.unlinkSync(testFilePath2);
            }
        });
    });

    describe('서류 업로드 실패 시나리오', () => {
        it('실패: 잘못된 types 배열 (파일 수와 불일치)', async () => {
            const testFilePath = path.join(__dirname, 'temp_mismatch.pdf');
            fs.writeFileSync(testFilePath, 'Mock PDF Content');

            try {
                await request(app.getHttpServer())
                    .post('/api/upload/verification-documents')
                    .field('types', JSON.stringify(['id_card', 'animal_production_license'])) // 2개 타입
                    .attach('files', testFilePath) // 1개 파일
                    .expect(400); // 파일 수와 타입 수 불일치
            } finally {
                fs.unlinkSync(testFilePath);
            }
        });

        it('실패: 파일 크기 초과 (10MB 이상)', async () => {
            const testFilePath = path.join(__dirname, 'temp_large.pdf');
            // 11MB 크기의 파일 생성
            const largeBuffer = Buffer.alloc(11 * 1024 * 1024);
            fs.writeFileSync(testFilePath, largeBuffer);

            try {
                await request(app.getHttpServer())
                    .post('/api/upload/verification-documents')
                    .field('types', JSON.stringify(['id_card']))
                    .attach('files', testFilePath)
                    .expect(400); // 파일 크기 초과
            } finally {
                fs.unlinkSync(testFilePath);
            }
        });
    });
});
