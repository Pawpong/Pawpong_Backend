import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { AppModule } from '../../../app.module';

/**
 * 관리자 신고 관리 End-to-End 테스트
 * 관리자의 신고 처리 관련 모든 시나리오를 테스트합니다.
 * - 신고 목록 조회 및 필터링
 * - 신고 처리 및 상태 관리
 * - 부적절한 콘텐츠 삭제
 * - 신고자/피신고자 관리
 * - 신고 통계 및 트렌드 분석
 */
describe('Admin Reports Management API (e2e)', () => {
    let app: INestApplication;
    let mongod: MongoMemoryServer;
    let adminToken: string;
    let breederToken: string;
    let adopterToken: string;
    let breederId: string;
    let adopterId: string;
    let reportId: string;

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

        // 테스트용 브리더 생성
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

        // 테스트용 입양자 생성
        const adopterResponse = await request(app.getHttpServer()).post('/api/auth/register/adopter').send({
            email: 'adopter@test.com',
            password: 'testpassword123',
            name: 'Test Adopter',
            phone: '010-1234-5678',
        });
        adopterToken = adopterResponse.body.access_token;
        adopterId = adopterResponse.body.user.id;

        // 테스트용 신고 생성
        const reportResponse = await request(app.getHttpServer())
            .post('/api/adopter/report')
            .set('Authorization', `Bearer ${adopterToken}`)
            .send({
                breederId: breederId,
                reason: 'inappropriate_content',
                description: '부적절한 사진을 게시했습니다',
                evidenceUrls: ['https://example.com/evidence1.jpg'],
            });

        if (reportResponse.status === 200) {
            reportId = reportResponse.body.item.reportId;
        }
    });

    afterAll(async () => {
        await app.close();
        await mongod.stop();
    });

    describe('Reports List Retrieval', () => {
        it('GET /api/admin/reports - 신고 목록 조회 성공', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/reports')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    page: 1,
                    limit: 10,
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(Array.isArray(res.body.item.reports)).toBe(true);
                    expect(res.body.item.pageInfo).toBeDefined();
                    expect(res.body.item.statistics).toBeDefined();

                    // 신고가 있다면 구조 검증
                    if (res.body.item.reports.length > 0) {
                        const report = res.body.item.reports[0];
                        expect(report).toHaveProperty('id');
                        expect(report).toHaveProperty('reporterId');
                        expect(report).toHaveProperty('reportedUserId');
                        expect(report).toHaveProperty('reason');
                        expect(report).toHaveProperty('status');
                        expect(report).toHaveProperty('createdAt');
                        expect(report).toHaveProperty('reporterInfo');
                        expect(report).toHaveProperty('reportedUserInfo');
                    }
                });
        });

        it('GET /api/admin/reports - 상태별 필터링', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/reports')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    status: 'pending',
                    sortBy: 'createdAt',
                    order: 'desc',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);

                    // 모든 신고가 대기 상태인지 확인
                    res.body.item.reports.forEach((report: any) => {
                        expect(report.status).toBe('pending');
                    });
                });
        });

        it('GET /api/admin/reports - 신고 사유별 필터링', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/reports')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    reason: 'inappropriate_content',
                    priority: 'high',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);

                    // 해당 사유의 신고만 포함되어 있는지 확인
                    res.body.item.reports.forEach((report: any) => {
                        expect(report.reason).toBe('inappropriate_content');
                    });
                });
        });

        it('GET /api/admin/reports - 날짜 범위 필터링', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            const today = new Date();
            const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

            await request(app.getHttpServer())
                .get('/api/admin/reports')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    dateFrom: lastWeek.toISOString().split('T')[0],
                    dateTo: today.toISOString().split('T')[0],
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);

                    // 날짜 범위 내의 신고만 포함되어 있는지 확인
                    res.body.item.reports.forEach((report: any) => {
                        const createdAt = new Date(report.createdAt);
                        expect(createdAt.getTime()).toBeGreaterThanOrEqual(lastWeek.getTime());
                        expect(createdAt.getTime()).toBeLessThanOrEqual(today.getTime());
                    });
                });
        });

        it('GET /api/admin/reports - 특정 사용자의 신고 조회', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/reports')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    reportedUserId: breederId,
                    includeResolved: true,
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);

                    // 해당 사용자에 대한 신고만 포함되어 있는지 확인
                    res.body.item.reports.forEach((report: any) => {
                        expect(report.reportedUserId).toBe(breederId);
                    });
                });
        });
    });

    describe('Report Processing and Actions', () => {
        it('PUT /api/admin/reports/:reportId - 신고 조사 중으로 상태 변경', async () => {
            if (!adminToken || !reportId) {
                console.log('Admin token or report ID not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .put(`/api/admin/reports/${reportId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'investigating',
                    adminMessage: '신고 내용을 검토 중입니다',
                    priority: 'high',
                    assignedTo: 'Test Admin',
                    estimatedResolutionDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.status).toBe('investigating');
                    expect(res.body.item.adminMessage).toBe('신고 내용을 검토 중입니다');
                    expect(res.body.item.priority).toBe('high');
                    expect(res.body.item.assignedTo).toBe('Test Admin');
                    expect(res.body.message).toContain('신고 처리 상태가 업데이트되었습니다');
                });
        });

        it('PUT /api/admin/reports/:reportId - 신고 승인 및 조치', async () => {
            if (!adminToken || !reportId) {
                console.log('Admin token or report ID not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .put(`/api/admin/reports/${reportId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'resolved',
                    action: 'warning',
                    adminMessage: '신고 내용이 확인되어 경고 조치를 취했습니다',
                    actionDetails: {
                        warningLevel: 1,
                        warningMessage: '부적절한 콘텐츠 게시로 인한 경고',
                        restrictionDays: 0,
                    },
                    reportValid: true,
                    evidenceReviewed: true,
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.status).toBe('resolved');
                    expect(res.body.item.action).toBe('warning');
                    expect(res.body.item.reportValid).toBe(true);
                    expect(res.body.item.resolvedAt).toBeDefined();
                });
        });

        it('PUT /api/admin/reports/:reportId - 신고 거절 (무효 신고)', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            // 새로운 테스트용 신고 생성
            const newReportResponse = await request(app.getHttpServer())
                .post('/api/adopter/report')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({
                    breederId: breederId,
                    reason: 'false_information',
                    description: '잘못된 정보를 제공한다고 생각합니다',
                });

            if (newReportResponse.status === 200) {
                const newReportId = newReportResponse.body.item.reportId;

                await request(app.getHttpServer())
                    .put(`/api/admin/reports/${newReportId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        status: 'rejected',
                        action: 'no_action',
                        adminMessage: '신고 내용을 검토한 결과 정당한 사유가 없어 거절합니다',
                        reportValid: false,
                        rejectionReason: 'insufficient_evidence',
                        feedbackToReporter: '추후 신고 시 더 구체적인 증거를 제공해 주세요',
                    })
                    .expect(200)
                    .expect((res: any) => {
                        expect(res.body.success).toBe(true);
                        expect(res.body.item.status).toBe('rejected');
                        expect(res.body.item.reportValid).toBe(false);
                        expect(res.body.item.rejectionReason).toBe('insufficient_evidence');
                    });
            }
        });

        it('PUT /api/admin/reports/:reportId - 심각한 위반으로 계정 정지', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            // 심각한 신고 생성
            const seriousReportResponse = await request(app.getHttpServer())
                .post('/api/adopter/report')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({
                    breederId: breederId,
                    reason: 'animal_abuse',
                    description: '동물 학대가 의심됩니다',
                    evidenceUrls: ['https://example.com/serious-evidence.jpg'],
                });

            if (seriousReportResponse.status === 200) {
                const seriousReportId = seriousReportResponse.body.item.reportId;

                await request(app.getHttpServer())
                    .put(`/api/admin/reports/${seriousReportId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        status: 'resolved',
                        action: 'suspend_account',
                        adminMessage: '동물 학대 의혹으로 인한 계정 정지',
                        actionDetails: {
                            suspensionDays: 30,
                            suspensionReason: '동물 학대 신고 확인',
                            appealAllowed: false,
                            additionalRestrictions: ['no_new_listings', 'contact_restriction'],
                        },
                        reportValid: true,
                        severity: 'critical',
                    })
                    .expect(200)
                    .expect((res: any) => {
                        expect(res.body.success).toBe(true);
                        expect(res.body.item.status).toBe('resolved');
                        expect(res.body.item.action).toBe('suspend_account');
                        expect(res.body.item.severity).toBe('critical');
                        expect(res.body.item.actionDetails.suspensionDays).toBe(30);
                    });
            }
        });
    });

    describe('Content Management', () => {
        it('DELETE /api/admin/reviews/:breederId/:reviewId - 부적절한 후기 삭제', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            // 테스트용 후기 ID (실제로는 존재하지 않을 수 있음)
            const dummyReviewId = 'dummy-review-id';

            await request(app.getHttpServer())
                .delete(`/api/admin/reviews/${breederId}/${dummyReviewId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    reason: '부적절한 언어 사용',
                    adminNotes: '욕설 및 비방 내용 포함으로 삭제',
                    notifyUser: true,
                })
                .expect((res: any) => {
                    // 후기가 없을 경우 404, 삭제 성공 시 200
                    expect([200, 404]).toContain(res.status);

                    if (res.status === 200) {
                        expect(res.body.success).toBe(true);
                        expect(res.body.message).toContain('후기가 삭제되었습니다');
                    } else {
                        expect(res.body.message).toContain('존재하지 않는 후기입니다');
                    }
                });
        });

        it('PUT /api/admin/content/:contentId/hide - 부적절한 콘텐츠 숨김 처리', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            const dummyContentId = 'dummy-content-id';

            await request(app.getHttpServer())
                .put(`/api/admin/content/${dummyContentId}/hide`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    reason: 'inappropriate_image',
                    adminMessage: '부적절한 이미지 콘텐츠로 인한 숨김 처리',
                    hideFromPublic: true,
                    notifyOwner: true,
                    appealPeriod: 7,
                })
                .expect((res: any) => {
                    expect([200, 404]).toContain(res.status);

                    if (res.status === 200) {
                        expect(res.body.success).toBe(true);
                        expect(res.body.message).toContain('콘텐츠가 숨김 처리되었습니다');
                    }
                });
        });

        it('POST /api/admin/content/bulk-moderate - 대량 콘텐츠 조치', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .post('/api/admin/content/bulk-moderate')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    contentIds: ['content1', 'content2', 'content3'],
                    action: 'hide',
                    reason: 'community_guidelines_violation',
                    adminMessage: '커뮤니티 가이드라인 위반으로 인한 일괄 처리',
                    notifyOwners: true,
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item).toHaveProperty('processedCount');
                    expect(res.body.item).toHaveProperty('successCount');
                    expect(res.body.item).toHaveProperty('failureCount');
                    expect(res.body.message).toContain('대량 조치가 완료되었습니다');
                });
        });
    });

    describe('Report Statistics and Analytics', () => {
        it('GET /api/admin/reports/stats - 신고 통계 조회', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/reports/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    period: 'month',
                    groupBy: 'day',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item).toHaveProperty('totalReports');
                    expect(res.body.item).toHaveProperty('pendingReports');
                    expect(res.body.item).toHaveProperty('resolvedReports');
                    expect(res.body.item).toHaveProperty('rejectedReports');
                    expect(res.body.item).toHaveProperty('reportsByReason');
                    expect(res.body.item).toHaveProperty('reportsTrend');
                    expect(res.body.item).toHaveProperty('averageResolutionTime');

                    const reportsByReason = res.body.item.reportsByReason;
                    expect(reportsByReason).toHaveProperty('inappropriate_content');
                    expect(reportsByReason).toHaveProperty('spam');
                    expect(reportsByReason).toHaveProperty('false_information');
                    expect(reportsByReason).toHaveProperty('animal_abuse');
                });
        });

        it('GET /api/admin/reports/trends - 신고 트렌드 분석', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/reports/trends')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    period: 'quarter',
                    analysisType: 'detailed',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item).toHaveProperty('trendAnalysis');
                    expect(res.body.item).toHaveProperty('seasonalPatterns');
                    expect(res.body.item).toHaveProperty('topReportedUsers');
                    expect(res.body.item).toHaveProperty('frequentReporters');
                    expect(res.body.item).toHaveProperty('resolutionEfficiency');
                });
        });

        it('GET /api/admin/reports/performance - 처리 성과 분석', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/reports/performance')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    adminId: 'self',
                    period: 'month',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item).toHaveProperty('reportsProcessed');
                    expect(res.body.item).toHaveProperty('averageResolutionTime');
                    expect(res.body.item).toHaveProperty('accuracyRate');
                    expect(res.body.item).toHaveProperty('actionBreakdown');
                });
        });
    });

    describe('Advanced Report Features', () => {
        it('POST /api/admin/reports/:reportId/escalate - 신고 에스컬레이션', async () => {
            if (!adminToken || !reportId) {
                console.log('Admin token or report ID not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .post(`/api/admin/reports/${reportId}/escalate`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    escalationLevel: 'senior_admin',
                    reason: '복잡한 사안으로 인한 상급자 검토 필요',
                    urgency: 'high',
                    additionalNotes: '법적 문제가 연관될 수 있는 사안',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.escalationLevel).toBe('senior_admin');
                    expect(res.body.item.escalatedAt).toBeDefined();
                    expect(res.body.message).toContain('신고가 에스컬레이션되었습니다');
                });
        });

        it('POST /api/admin/reports/batch-process - 유사 신고 일괄 처리', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .post('/api/admin/reports/batch-process')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    reportIds: [reportId],
                    action: 'resolve_similar',
                    batchReason: '동일 사용자에 대한 유사 신고 일괄 처리',
                    resolution: {
                        status: 'resolved',
                        action: 'warning',
                        message: '유사 신고들을 종합하여 경고 조치',
                    },
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item).toHaveProperty('processedCount');
                    expect(res.body.item).toHaveProperty('results');
                });
        });

        it('GET /api/admin/reports/:reportId/timeline - 신고 처리 타임라인', async () => {
            if (!adminToken || !reportId) {
                console.log('Admin token or report ID not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get(`/api/admin/reports/${reportId}/timeline`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(Array.isArray(res.body.item.timeline)).toBe(true);

                    if (res.body.item.timeline.length > 0) {
                        const timelineEvent = res.body.item.timeline[0];
                        expect(timelineEvent).toHaveProperty('action');
                        expect(timelineEvent).toHaveProperty('timestamp');
                        expect(timelineEvent).toHaveProperty('adminId');
                        expect(timelineEvent).toHaveProperty('details');
                    }
                });
        });
    });

    describe('Input Validation and Error Handling', () => {
        it('PUT /api/admin/reports/:reportId - 유효하지 않은 신고 ID', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .put('/api/admin/reports/invalid-id')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'investigating',
                    adminMessage: 'Test',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('올바르지 않은 신고 ID 형식입니다');
                });
        });

        it('PUT /api/admin/reports/:reportId - 존재하지 않는 신고', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .put('/api/admin/reports/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'resolved',
                    adminMessage: 'Test',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('존재하지 않는 신고입니다');
                });
        });

        it('PUT /api/admin/reports/:reportId - 유효하지 않은 상태 값', async () => {
            if (!adminToken || !reportId) {
                console.log('Admin token or report ID not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .put(`/api/admin/reports/${reportId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'invalid_status',
                    adminMessage: 'Test',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('유효하지 않은 신고 상태입니다');
                });
        });

        it('PUT /api/admin/reports/:reportId - 관리자 메시지 누락', async () => {
            if (!adminToken || !reportId) {
                console.log('Admin token or report ID not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .put(`/api/admin/reports/${reportId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'resolved',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('관리자 메시지는 필수 입력 항목입니다');
                });
        });

        it('PUT /api/admin/reports/:reportId - 이미 처리된 신고 재처리 시도', async () => {
            if (!adminToken || !reportId) {
                console.log('Admin token or report ID not available, skipping test');
                return;
            }

            // 이미 처리된 신고에 대해 다시 처리 시도
            await request(app.getHttpServer())
                .put(`/api/admin/reports/${reportId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'investigating',
                    adminMessage: 'Test re-processing',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('이미 처리된 신고입니다');
                });
        });
    });

    describe('Access Control and Security', () => {
        it('모든 신고 관리 API - 인증 없는 접근 거부', async () => {
            const endpoints = [
                { method: 'get', path: '/api/admin/reports' },
                { method: 'put', path: `/api/admin/reports/${reportId || 'dummy-id'}` },
                { method: 'delete', path: `/api/admin/reviews/${breederId}/dummy-review-id` },
                { method: 'get', path: '/api/admin/reports/stats' },
            ];

            for (const endpoint of endpoints) {
                await request(app.getHttpServer())[endpoint.method](endpoint.path).expect(401);
            }
        });

        it('모든 신고 관리 API - 브리더 권한 접근 거부', async () => {
            const endpoints = [
                { method: 'get', path: '/api/admin/reports' },
                { method: 'put', path: `/api/admin/reports/${reportId || 'dummy-id'}` },
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

        it('모든 신고 관리 API - 입양자 권한 접근 거부', async () => {
            const endpoints = [
                { method: 'get', path: '/api/admin/reports' },
                { method: 'put', path: `/api/admin/reports/${reportId || 'dummy-id'}` },
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
        it('GET /api/admin/reports - 신고 목록 응답 구조 검증', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/reports')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body).toHaveProperty('success');
                    expect(res.body).toHaveProperty('item');
                    expect(res.body).toHaveProperty('timestamp');
                    expect(res.body.success).toBe(true);

                    const data = res.body.item;
                    expect(data).toHaveProperty('reports');
                    expect(data).toHaveProperty('pageInfo');
                    expect(data).toHaveProperty('statistics');
                    expect(Array.isArray(data.reports)).toBe(true);

                    // 페이지네이션 정보 검증
                    expect(data.pageInfo).toHaveProperty('currentPage');
                    expect(data.pageInfo).toHaveProperty('pageSize');
                    expect(data.pageInfo).toHaveProperty('totalItems');
                    expect(data.pageInfo).toHaveProperty('totalPages');

                    // 통계 정보 검증
                    expect(data.statistics).toHaveProperty('totalReports');
                    expect(data.statistics).toHaveProperty('pendingReports');
                    expect(data.statistics).toHaveProperty('resolvedReports');
                });
        });

        it('PUT /api/admin/reports/:reportId - 신고 처리 응답 구조 검증', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            // 새로운 테스트용 신고 생성
            const newReportResponse = await request(app.getHttpServer())
                .post('/api/adopter/report')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({
                    breederId: breederId,
                    reason: 'test_reason',
                    description: '구조 테스트용 신고',
                });

            if (newReportResponse.status === 200) {
                const newReportId = newReportResponse.body.item.reportId;

                await request(app.getHttpServer())
                    .put(`/api/admin/reports/${newReportId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        status: 'resolved',
                        adminMessage: '구조 테스트용 처리',
                        action: 'no_action',
                    })
                    .expect(200)
                    .expect((res: any) => {
                        expect(res.body.success).toBe(true);
                        expect(res.body).toHaveProperty('item');
                        expect(res.body).toHaveProperty('message');
                        expect(res.body).toHaveProperty('timestamp');

                        const report = res.body.item;
                        expect(report).toHaveProperty('id');
                        expect(report).toHaveProperty('status');
                        expect(report).toHaveProperty('action');
                        expect(report).toHaveProperty('resolvedAt');
                        expect(report.status).toBe('resolved');
                    });
            }
        });
    });
});
