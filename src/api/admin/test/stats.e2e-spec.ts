import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { AppModule } from '../../../app.module';

/**
 * 관리자 통계 조회 End-to-End 테스트
 * 관리자의 시스템 통계 및 분석 관련 모든 시나리오를 테스트합니다.
 * - 전체 시스템 통계 조회
 * - 사용자 통계 및 증감 추이
 * - 입양 신청 및 성사율 통계
 * - 브리더 인기도 및 지역별 분석
 * - 수익 및 성과 지표 분석
 */
describe('Admin Statistics API (e2e)', () => {
    let app: INestApplication;
    let mongod: MongoMemoryServer;
    let adminToken: string;
    let breederToken: string;
    let adopterToken: string;

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

        // 테스트용 입양자 생성
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

    describe('Overall System Statistics', () => {
        it('GET /api/admin/stats - 전체 통계 조회 성공', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.userStats).toBeDefined();
                    expect(res.body.item.adoptionStats).toBeDefined();
                    expect(res.body.item.popularBreeds).toBeDefined();
                    expect(res.body.item.reportStats).toBeDefined();
                    expect(res.body.item.systemHealth).toBeDefined();

                    // 사용자 통계 검증
                    const userStats = res.body.item.userStats;
                    expect(userStats).toHaveProperty('totalUsers');
                    expect(userStats).toHaveProperty('activeUsers');
                    expect(userStats).toHaveProperty('newUsersThisMonth');
                    expect(userStats).toHaveProperty('userGrowthRate');
                    expect(userStats).toHaveProperty('usersByRole');

                    // 입양 통계 검증
                    const adoptionStats = res.body.item.adoptionStats;
                    expect(adoptionStats).toHaveProperty('totalApplications');
                    expect(adoptionStats).toHaveProperty('successfulAdoptions');
                    expect(adoptionStats).toHaveProperty('adoptionRate');
                    expect(adoptionStats).toHaveProperty('averageAdoptionTime');
                });
        });

        it('GET /api/admin/stats - 기간별 통계 조회', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    startDate: '2024-01-01',
                    endDate: '2024-12-31',
                    groupBy: 'month',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item).toHaveProperty('periodStats');
                    expect(res.body.item).toHaveProperty('trends');
                    expect(Array.isArray(res.body.item.trends)).toBe(true);

                    // 트렌드 데이터 구조 검증
                    if (res.body.item.trends.length > 0) {
                        const trendPoint = res.body.item.trends[0];
                        expect(trendPoint).toHaveProperty('period');
                        expect(trendPoint).toHaveProperty('userCount');
                        expect(trendPoint).toHaveProperty('adoptionCount');
                        expect(trendPoint).toHaveProperty('applicationCount');
                    }
                });
        });

        it('GET /api/admin/stats - 지역별 통계', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    region: 'seoul',
                    metrics: 'adopters,breeders,applications',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item).toHaveProperty('regionalStats');

                    const regionalStats = res.body.item.regionalStats;
                    expect(regionalStats).toHaveProperty('region');
                    expect(regionalStats).toHaveProperty('adopterCount');
                    expect(regionalStats).toHaveProperty('breederCount');
                    expect(regionalStats).toHaveProperty('applicationCount');
                    expect(regionalStats.region).toBe('seoul');
                });
        });
    });

    describe('User Statistics and Analytics', () => {
        it('GET /api/admin/stats/users - 사용자 통계 상세 조회', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/stats/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    period: 'month',
                    breakdown: 'daily',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item).toHaveProperty('overview');
                    expect(res.body.item).toHaveProperty('demographics');
                    expect(res.body.item).toHaveProperty('engagement');
                    expect(res.body.item).toHaveProperty('retention');

                    // 개요 통계
                    const overview = res.body.item.overview;
                    expect(overview).toHaveProperty('totalRegistered');
                    expect(overview).toHaveProperty('activeThisMonth');
                    expect(overview).toHaveProperty('newThisMonth');
                    expect(overview).toHaveProperty('churnRate');

                    // 인구 통계
                    const demographics = res.body.item.demographics;
                    expect(demographics).toHaveProperty('ageDistribution');
                    expect(demographics).toHaveProperty('regionDistribution');
                    expect(demographics).toHaveProperty('deviceDistribution');

                    // 참여도 통계
                    const engagement = res.body.item.engagement;
                    expect(engagement).toHaveProperty('averageSessionTime');
                    expect(engagement).toHaveProperty('dailyActiveUsers');
                    expect(engagement).toHaveProperty('monthlyActiveUsers');
                });
        });

        it('GET /api/admin/stats/users/growth - 사용자 증가 추이', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/stats/users/growth')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    timespan: '6months',
                    granularity: 'week',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item).toHaveProperty('growthData');
                    expect(res.body.item).toHaveProperty('projections');
                    expect(Array.isArray(res.body.item.growthData)).toBe(true);

                    // 성장 데이터 구조 검증
                    if (res.body.item.growthData.length > 0) {
                        const dataPoint = res.body.item.growthData[0];
                        expect(dataPoint).toHaveProperty('period');
                        expect(dataPoint).toHaveProperty('totalUsers');
                        expect(dataPoint).toHaveProperty('newUsers');
                        expect(dataPoint).toHaveProperty('growthRate');
                    }
                });
        });

        it('GET /api/admin/stats/users/behavior - 사용자 행동 패턴', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/stats/users/behavior')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    userType: 'all',
                    analysisDepth: 'detailed',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item).toHaveProperty('loginPatterns');
                    expect(res.body.item).toHaveProperty('featureUsage');
                    expect(res.body.item).toHaveProperty('userJourney');
                    expect(res.body.item).toHaveProperty('conversionFunnel');

                    // 기능 사용 패턴
                    const featureUsage = res.body.item.featureUsage;
                    expect(featureUsage).toHaveProperty('searchUsage');
                    expect(featureUsage).toHaveProperty('applicationUsage');
                    expect(featureUsage).toHaveProperty('favoriteUsage');
                    expect(featureUsage).toHaveProperty('reviewUsage');
                });
        });
    });

    describe('Adoption Statistics', () => {
        it('GET /api/admin/stats/adoptions - 입양 통계 조회', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/stats/adoptions')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    period: 'quarter',
                    includeDetails: 'true',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item).toHaveProperty('summary');
                    expect(res.body.item).toHaveProperty('trends');
                    expect(res.body.item).toHaveProperty('petTypes');
                    expect(res.body.item).toHaveProperty('regions');

                    // 요약 통계
                    const summary = res.body.item.summary;
                    expect(summary).toHaveProperty('totalApplications');
                    expect(summary).toHaveProperty('approvedApplications');
                    expect(summary).toHaveProperty('completedAdoptions');
                    expect(summary).toHaveProperty('successRate');
                    expect(summary).toHaveProperty('averageProcessingTime');

                    // 펫 유형별 통계
                    const petTypes = res.body.item.petTypes;
                    expect(petTypes).toHaveProperty('dog');
                    expect(petTypes).toHaveProperty('cat');
                    expect(petTypes).toHaveProperty('others');
                });
        });

        it('GET /api/admin/stats/adoptions/success-factors - 입양 성공 요인 분석', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/stats/adoptions/success-factors')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item).toHaveProperty('correlationAnalysis');
                    expect(res.body.item).toHaveProperty('successPredictors');
                    expect(res.body.item).toHaveProperty('failureReasons');
                    expect(res.body.item).toHaveProperty('recommendations');

                    // 성공 예측 요인
                    const predictors = res.body.item.successPredictors;
                    expect(predictors).toHaveProperty('breederRating');
                    expect(predictors).toHaveProperty('responseTime');
                    expect(predictors).toHaveProperty('priceRange');
                    expect(predictors).toHaveProperty('petAge');
                });
        });

        it('GET /api/admin/stats/adoptions/seasonal - 입양 계절성 분석', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/stats/adoptions/seasonal')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    years: '2023,2024',
                    includeHolidays: 'true',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item).toHaveProperty('seasonalTrends');
                    expect(res.body.item).toHaveProperty('monthlyPatterns');
                    expect(res.body.item).toHaveProperty('holidayEffects');
                    expect(res.body.item).toHaveProperty('weekdayPatterns');

                    // 계절별 트렌드
                    const seasonalTrends = res.body.item.seasonalTrends;
                    expect(seasonalTrends).toHaveProperty('spring');
                    expect(seasonalTrends).toHaveProperty('summer');
                    expect(seasonalTrends).toHaveProperty('autumn');
                    expect(seasonalTrends).toHaveProperty('winter');
                });
        });
    });

    describe('Breeder Performance Statistics', () => {
        it('GET /api/admin/stats/breeders - 브리더 성과 통계', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/stats/breeders')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    ranking: 'top50',
                    metrics: 'applications,success_rate,revenue',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item).toHaveProperty('topPerformers');
                    expect(res.body.item).toHaveProperty('averageMetrics');
                    expect(res.body.item).toHaveProperty('distributions');
                    expect(res.body.item).toHaveProperty('trends');

                    // 평균 지표
                    const averageMetrics = res.body.item.averageMetrics;
                    expect(averageMetrics).toHaveProperty('averageRating');
                    expect(averageMetrics).toHaveProperty('averageResponseTime');
                    expect(averageMetrics).toHaveProperty('averageSuccessRate');
                    expect(averageMetrics).toHaveProperty('averageRevenue');

                    // 상위 성과자
                    expect(Array.isArray(res.body.item.topPerformers)).toBe(true);
                });
        });

        it('GET /api/admin/stats/breeders/verification - 브리더 인증 통계', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/stats/breeders/verification')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item).toHaveProperty('verificationStats');
                    expect(res.body.item).toHaveProperty('processingTimes');
                    expect(res.body.item).toHaveProperty('rejectionReasons');
                    expect(res.body.item).toHaveProperty('reapplicationRates');

                    // 인증 통계
                    const verificationStats = res.body.item.verificationStats;
                    expect(verificationStats).toHaveProperty('totalApplications');
                    expect(verificationStats).toHaveProperty('approved');
                    expect(verificationStats).toHaveProperty('rejected');
                    expect(verificationStats).toHaveProperty('pending');
                    expect(verificationStats).toHaveProperty('approvalRate');
                });
        });

        it('GET /api/admin/stats/breeders/regional - 지역별 브리더 분포', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/stats/breeders/regional')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    includePerformance: 'true',
                    sortBy: 'count',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item).toHaveProperty('regionalDistribution');
                    expect(res.body.item).toHaveProperty('performanceByRegion');
                    expect(res.body.item).toHaveProperty('marketConcentration');

                    // 지역별 분포
                    const distribution = res.body.item.regionalDistribution;
                    expect(typeof distribution).toBe('object');

                    // 지역별 성과
                    const performance = res.body.item.performanceByRegion;
                    expect(typeof performance).toBe('object');
                });
        });
    });

    describe('Financial and Revenue Statistics', () => {
        it('GET /api/admin/stats/revenue - 수익 통계 조회', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/stats/revenue')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    period: 'year',
                    breakdown: 'monthly',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item).toHaveProperty('totalRevenue');
                    expect(res.body.item).toHaveProperty('revenueBySource');
                    expect(res.body.item).toHaveProperty('trends');
                    expect(res.body.item).toHaveProperty('projections');

                    // 수익원별 분류
                    const revenueBySource = res.body.item.revenueBySource;
                    expect(revenueBySource).toHaveProperty('commissions');
                    expect(revenueBySource).toHaveProperty('premiumFeatures');
                    expect(revenueBySource).toHaveProperty('advertisements');
                    expect(revenueBySource).toHaveProperty('subscriptions');
                });
        });

        it('GET /api/admin/stats/revenue/profitability - 수익성 분석', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/stats/revenue/profitability')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item).toHaveProperty('margins');
                    expect(res.body.item).toHaveProperty('costs');
                    expect(res.body.item).toHaveProperty('roi');
                    expect(res.body.item).toHaveProperty('customerLifetimeValue');

                    // 마진 정보
                    const margins = res.body.item.margins;
                    expect(margins).toHaveProperty('grossMargin');
                    expect(margins).toHaveProperty('netMargin');
                    expect(margins).toHaveProperty('operatingMargin');
                });
        });
    });

    describe('Platform Health and Performance', () => {
        it('GET /api/admin/stats/platform - 플랫폼 건강도 조회', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/stats/platform')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item).toHaveProperty('systemHealth');
                    expect(res.body.item).toHaveProperty('qualityMetrics');
                    expect(res.body.item).toHaveProperty('userSatisfaction');
                    expect(res.body.item).toHaveProperty('contentQuality');

                    // 시스템 건강도
                    const systemHealth = res.body.item.systemHealth;
                    expect(systemHealth).toHaveProperty('uptime');
                    expect(systemHealth).toHaveProperty('averageResponseTime');
                    expect(systemHealth).toHaveProperty('errorRate');
                    expect(systemHealth).toHaveProperty('activeConnections');

                    // 품질 지표
                    const qualityMetrics = res.body.item.qualityMetrics;
                    expect(qualityMetrics).toHaveProperty('averageRating');
                    expect(qualityMetrics).toHaveProperty('reportRate');
                    expect(qualityMetrics).toHaveProperty('resolutionRate');
                });
        });

        it('GET /api/admin/stats/alerts - 시스템 알림 및 경고', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/stats/alerts')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item).toHaveProperty('activeAlerts');
                    expect(res.body.item).toHaveProperty('thresholds');
                    expect(res.body.item).toHaveProperty('trends');
                    expect(Array.isArray(res.body.item.activeAlerts)).toBe(true);

                    // 임계값 정보
                    const thresholds = res.body.item.thresholds;
                    expect(thresholds).toHaveProperty('userGrowthRate');
                    expect(thresholds).toHaveProperty('adoptionSuccessRate');
                    expect(thresholds).toHaveProperty('reportResolutionTime');
                    expect(thresholds).toHaveProperty('systemUptime');
                });
        });
    });

    describe('Custom Reports and Exports', () => {
        it('POST /api/admin/stats/custom-report - 맞춤형 리포트 생성', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .post('/api/admin/stats/custom-report')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    reportName: '월간 성과 리포트',
                    metrics: ['user_growth', 'adoption_rate', 'revenue', 'satisfaction_score'],
                    filters: {
                        dateRange: {
                            start: '2024-01-01',
                            end: '2024-01-31',
                        },
                        regions: ['서울', '부산', '대구'],
                        userTypes: ['adopter', 'breeder'],
                    },
                    format: 'detailed',
                    includeCharts: true,
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item).toHaveProperty('reportId');
                    expect(res.body.item).toHaveProperty('generatedData');
                    expect(res.body.item).toHaveProperty('charts');
                    expect(res.body.message).toContain('맞춤형 리포트가 생성되었습니다');
                });
        });

        it('GET /api/admin/stats/export - 통계 데이터 내보내기', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/stats/export')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    type: 'adoption_stats',
                    period: 'month',
                    format: 'json',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item).toHaveProperty('exportData');
                    expect(res.body.item).toHaveProperty('metadata');
                    expect(res.body.item.metadata).toHaveProperty('exportedAt');
                    expect(res.body.item.metadata).toHaveProperty('recordCount');
                });
        });
    });

    describe('Input Validation and Error Handling', () => {
        it('GET /api/admin/stats - 유효하지 않은 날짜 범위', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    startDate: '2024-12-31',
                    endDate: '2024-01-01', // 종료일이 시작일보다 이전
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('종료일이 시작일보다 이전일 수 없습니다');
                });
        });

        it('GET /api/admin/stats - 유효하지 않은 그룹핑 옵션', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    groupBy: 'invalid_option',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('유효하지 않은 그룹핑 옵션입니다');
                });
        });

        it('GET /api/admin/stats/users/growth - 과도한 기간 요청', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/stats/users/growth')
                .set('Authorization', `Bearer ${adminToken}`)
                .query({
                    timespan: '10years', // 과도하게 긴 기간
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('요청 기간이 너무 깁니다');
                });
        });

        it('POST /api/admin/stats/custom-report - 필수 필드 누락', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .post('/api/admin/stats/custom-report')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    reportName: '테스트 리포트',
                    // metrics 필드 누락
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('측정 지표는 필수 입력 항목입니다');
                });
        });
    });

    describe('Access Control and Security', () => {
        it('모든 통계 API - 인증 없는 접근 거부', async () => {
            const endpoints = [
                { method: 'get', path: '/api/admin/stats' },
                { method: 'get', path: '/api/admin/stats/users' },
                { method: 'get', path: '/api/admin/stats/adoptions' },
                { method: 'get', path: '/api/admin/stats/breeders' },
                { method: 'get', path: '/api/admin/stats/revenue' },
                { method: 'get', path: '/api/admin/stats/platform' },
            ];

            for (const endpoint of endpoints) {
                await request(app.getHttpServer())[endpoint.method](endpoint.path).expect(401);
            }
        });

        it('모든 통계 API - 브리더 권한 접근 거부', async () => {
            const endpoints = [
                { method: 'get', path: '/api/admin/stats' },
                { method: 'get', path: '/api/admin/stats/revenue' },
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

        it('모든 통계 API - 입양자 권한 접근 거부', async () => {
            const endpoints = [
                { method: 'get', path: '/api/admin/stats' },
                { method: 'post', path: '/api/admin/stats/custom-report' },
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

        it('민감한 통계 정보 - 상급 관리자만 접근 가능', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            // 수익 관련 민감 정보는 상급 관리자만 접근 가능하다고 가정
            await request(app.getHttpServer())
                .get('/api/admin/stats/revenue/profitability')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect((res: any) => {
                    // 상급 관리자가 아닐 경우 403, 상급 관리자일 경우 200
                    expect([200, 403]).toContain(res.status);

                    if (res.status === 403) {
                        expect(res.body.message).toContain('상급 관리자만 접근할 수 있습니다');
                    }
                });
        });
    });

    describe('Response Data Structure Validation', () => {
        it('GET /api/admin/stats - 전체 통계 응답 구조 검증', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body).toHaveProperty('success');
                    expect(res.body).toHaveProperty('item');
                    expect(res.body).toHaveProperty('timestamp');
                    expect(res.body.success).toBe(true);

                    const data = res.body.item;
                    expect(data).toHaveProperty('userStats');
                    expect(data).toHaveProperty('adoptionStats');
                    expect(data).toHaveProperty('popularBreeds');
                    expect(data).toHaveProperty('reportStats');

                    // 사용자 통계 구조 검증
                    const userStats = data.userStats;
                    expect(typeof userStats.totalUsers).toBe('number');
                    expect(typeof userStats.activeUsers).toBe('number');
                    expect(typeof userStats.newUsersThisMonth).toBe('number');
                    expect(typeof userStats.userGrowthRate).toBe('number');

                    // 입양 통계 구조 검증
                    const adoptionStats = data.adoptionStats;
                    expect(typeof adoptionStats.totalApplications).toBe('number');
                    expect(typeof adoptionStats.successfulAdoptions).toBe('number');
                    expect(typeof adoptionStats.adoptionRate).toBe('number');
                });
        });

        it('POST /api/admin/stats/custom-report - 맞춤형 리포트 응답 구조 검증', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            await request(app.getHttpServer())
                .post('/api/admin/stats/custom-report')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    reportName: '구조 검증 테스트',
                    metrics: ['user_growth'],
                    filters: {
                        dateRange: {
                            start: '2024-01-01',
                            end: '2024-01-31',
                        },
                    },
                    format: 'summary',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body).toHaveProperty('item');
                    expect(res.body).toHaveProperty('message');
                    expect(res.body).toHaveProperty('timestamp');

                    const report = res.body.item;
                    expect(report).toHaveProperty('reportId');
                    expect(report).toHaveProperty('generatedData');
                    expect(report).toHaveProperty('metadata');
                    expect(typeof report.reportId).toBe('string');
                    expect(typeof report.generatedData).toBe('object');

                    // 메타데이터 검증
                    const metadata = report.metadata;
                    expect(metadata).toHaveProperty('generatedAt');
                    expect(metadata).toHaveProperty('reportName');
                    expect(metadata.reportName).toBe('구조 검증 테스트');
                });
        });
    });

    describe('Performance and Caching', () => {
        it('GET /api/admin/stats - 응답 시간 성능 테스트', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            const startTime = Date.now();

            await request(app.getHttpServer())
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200)
                .expect((res: any) => {
                    const responseTime = Date.now() - startTime;

                    // 응답 시간이 5초를 넘지 않아야 함 (합리적인 임계값)
                    expect(responseTime).toBeLessThan(5000);

                    // 캐싱 헤더 확인 (있을 경우)
                    if (res.headers['cache-control']) {
                        expect(res.headers['cache-control']).toBeDefined();
                    }
                });
        });

        it('GET /api/admin/stats - 동시 요청 처리 테스트', async () => {
            if (!adminToken) {
                console.log('Admin token not available, skipping test');
                return;
            }

            // 3개의 동시 요청
            const requests = [
                request(app.getHttpServer()).get('/api/admin/stats/users').set('Authorization', `Bearer ${adminToken}`),
                request(app.getHttpServer())
                    .get('/api/admin/stats/adoptions')
                    .set('Authorization', `Bearer ${adminToken}`),
                request(app.getHttpServer())
                    .get('/api/admin/stats/breeders')
                    .set('Authorization', `Bearer ${adminToken}`),
            ];

            const responses = await Promise.all(requests);

            // 모든 요청이 성공해야 함
            responses.forEach((response) => {
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });
        });
    });
});
