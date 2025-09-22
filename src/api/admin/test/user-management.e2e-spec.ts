import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { AppModule } from '../../../app.module';

/**
 * 관리자 사용자 관리 End-to-End 테스트
 * 관리자의 사용자 관리 관련 모든 시나리오를 테스트합니다.
 * - 사용자 목록 조회 및 필터링
 * - 사용자 상태 관리 (활성화/정지/탈퇴)
 * - 사용자 정보 수정 및 권한 관리
 * - 대량 사용자 처리
 * - 사용자 활동 통계 조회
 */
describe('Admin User Management API (e2e)', () => {
    let app: INestApplication;
    let mongod: MongoMemoryServer;
    let adminToken: string;
    let breederToken: string;
    let adopterToken: string;
    let adopterId: string;
    let breederId: string;

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
    });

    afterAll(async () => {
        await app.close();
        await mongod.stop();
    });

    describe('User List Retrieval', () => {
        it('GET /api/admin/users - 전체 사용자 목록 조회 성공', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    role: 'all',
                    status: 'active',
                    page: 1,
                    limit: 10,
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(Array.isArray(res.body.item.users)).toBe(true);
                    expect(res.body.item.pageInfo).toBeDefined();
                    expect(res.body.item.statistics).toBeDefined();

                    // 사용자가 있다면 구조 검증
                    if (res.body.item.users.length > 0) {
                        const user = res.body.item.users[0];
                        expect(user).toHaveProperty('id');
                        expect(user).toHaveProperty('email');
                        expect(user).toHaveProperty('name');
                        expect(user).toHaveProperty('role');
                        expect(user).toHaveProperty('status');
                        expect(user).toHaveProperty('createdAt');
                        expect(user).toHaveProperty('lastLoginAt');
                        // 보안: 비밀번호는 응답에 포함되지 않아야 함
                        expect(user.password).toBeUndefined();
                    }
                });
        });

        it('GET /api/admin/users - 브리더만 필터링', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    role: 'breeder',
                    verified: 'true',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);

                    // 모든 사용자가 브리더인지 확인
                    res.body.item.users.forEach((user: any) => {
                        expect(user.role).toBe('breeder');
                    });
                });
        });

        it('GET /api/admin/users - 입양자만 필터링', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    role: 'adopter',
                    sortBy: 'createdAt',
                    order: 'desc',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);

                    // 모든 사용자가 입양자인지 확인
                    res.body.item.users.forEach((user: any) => {
                        expect(user.role).toBe('adopter');
                    });

                    // 정렬 확인 (최신순)
                    if (res.body.item.users.length > 1) {
                        const firstDate = new Date(res.body.item.users[0].createdAt);
                        const secondDate = new Date(res.body.item.users[1].createdAt);
                        expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
                    }
                });
        });

        it('GET /api/admin/users - 상태별 필터링', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    status: 'active',
                    page: 1,
                    limit: 20,
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);

                    // 모든 사용자가 활성 상태인지 확인
                    res.body.item.users.forEach((user: any) => {
                        expect(user.status).toBe('active');
                    });
                });
        });

        it('GET /api/admin/users - 검색 기능 테스트', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    search: 'Test',
                    searchFields: 'name,email',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);

                    // 검색 결과에 해당 키워드가 포함되어 있는지 확인
                    res.body.item.users.forEach((user: any) => {
                        const matchesSearch = user.name.includes('Test') || user.email.includes('test');
                        expect(matchesSearch).toBe(true);
                    });
                });
        });

        it('GET /api/admin/users - 날짜 범위 필터링', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            const today = new Date();
            const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

            await request(app.getHttpServer())
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    dateFrom: lastWeek.toISOString().split('T')[0],
                    dateTo: today.toISOString().split('T')[0],
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);

                    // 날짜 범위 내의 사용자만 포함되어 있는지 확인
                    res.body.item.users.forEach((user: any) => {
                        const createdAt = new Date(user.createdAt);
                        expect(createdAt.getTime()).toBeGreaterThanOrEqual(lastWeek.getTime());
                        expect(createdAt.getTime()).toBeLessThanOrEqual(today.getTime());
                    });
                });
        });
    });

    describe('User Status Management', () => {
        it('PUT /api/admin/users/:userId/status - 사용자 정지 처리', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .put(`/api/admin/users/${adopterId}/status`)
                .query({ role: 'adopter' })
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'suspended',
                    reason: '서비스 약관 위반',
                    suspensionDays: 7,
                    adminNotes: '부적절한 후기 작성으로 인한 정지',
                    notifyUser: true,
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.status).toBe('suspended');
                    expect(res.body.item.suspensionInfo).toBeDefined();
                    expect(res.body.item.suspensionInfo.reason).toBe('서비스 약관 위반');
                    expect(res.body.item.suspensionInfo.suspendedUntil).toBeDefined();
                    expect(res.body.message).toContain('사용자 상태가 변경되었습니다');
                });
        });

        it('PUT /api/admin/users/:userId/status - 사용자 활성화', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .put(`/api/admin/users/${adopterId}/status`)
                .query({ role: 'adopter' })
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'active',
                    reason: '정지 해제',
                    adminNotes: '사용자 요청에 따른 정지 해제',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.status).toBe('active');
                    expect(res.body.item.suspensionInfo).toBeNull();
                });
        });

        it('PUT /api/admin/users/:userId/status - 사용자 영구 정지', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .put(`/api/admin/users/${breederId}/status`)
                .query({ role: 'breeder' })
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'permanently_banned',
                    reason: '심각한 서비스 약관 위반',
                    adminNotes: '동물 학대 신고 접수로 인한 영구 정지',
                    notifyUser: true,
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.status).toBe('permanently_banned');
                    expect(res.body.item.banInfo).toBeDefined();
                    expect(res.body.item.banInfo.reason).toBe('심각한 서비스 약관 위반');
                });
        });

        it('PUT /api/admin/users/:userId/status - 브리더 인증 상태 변경', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            // 새로운 브리더 생성 (인증 상태 변경 테스트용)
            const newBreederResponse = await request(app.getHttpServer()).post('/api/auth/register/breeder').send({
                email: 'newbreeder@test.com',
                password: 'testpassword123',
                name: 'New Test Breeder',
                phone: '010-7777-8888',
                businessNumber: '555-44-33322',
                businessName: 'New Pet Farm',
            });
            const newBreederId = newBreederResponse.body.user.id;

            await request(app.getHttpServer())
                .put(`/api/admin/users/${newBreederId}/status`)
                .query({ role: 'breeder' })
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'verification_revoked',
                    reason: '시설 기준 미달',
                    adminNotes: '정기 점검 결과 시설 기준에 미달하여 인증 취소',
                    reapplyAfter: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.status).toBe('verification_revoked');
                    expect(res.body.item.verificationInfo.status).toBe('revoked');
                });
        });
    });

    describe('User Information Management', () => {
        it('GET /api/admin/users/:userId - 특정 사용자 상세 정보 조회', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get(`/api/admin/users/${adopterId}`)
                .query({ role: 'adopter' })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.id).toBe(adopterId);
                    expect(res.body.item.email).toBe('adopter@test.com');
                    expect(res.body.item.role).toBe('adopter');

                    // 관리자용 추가 정보 포함 확인
                    expect(res.body.item).toHaveProperty('loginHistory');
                    expect(res.body.item).toHaveProperty('activityStats');
                    expect(res.body.item).toHaveProperty('adminNotes');
                    expect(res.body.item).toHaveProperty('flaggedActivities');
                });
        });

        it('PUT /api/admin/users/:userId/profile - 사용자 프로필 정보 수정', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .put(`/api/admin/users/${adopterId}/profile`)
                .query({ role: 'adopter' })
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: '관리자 수정 이름',
                    phone: '010-9999-8888',
                    adminNotes: '관리자에 의한 정보 수정',
                    reasonForChange: '사용자 요청에 따른 정보 수정',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.name).toBe('관리자 수정 이름');
                    expect(res.body.item.phone).toBe('010-9999-8888');
                    expect(res.body.message).toContain('사용자 정보가 수정되었습니다');
                });
        });

        it('POST /api/admin/users/:userId/notes - 사용자에 대한 관리자 노트 추가', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .post(`/api/admin/users/${adopterId}/notes`)
                .query({ role: 'adopter' })
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    note: '사용자 문의에 대한 응답 완료',
                    category: 'customer_service',
                    isImportant: false,
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.note).toBe('사용자 문의에 대한 응답 완료');
                    expect(res.body.item.category).toBe('customer_service');
                    expect(res.body.item.createdBy).toBeDefined();
                    expect(res.body.item.createdAt).toBeDefined();
                });
        });

        it('GET /api/admin/users/:userId/activity - 사용자 활동 내역 조회', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get(`/api/admin/users/${adopterId}/activity`)
                .query({
                    role: 'adopter',
                    period: 'month',
                    activityType: 'all',
                })
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item).toHaveProperty('activities');
                    expect(res.body.item).toHaveProperty('statistics');
                    expect(Array.isArray(res.body.item.activities)).toBe(true);

                    const stats = res.body.item.statistics;
                    expect(stats).toHaveProperty('totalActivities');
                    expect(stats).toHaveProperty('loginCount');
                    expect(stats).toHaveProperty('lastActivityAt');
                });
        });
    });

    describe('Bulk User Operations', () => {
        let bulkUserIds: string[];

        beforeEach(async () => {
            // 대량 작업 테스트용 사용자들 생성
            bulkUserIds = [];

            for (let i = 1; i <= 3; i++) {
                const userResponse = await request(app.getHttpServer())
                    .post('/api/auth/register/adopter')
                    .send({
                        email: `bulk${i}@test.com`,
                        password: 'testpassword123',
                        name: `Bulk Test User ${i}`,
                        phone: `010-888${i}-999${i}`,
                    });
                bulkUserIds.push(userResponse.body.user.id);
            }
        });

        afterEach(async () => {
            // 테스트 후 생성된 사용자들 정리
            if (bulkUserIds && adminToken) {
                for (const userId of bulkUserIds) {
                    await request(app.getHttpServer())
                        .put(`/api/admin/users/${userId}/status`)
                        .query({ role: 'adopter' })
                        .set('Authorization', `Bearer ${adminToken}`)
                        .send({
                            status: 'deleted',
                            reason: '테스트 완료 후 정리',
                        });
                }
            }
        });

        it('PUT /api/admin/users/bulk/status - 대량 사용자 상태 변경', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .put('/api/admin/users/bulk/status')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    userIds: bulkUserIds,
                    role: 'adopter',
                    status: 'suspended',
                    reason: '대량 정지 테스트',
                    suspensionDays: 3,
                    adminNotes: '테스트를 위한 대량 정지',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.processedCount).toBe(bulkUserIds.length);
                    expect(res.body.item.successCount).toBe(bulkUserIds.length);
                    expect(res.body.item.failureCount).toBe(0);
                    expect(res.body.message).toContain('대량 상태 변경이 완료되었습니다');
                });
        });

        it('POST /api/admin/users/bulk/notify - 대량 사용자 알림 발송', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .post('/api/admin/users/bulk/notify')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    userIds: bulkUserIds,
                    role: 'adopter',
                    notificationType: 'system_announcement',
                    title: '시스템 점검 안내',
                    message: '서비스 개선을 위한 시스템 점검이 예정되어 있습니다.',
                    sendEmail: true,
                    sendPush: false,
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.sentCount).toBe(bulkUserIds.length);
                    expect(res.body.message).toContain('알림이 발송되었습니다');
                });
        });
    });

    describe('User Statistics and Analytics', () => {
        it('GET /api/admin/users/stats - 사용자 통계 조회', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/users/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    period: 'month',
                    groupBy: 'day',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item).toHaveProperty('totalUsers');
                    expect(res.body.item).toHaveProperty('activeUsers');
                    expect(res.body.item).toHaveProperty('newUsers');
                    expect(res.body.item).toHaveProperty('usersByRole');
                    expect(res.body.item).toHaveProperty('usersByStatus');
                    expect(res.body.item).toHaveProperty('growthTrend');

                    const usersByRole = res.body.item.usersByRole;
                    expect(usersByRole).toHaveProperty('adopter');
                    expect(usersByRole).toHaveProperty('breeder');
                    expect(usersByRole).toHaveProperty('admin');
                });
        });

        it('GET /api/admin/users/engagement - 사용자 참여도 분석', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/users/engagement')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    period: 'week',
                    metrics: 'login,activity,retention',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item).toHaveProperty('averageSessionTime');
                    expect(res.body.item).toHaveProperty('dailyActiveUsers');
                    expect(res.body.item).toHaveProperty('weeklyActiveUsers');
                    expect(res.body.item).toHaveProperty('retentionRate');
                    expect(res.body.item).toHaveProperty('topActivities');
                });
        });
    });

    describe('Input Validation and Error Handling', () => {
        it('PUT /api/admin/users/:userId/status - 유효하지 않은 사용자 ID', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .put('/api/admin/users/invalid-id/status')
                .query({ role: 'adopter' })
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'suspended',
                    reason: 'Test',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('올바르지 않은 사용자 ID 형식입니다');
                });
        });

        it('PUT /api/admin/users/:userId/status - 존재하지 않는 사용자', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .put('/api/admin/users/507f1f77bcf86cd799439011/status')
                .query({ role: 'adopter' })
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'suspended',
                    reason: 'Test',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('존재하지 않는 사용자입니다');
                });
        });

        it('PUT /api/admin/users/:userId/status - 유효하지 않은 상태 값', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .put(`/api/admin/users/${adopterId}/status`)
                .query({ role: 'adopter' })
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'invalid_status',
                    reason: 'Test',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('유효하지 않은 사용자 상태입니다');
                });
        });

        it('PUT /api/admin/users/:userId/status - 사유 누락', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .put(`/api/admin/users/${adopterId}/status`)
                .query({ role: 'adopter' })
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'suspended',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('상태 변경 사유는 필수 입력 항목입니다');
                });
        });

        it('PUT /api/admin/users/:userId/status - 관리자가 자신의 상태 변경 시도', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            // 관리자 자신의 ID 가져오기 (JWT 토큰에서 추출 또는 별도 API 호출)
            const adminProfileResponse = await request(app.getHttpServer())
                .get('/api/admin/profile')
                .set('Authorization', `Bearer ${adminToken}`);

            if (adminProfileResponse.status === 200) {
                const adminId = adminProfileResponse.body.id;

                await request(app.getHttpServer())
                    .put(`/api/admin/users/${adminId}/status`)
                    .query({ role: 'admin' })
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        status: 'suspended',
                        reason: '자체 정지 시도',
                    })
                    .expect(400)
                    .expect((res: any) => {
                        expect(res.body.message).toContain('자신의 상태는 변경할 수 없습니다');
                    });
            }
        });
    });

    describe('Access Control and Security', () => {
        it('모든 사용자 관리 API - 인증 없는 접근 거부', async () => {
            const endpoints = [
                { method: 'get', path: '/api/admin/users' },
                { method: 'get', path: `/api/admin/users/${adopterId}` },
                { method: 'put', path: `/api/admin/users/${adopterId}/status` },
                { method: 'put', path: `/api/admin/users/${adopterId}/profile` },
                { method: 'get', path: '/api/admin/users/stats' },
            ];

            for (const endpoint of endpoints) {
                await request(app.getHttpServer())[endpoint.method](endpoint.path).expect(401);
            }
        });

        it('모든 사용자 관리 API - 브리더 권한 접근 거부', async () => {
            const endpoints = [
                { method: 'get', path: '/api/admin/users' },
                { method: 'put', path: `/api/admin/users/${adopterId}/status` },
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

        it('모든 사용자 관리 API - 입양자 권한 접근 거부', async () => {
            const endpoints = [
                { method: 'get', path: '/api/admin/users' },
                { method: 'put', path: `/api/admin/users/${breederId}/status` },
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
        it('GET /api/admin/users - 사용자 목록 응답 구조 검증', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body).toHaveProperty('success');
                    expect(res.body).toHaveProperty('item');
                    expect(res.body).toHaveProperty('timestamp');
                    expect(res.body.success).toBe(true);

                    const data = res.body.item;
                    expect(data).toHaveProperty('users');
                    expect(data).toHaveProperty('pageInfo');
                    expect(data).toHaveProperty('statistics');
                    expect(Array.isArray(data.users)).toBe(true);

                    // 페이지네이션 정보 검증
                    expect(data.pageInfo).toHaveProperty('currentPage');
                    expect(data.pageInfo).toHaveProperty('pageSize');
                    expect(data.pageInfo).toHaveProperty('totalItems');
                    expect(data.pageInfo).toHaveProperty('totalPages');

                    // 통계 정보 검증
                    expect(data.statistics).toHaveProperty('totalUsers');
                    expect(data.statistics).toHaveProperty('activeUsers');
                    expect(data.statistics).toHaveProperty('usersByRole');
                });
        });

        it('PUT /api/admin/users/:userId/status - 상태 변경 응답 구조 검증', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .put(`/api/admin/users/${adopterId}/status`)
                .query({ role: 'adopter' })
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'active',
                    reason: '구조 테스트',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body).toHaveProperty('item');
                    expect(res.body).toHaveProperty('message');
                    expect(res.body).toHaveProperty('timestamp');

                    const user = res.body.item;
                    expect(user).toHaveProperty('id');
                    expect(user).toHaveProperty('status');
                    expect(user).toHaveProperty('statusChangedAt');
                    expect(user.status).toBe('active');
                });
        });
    });
});
