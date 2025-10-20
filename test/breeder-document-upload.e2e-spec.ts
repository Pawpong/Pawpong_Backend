import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as path from 'path';
import * as fs from 'fs';
import { createTestingApp, AuthHelper } from './test-utils';

/**
 * 브리더 서류 업로드 E2E 테스트
 *
 * 테스트 범위:
 * 1. New 레벨 서류 업로드 (필수 2개)
 * 2. Elite 레벨 서류 업로드 (필수 5개 + 선택 1개)
 * 3. 서류 업로드 유효성 검증
 */
describe('Breeder Document Upload E2E Tests', () => {
    let app: INestApplication;
    let authHelper: AuthHelper;
    let breederToken: string;
    let breederId: string;

    // 테스트용 더미 파일 생성
    const createDummyFile = (filename: string): Buffer => {
        return Buffer.from(`Dummy file content for ${filename}`);
    };

    beforeAll(async () => {
        app = await createTestingApp();
        authHelper = new AuthHelper(app);

        // 테스트용 브리더 토큰 생성
        const breederAuth = await authHelper.getBreederToken();
        breederToken = breederAuth.accessToken;
        breederId = breederAuth.userId;
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /api/auth/breeder/submit-documents - New 레벨 서류 제출', () => {
        it('성공: New 레벨 필수 서류 2개 업로드', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/breeder/submit-documents')
                .set('Authorization', `Bearer ${breederToken}`)
                .field('breederLevel', 'new')
                .attach('idCard', createDummyFile('id_card.pdf'), 'id_card.pdf')
                .attach(
                    'animalProductionLicense',
                    createDummyFile('license.pdf'),
                    'license.pdf',
                )
                .expect(200);

            // 응답 구조 검증
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('code', 200);
            expect(response.body).toHaveProperty('data');
            expect(response.body.message).toContain('성공적으로 업로드');

            // 응답 데이터 검증
            const { data } = response.body;
            expect(data).toHaveProperty('breederId');
            expect(data).toHaveProperty('verificationStatus', 'reviewing');
            expect(data).toHaveProperty('uploadedDocuments');
            expect(data.uploadedDocuments).toHaveProperty('idCard');
            expect(data.uploadedDocuments).toHaveProperty('animalProductionLicense');
            expect(data).toHaveProperty('isDocumentsComplete', true);
            expect(data).toHaveProperty('submittedAt');
            expect(data).toHaveProperty('estimatedProcessingTime', '3-5일');
        });

        it('실패: New 레벨 필수 서류 누락 (신분증 없음)', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/breeder/submit-documents')
                .set('Authorization', `Bearer ${breederToken}`)
                .field('breederLevel', 'new')
                // idCard 누락
                .attach(
                    'animalProductionLicense',
                    createDummyFile('license.pdf'),
                    'license.pdf',
                )
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('신분증 사본');
        });

        it('실패: New 레벨 필수 서류 누락 (동물생산업 등록증 없음)', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/breeder/submit-documents')
                .set('Authorization', `Bearer ${breederToken}`)
                .field('breederLevel', 'new')
                .attach('idCard', createDummyFile('id_card.pdf'), 'id_card.pdf')
                // animalProductionLicense 누락
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('동물생산업 등록증');
        });
    });

    describe('POST /api/auth/breeder/submit-documents - Elite 레벨 서류 제출', () => {
        it('성공: Elite 레벨 필수 서류 5개 업로드', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/breeder/submit-documents')
                .set('Authorization', `Bearer ${breederToken}`)
                .field('breederLevel', 'elite')
                .attach('idCard', createDummyFile('id_card.pdf'), 'id_card.pdf')
                .attach(
                    'animalProductionLicense',
                    createDummyFile('license.pdf'),
                    'license.pdf',
                )
                .attach(
                    'adoptionContractSample',
                    createDummyFile('contract.pdf'),
                    'contract.pdf',
                )
                .attach(
                    'recentAssociationDocument',
                    createDummyFile('association.pdf'),
                    'association.pdf',
                )
                .attach(
                    'breederCertification',
                    createDummyFile('certification.pdf'),
                    'certification.pdf',
                )
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.verificationStatus).toBe('reviewing');
            expect(response.body.data.uploadedDocuments).toHaveProperty('idCard');
            expect(response.body.data.uploadedDocuments).toHaveProperty('animalProductionLicense');
            expect(response.body.data.uploadedDocuments).toHaveProperty('adoptionContractSample');
            expect(response.body.data.uploadedDocuments).toHaveProperty('recentAssociationDocument');
            expect(response.body.data.uploadedDocuments).toHaveProperty('breederCertification');
        });

        it('성공: Elite 레벨 필수 5개 + 선택 1개 (TICA/CFA) 업로드', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/breeder/submit-documents')
                .set('Authorization', `Bearer ${breederToken}`)
                .field('breederLevel', 'elite')
                .attach('idCard', createDummyFile('id_card.pdf'), 'id_card.pdf')
                .attach(
                    'animalProductionLicense',
                    createDummyFile('license.pdf'),
                    'license.pdf',
                )
                .attach(
                    'adoptionContractSample',
                    createDummyFile('contract.pdf'),
                    'contract.pdf',
                )
                .attach(
                    'recentAssociationDocument',
                    createDummyFile('association.pdf'),
                    'association.pdf',
                )
                .attach(
                    'breederCertification',
                    createDummyFile('certification.pdf'),
                    'certification.pdf',
                )
                .attach(
                    'ticaCfaDocument', // 선택 서류
                    createDummyFile('tica.pdf'),
                    'tica.pdf',
                )
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.uploadedDocuments).toHaveProperty('ticaCfaDocument');
        });

        it('실패: Elite 레벨 필수 서류 누락 (표준 입양계약서 없음)', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/breeder/submit-documents')
                .set('Authorization', `Bearer ${breederToken}`)
                .field('breederLevel', 'elite')
                .attach('idCard', createDummyFile('id_card.pdf'), 'id_card.pdf')
                .attach(
                    'animalProductionLicense',
                    createDummyFile('license.pdf'),
                    'license.pdf',
                )
                // adoptionContractSample 누락
                .attach(
                    'recentAssociationDocument',
                    createDummyFile('association.pdf'),
                    'association.pdf',
                )
                .attach(
                    'breederCertification',
                    createDummyFile('certification.pdf'),
                    'certification.pdf',
                )
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('표준 입양계약서 샘플');
        });

        it('실패: Elite 레벨 필수 서류 누락 (협회 서류 없음)', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/breeder/submit-documents')
                .set('Authorization', `Bearer ${breederToken}`)
                .field('breederLevel', 'elite')
                .attach('idCard', createDummyFile('id_card.pdf'), 'id_card.pdf')
                .attach(
                    'animalProductionLicense',
                    createDummyFile('license.pdf'),
                    'license.pdf',
                )
                .attach(
                    'adoptionContractSample',
                    createDummyFile('contract.pdf'),
                    'contract.pdf',
                )
                // recentAssociationDocument 누락
                .attach(
                    'breederCertification',
                    createDummyFile('certification.pdf'),
                    'certification.pdf',
                )
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('최근 발급한 협회 서류');
        });

        it('실패: Elite 레벨 필수 서류 누락 (브리더 인증 서류 없음)', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/breeder/submit-documents')
                .set('Authorization', `Bearer ${breederToken}`)
                .field('breederLevel', 'elite')
                .attach('idCard', createDummyFile('id_card.pdf'), 'id_card.pdf')
                .attach(
                    'animalProductionLicense',
                    createDummyFile('license.pdf'),
                    'license.pdf',
                )
                .attach(
                    'adoptionContractSample',
                    createDummyFile('contract.pdf'),
                    'contract.pdf',
                )
                .attach(
                    'recentAssociationDocument',
                    createDummyFile('association.pdf'),
                    'association.pdf',
                )
                // breederCertification 누락
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('고양이 브리더 인증 서류');
        });
    });

    describe('POST /api/auth/breeder/submit-documents - 인증 검증', () => {
        it('실패: JWT 토큰 없음 (401 Unauthorized)', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/breeder/submit-documents')
                .field('breederLevel', 'new')
                .attach('idCard', createDummyFile('id_card.pdf'), 'id_card.pdf')
                .attach(
                    'animalProductionLicense',
                    createDummyFile('license.pdf'),
                    'license.pdf',
                )
                .expect(401);
        });

        it('실패: 잘못된 JWT 토큰 (401 Unauthorized)', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/breeder/submit-documents')
                .set('Authorization', 'Bearer invalid-token-here')
                .field('breederLevel', 'new')
                .attach('idCard', createDummyFile('id_card.pdf'), 'id_card.pdf')
                .attach(
                    'animalProductionLicense',
                    createDummyFile('license.pdf'),
                    'license.pdf',
                )
                .expect(401);
        });
    });

    describe('POST /api/auth/breeder/submit-documents - breederLevel 유효성 검증', () => {
        it('실패: breederLevel이 없음', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/breeder/submit-documents')
                .set('Authorization', `Bearer ${breederToken}`)
                // breederLevel 누락
                .attach('idCard', createDummyFile('id_card.pdf'), 'id_card.pdf')
                .attach(
                    'animalProductionLicense',
                    createDummyFile('license.pdf'),
                    'license.pdf',
                )
                .expect(400);
        });

        it('실패: 잘못된 breederLevel 값', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/breeder/submit-documents')
                .set('Authorization', `Bearer ${breederToken}`)
                .field('breederLevel', 'master') // 잘못된 값
                .attach('idCard', createDummyFile('id_card.pdf'), 'id_card.pdf')
                .attach(
                    'animalProductionLicense',
                    createDummyFile('license.pdf'),
                    'license.pdf',
                )
                .expect(400);
        });
    });
});
