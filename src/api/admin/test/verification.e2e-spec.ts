import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { AppModule } from '../../../app.module';

/**
 * 관리자 브리더 인증 관리 End-to-End 테스트
 * 관리자의 브리더 인증 승인/거절 관련 모든 시나리오를 테스트합니다.
 * - 승인 대기 브리더 목록 조회
 * - 브리더 인증 승인 처리
 * - 브리더 인증 거절 처리
 * - 인증 문서 검토 및 관리
 * - 승인 내역 및 통계 조회
 */
describe('Admin Verification Management API (e2e)', () => {
    let app: INestApplication;
    let mongod: MongoMemoryServer;
    let adminToken: string;
    let breederToken: string;
    let adopterToken: string;
    let breederId: string;
    let secondBreederId: string;

    beforeAll(async () => {
        // 메모리 내 MongoDB 서버 시작
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [MongooseModule.forRoot(uri), AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // 테스트용 관리자 생성
        const adminResponse = await request(app.getHttpServer())
            .post('/api/auth/register/admin')
            .send({
                email: 'admin@test.com',
                password: 'adminpassword123',
                name: 'Test Admin',
                adminLevel: 'super',
            })
            .expect((res) => {
                if (res.status === 201) {
                    adminToken = res.body.access_token;
                }
            });

        // 테스트용 브리더 생성 (인증 대기 상태)
        const breederResponse = await request(app.getHttpServer()).post('/api/auth/register/breeder').send({
            email: 'breeder@test.com',
            password: 'testpassword123',
            name: 'Test Breeder',
            phone: '010-9876-5432',
            businessNumber: '123-45-67890',
            businessName: 'Test Pet Farm',
        });
        breederToken = breederResponse.body.access_token;
        breederId = breederResponse.body.user.id;

        // 추가 브리더 생성 (다중 테스트용)
        const secondBreederResponse = await request(app.getHttpServer()).post('/api/auth/register/breeder').send({
            email: 'breeder2@test.com',
            password: 'testpassword123',
            name: 'Second Breeder',
            phone: '010-8765-4321',
            businessNumber: '987-65-43210',
            businessName: 'Second Pet Farm',
        });
        secondBreederId = secondBreederResponse.body.user.id;

        // 테스트용 입양자 생성 (권한 테스트용)
        const adopterResponse = await request(app.getHttpServer()).post('/api/auth/register/adopter').send({
            email: 'adopter@test.com',
            password: 'testpassword123',
            name: 'Test Adopter',
            phone: '010-1234-5678',
        });
        adopterToken = adopterResponse.body.access_token;
    });

    afterAll(async () => {
        await app.close();
        await mongod.stop();
    });

    describe('Pending Verification List', () => {
        it('GET /api/admin/verification/pending - 승인 대기 브리더 목록 조회 성공', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/verification/pending')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    page: 1,
                    limit: 10,
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(Array.isArray(res.body.item.breeders)).toBe(true);
                    expect(res.body.item.pageInfo).toBeDefined();
                    expect(res.body.item.pageInfo.currentPage).toBe(1);
                    expect(res.body.item.pageInfo.pageSize).toBe(10);

                    // 대기 중인 브리더가 있다면 구조 검증
                    if (res.body.item.breeders.length > 0) {
                        const breeder = res.body.item.breeders[0];
                        expect(breeder).toHaveProperty('id');
                        expect(breeder).toHaveProperty('name');
                        expect(breeder).toHaveProperty('email');
                        expect(breeder).toHaveProperty('businessNumber');
                        expect(breeder).toHaveProperty('businessName');
                        expect(breeder).toHaveProperty('verification');
                        expect(breeder.verification.status).toBe('pending');
                    }
                });
        });

        it('GET /api/admin/verification/pending - 상태별 필터링', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/verification/pending')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    status: 'pending',
                    sortBy: 'appliedAt',
                    order: 'desc',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);

                    // 모든 브리더가 대기 상태인지 확인
                    res.body.item.breeders.forEach((breeder: any) => {
                        expect(breeder.verification.status).toBe('pending');
                    });
                });
        });

        it('GET /api/admin/verification/pending - 검색 기능 테스트', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/verification/pending')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    search: 'Test Breeder',
                    searchFields: 'name,businessName',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);

                    // 검색 결과에 해당 키워드가 포함되어 있는지 확인
                    res.body.item.breeders.forEach((breeder: any) => {
                        const matchesSearch = breeder.name.includes('Test') || breeder.businessName.includes('Test');
                        expect(matchesSearch).toBe(true);
                    });
                });
        });

        it('GET /api/admin/verification/pending - 날짜 범위 필터링', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            const today = new Date();
            const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

            await request(app.getHttpServer())
                .get('/api/admin/verification/pending')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    dateFrom: lastWeek.toISOString().split('T')[0],
                    dateTo: today.toISOString().split('T')[0],
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);

                    // 날짜 범위 내의 신청만 포함되어 있는지 확인
                    res.body.item.breeders.forEach((breeder: any) => {
                        const appliedAt = new Date(breeder.verification.appliedAt);
                        expect(appliedAt.getTime()).toBeGreaterThanOrEqual(lastWeek.getTime());
                        expect(appliedAt.getTime()).toBeLessThanOrEqual(today.getTime());
                    });
                });
        });
    });

    describe('Breeder Verification Approval', () => {
        it('PUT /api/admin/verification/:breederId - 브리더 인증 승인 성공', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .put(`/api/admin/verification/${breederId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'approved',
                    message: '모든 서류가 확인되었습니다. 인증이 승인되었습니다.',
                    approvedDocuments: ['business_license', 'facility_photos', 'health_certificate'],
                    adminNotes: '우수한 시설과 관리 시스템을 갖추고 있음',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.verification.status).toBe('approved');
                    expect(res.body.item.verification.approvedAt).toBeDefined();
                    expect(res.body.item.verification.adminMessage).toBe(
                        '모든 서류가 확인되었습니다. 인증이 승인되었습니다.',
                    );
                    expect(res.body.message).toContain('브리더 인증이 승인되었습니다');
                });
        });

        it('PUT /api/admin/verification/:breederId - 승인 후 브리더 상태 확인', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            // 브리더 프로필에서 인증 상태 확인
            await request(app.getHttpServer())
                .get(`/api/breeder/${breederId}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.item.verification.status).toBe('approved');
                    expect(res.body.item.verification.approvedAt).toBeDefined();
                    expect(res.body.item.isVerified).toBe(true);
                });
        });

        it('PUT /api/admin/verification/:breederId - 조건부 승인', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .put(`/api/admin/verification/${secondBreederId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'conditionally_approved',
                    message: '기본 인증은 승인되었으나, 추가 서류 제출이 필요합니다.',
                    conditions: ['3개월 내 시설 확장 계획서 제출', '수의사 정기 검진 증명서 분기별 제출'],
                    reviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.verification.status).toBe('conditionally_approved');
                    expect(res.body.item.verification.conditions).toHaveLength(2);
                    expect(res.body.item.verification.reviewDate).toBeDefined();
                });
        });
    });

    describe('Breeder Verification Rejection', () => {
        let testBreederId: string;

        beforeEach(async () => {
            // 각 테스트마다 새로운 브리더 생성 (거절 테스트용)
            const testBreederResponse = await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send({
                    email: `reject-test-${Date.now()}@test.com`,
                    password: 'testpassword123',
                    name: 'Reject Test Breeder',
                    phone: '010-7777-8888',
                    businessNumber: `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 90000) + 10000}`,
                    businessName: 'Reject Test Farm',
                });

            testBreederId = testBreederResponse.body.user.id;
        });

        it('PUT /api/admin/verification/:breederId - 브리더 인증 거절', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .put(`/api/admin/verification/${testBreederId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'rejected',
                    message: '제출된 서류에 문제가 있어 인증이 거절되었습니다.',
                    reasons: ['사업자등록증이 명확하지 않음', '시설 사진이 부족함', '동물 보호 관련 자격증 미제출'],
                    requiredDocuments: [
                        'valid_business_license',
                        'facility_detailed_photos',
                        'animal_care_certificate',
                    ],
                    reapplyAfter: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.verification.status).toBe('rejected');
                    expect(res.body.item.verification.rejectedAt).toBeDefined();
                    expect(res.body.item.verification.reasons).toHaveLength(3);
                    expect(res.body.item.verification.requiredDocuments).toHaveLength(3);
                    expect(res.body.message).toContain('브리더 인증이 거절되었습니다');
                });
        });

        it('PUT /api/admin/verification/:breederId - 부분 거절 (추가 서류 요청)', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .put(`/api/admin/verification/${testBreederId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'additional_documents_required',
                    message: '추가 서류 제출 후 재검토가 필요합니다.',
                    missingDocuments: ['health_certificate', 'insurance_documents'],
                    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                    autoRejectAfter: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.verification.status).toBe('additional_documents_required');
                    expect(res.body.item.verification.missingDocuments).toHaveLength(2);
                    expect(res.body.item.verification.deadline).toBeDefined();
                });
        });
    });

    describe('Document Management', () => {
        it('GET /api/admin/verification/:breederId/documents - 제출 서류 목록 조회', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get(`/api/admin/verification/${breederId}/documents`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(Array.isArray(res.body.item.documents)).toBe(true);

                    // 서류가 있다면 구조 검증
                    if (res.body.item.documents.length > 0) {
                        const document = res.body.item.documents[0];
                        expect(document).toHaveProperty('id');
                        expect(document).toHaveProperty('type');
                        expect(document).toHaveProperty('filename');
                        expect(document).toHaveProperty('uploadedAt');
                        expect(document).toHaveProperty('status');
                        expect(document).toHaveProperty('reviewNotes');
                    }
                });
        });

        it('PUT /api/admin/verification/:breederId/documents/:documentId - 서류 검토 상태 업데이트', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            // 먼저 서류 목록을 가져와서 첫 번째 서류 ID를 사용
            const documentsResponse = await request(app.getHttpServer())
                .get(`/api/admin/verification/${breederId}/documents`)
                .set('Authorization', `Bearer ${adminToken}`);

            if (documentsResponse.body.item.documents.length > 0) {
                const documentId = documentsResponse.body.item.documents[0].id;

                await request(app.getHttpServer())
                    .put(`/api/admin/verification/${breederId}/documents/${documentId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        status: 'approved',
                        reviewNotes: '서류가 명확하고 모든 정보가 확인되었습니다.',
                        reviewedBy: 'Test Admin',
                        reviewedAt: new Date().toISOString(),
                    })
                    .expect(200)
                    .expect((res: any) => {
                        expect(res.body.success).toBe(true);
                        expect(res.body.item.status).toBe('approved');
                        expect(res.body.item.reviewNotes).toBe('서류가 명확하고 모든 정보가 확인되었습니다.');
                        expect(res.body.item.reviewedBy).toBe('Test Admin');
                    });
            }
        });

        it('POST /api/admin/verification/:breederId/documents/request - 추가 서류 요청', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .post(`/api/admin/verification/${breederId}/documents/request`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    requestedDocuments: [
                        {
                            type: 'veterinary_certificate',
                            description: '수의사 건강 검진 증명서 (최근 3개월 이내)',
                            required: true,
                        },
                        {
                            type: 'facility_expansion_plan',
                            description: '시설 확장 계획서',
                            required: false,
                        },
                    ],
                    message: '추가 서류 제출을 요청합니다.',
                    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.requestedDocuments).toHaveLength(2);
                    expect(res.body.item.deadline).toBeDefined();
                    expect(res.body.message).toContain('추가 서류 요청이 전송되었습니다');
                });
        });
    });

    describe('Verification History and Statistics', () => {
        it('GET /api/admin/verification/history - 인증 처리 내역 조회', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/verification/history')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    page: 1,
                    limit: 20,
                    status: 'all',
                    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    dateTo: new Date().toISOString().split('T')[0],
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(Array.isArray(res.body.item.verifications)).toBe(true);
                    expect(res.body.item.pageInfo).toBeDefined();
                    expect(res.body.item.statistics).toBeDefined();

                    // 통계 정보 확인
                    const stats = res.body.item.statistics;
                    expect(stats).toHaveProperty('totalProcessed');
                    expect(stats).toHaveProperty('approved');
                    expect(stats).toHaveProperty('rejected');
                    expect(stats).toHaveProperty('pending');
                    expect(stats).toHaveProperty('approvalRate');
                });
        });

        it('GET /api/admin/verification/stats - 인증 통계 조회', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/verification/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    period: 'month',
                    groupBy: 'day',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item).toHaveProperty('overview');
                    expect(res.body.item).toHaveProperty('trends');
                    expect(res.body.item).toHaveProperty('topReasons');

                    const overview = res.body.item.overview;
                    expect(overview).toHaveProperty('totalApplications');
                    expect(overview).toHaveProperty('approvalRate');
                    expect(overview).toHaveProperty('averageProcessingTime');
                    expect(overview).toHaveProperty('pendingCount');
                });
        });

        it('GET /api/admin/verification/performance - 관리자 처리 성과 조회', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/verification/performance')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    adminId: 'self',
                    period: 'week',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item).toHaveProperty('processedCount');
                    expect(res.body.item).toHaveProperty('approvalRate');
                    expect(res.body.item).toHaveProperty('averageProcessingTime');
                    expect(res.body.item).toHaveProperty('qualityScore');
                });
        });
    });

    describe('Input Validation and Error Handling', () => {
        it('PUT /api/admin/verification/:breederId - 유효하지 않은 브리더 ID', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .put('/api/admin/verification/invalid-id')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'approved',
                    message: 'Test message',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('올바르지 않은 브리더 ID 형식입니다');
                });
        });

        it('PUT /api/admin/verification/:breederId - 존재하지 않는 브리더', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .put('/api/admin/verification/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'approved',
                    message: 'Test message',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('존재하지 않는 브리더입니다');
                });
        });

        it('PUT /api/admin/verification/:breederId - 유효하지 않은 상태 값', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .put(`/api/admin/verification/${breederId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'invalid_status',
                    message: 'Test message',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('유효하지 않은 인증 상태입니다');
                });
        });

        it('PUT /api/admin/verification/:breederId - 메시지 누락', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .put(`/api/admin/verification/${breederId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'approved',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('인증 처리 메시지는 필수 입력 항목입니다');
                });
        });

        it('PUT /api/admin/verification/:breederId - 이미 처리된 인증 재처리 시도', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            // 이미 승인된 브리더에 대해 다시 처리 시도
            await request(app.getHttpServer())
                .put(`/api/admin/verification/${breederId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'rejected',
                    message: 'Test rejection',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('이미 처리된 인증입니다');
                });
        });
    });

    describe('Access Control and Security', () => {
        it('모든 인증 관리 API - 인증 없는 접근 거부', async () => {
            const endpoints = [
                { method: 'get', path: '/api/admin/verification/pending' },
                { method: 'put', path: `/api/admin/verification/${breederId}` },
                { method: 'get', path: `/api/admin/verification/${breederId}/documents` },
                { method: 'get', path: '/api/admin/verification/history' },
                { method: 'get', path: '/api/admin/verification/stats' },
            ];

            for (const endpoint of endpoints) {
                await request(app.getHttpServer())[endpoint.method](endpoint.path).expect(401);
            }
        });

        it('모든 인증 관리 API - 브리더 권한 접근 거부', async () => {
            const endpoints = [
                { method: 'get', path: '/api/admin/verification/pending' },
                { method: 'put', path: `/api/admin/verification/${breederId}` },
                { method: 'get', path: '/api/admin/verification/history' },
            ];

            for (const endpoint of endpoints) {
                await request(app.getHttpServer())
                    [endpoint.method](endpoint.path)
                    .set('Authorization', `Bearer ${breederToken}`)
                    .expect(403)
                    .expect((res: any) => {
                        expect(res.body.message).toContain('관리자만 접근할 수 있습니다');
                    });
            }
        });

        it('모든 인증 관리 API - 입양자 권한 접근 거부', async () => {
            const endpoints = [
                { method: 'get', path: '/api/admin/verification/pending' },
                { method: 'put', path: `/api/admin/verification/${breederId}` },
            ];

            for (const endpoint of endpoints) {
                await request(app.getHttpServer())
                    [endpoint.method](endpoint.path)
                    .set('Authorization', `Bearer ${adopterToken}`)
                    .expect(403)
                    .expect((res: any) => {
                        expect(res.body.message).toContain('관리자만 접근할 수 있습니다');
                    });
            }
        });
    });

    describe('Response Data Structure Validation', () => {
        it('GET /api/admin/verification/pending - 응답 구조 완전성 검증', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/verification/pending')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body).toHaveProperty('success');
                    expect(res.body).toHaveProperty('item');
                    expect(res.body).toHaveProperty('timestamp');
                    expect(res.body.success).toBe(true);

                    const data = res.body.item;
                    expect(data).toHaveProperty('breeders');
                    expect(data).toHaveProperty('pageInfo');
                    expect(Array.isArray(data.breeders)).toBe(true);

                    // 페이지네이션 정보 검증
                    expect(data.pageInfo).toHaveProperty('currentPage');
                    expect(data.pageInfo).toHaveProperty('pageSize');
                    expect(data.pageInfo).toHaveProperty('totalItems');
                    expect(data.pageInfo).toHaveProperty('totalPages');
                    expect(data.pageInfo).toHaveProperty('hasNextPage');
                    expect(data.pageInfo).toHaveProperty('hasPrevPage');
                });
        });

        it('PUT /api/admin/verification/:breederId - 승인 응답 구조 검증', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            // 새로운 브리더 생성하여 테스트
            const testBreederResponse = await request(app.getHttpServer())
                .post('/api/auth/register/breeder')
                .send({
                    email: `structure-test-${Date.now()}@test.com`,
                    password: 'testpassword123',
                    name: 'Structure Test Breeder',
                    phone: '010-9999-9999',
                    businessNumber: `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 90000) + 10000}`,
                    businessName: 'Structure Test Farm',
                });

            const testBreederId = testBreederResponse.body.user.id;

            await request(app.getHttpServer())
                .put(`/api/admin/verification/${testBreederId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'approved',
                    message: '구조 테스트용 승인',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body).toHaveProperty('item');
                    expect(res.body).toHaveProperty('message');
                    expect(res.body).toHaveProperty('timestamp');

                    const verification = res.body.item.verification;
                    expect(verification).toHaveProperty('status');
                    expect(verification).toHaveProperty('approvedAt');
                    expect(verification).toHaveProperty('adminMessage');
                    expect(verification.status).toBe('approved');
                    expect(verification.approvedAt).toBeDefined();
                });
        });
    });
});
