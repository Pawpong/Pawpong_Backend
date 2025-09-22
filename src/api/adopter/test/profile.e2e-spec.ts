import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { AppModule } from '../../../app.module';

/**
 * 입양자 프로필 End-to-End 테스트
 * 입양자의 프로필 관리 관련 모든 시나리오를 테스트합니다.
 * - 프로필 조회 및 수정
 * - 프로필 이미지 업로드 및 관리
 * - 개인정보 보안 처리
 * - 입양 선호도 설정
 * - 계정 상태 관리
 */
describe('Adopter Profile API (e2e)', () => {
    let app: INestApplication;
    let mongod: MongoMemoryServer;
    let adopterToken: string;
    let breederToken: string;
    let adopterId: string;

    beforeAll(async () => {
        // 메모리 내 MongoDB 서버 시작
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [MongooseModule.forRoot(uri), AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // 테스트용 입양자 생성
        const adopterResponse = await request(app.getHttpServer()).post('/api/auth/register/adopter').send({
            email: 'adopter@test.com',
            password: 'testpassword123',
            name: 'Test Adopter',
            phone: '010-1234-5678',
        });
        adopterToken = adopterResponse.body.access_token;
        adopterId = adopterResponse.body.user.id;

        // 테스트용 브리더 생성 (권한 테스트용)
        const breederResponse = await request(app.getHttpServer()).post('/api/auth/register/breeder').send({
            email: 'breeder@test.com',
            password: 'testpassword123',
            name: 'Test Breeder',
            phone: '010-9876-5432',
            businessNumber: '123-45-67890',
            businessName: 'Test Pet Farm',
        });
        breederToken = breederResponse.body.access_token;
    });

    afterAll(async () => {
        await app.close();
        await mongod.stop();
    });

    describe('Profile Retrieval', () => {
        it('GET /api/adopter/profile - 입양자 프로필 조회 성공', async () => {
            await request(app.getHttpServer())
                .get('/api/adopter/profile')
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.email).toBe('adopter@test.com');
                    expect(res.body.item.name).toBe('Test Adopter');
                    expect(res.body.item.phone).toBe('010-1234-5678');
                    expect(res.body.item.role).toBe('adopter');
                    expect(res.body.item.status).toBe('active');
                    expect(res.body.item.createdAt).toBeDefined();
                    expect(res.body.item.updatedAt).toBeDefined();
                    // 보안: 비밀번호 필드는 응답에 포함되지 않아야 함
                    expect(res.body.item.password).toBeUndefined();
                });
        });

        it('GET /api/adopter/profile - 프로필 기본 구조 검증', async () => {
            await request(app.getHttpServer())
                .get('/api/adopter/profile')
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    const profile = res.body.item;
                    
                    // 필수 필드 확인
                    expect(profile).toHaveProperty('id');
                    expect(profile).toHaveProperty('email');
                    expect(profile).toHaveProperty('name');
                    expect(profile).toHaveProperty('phone');
                    expect(profile).toHaveProperty('role');
                    expect(profile).toHaveProperty('status');
                    expect(profile).toHaveProperty('createdAt');
                    expect(profile).toHaveProperty('updatedAt');
                    
                    // 선택 필드 확인 (기본값)
                    expect(profile).toHaveProperty('profileImage');
                    expect(profile).toHaveProperty('preferences');
                    expect(profile).toHaveProperty('statistics');
                });
        });
    });

    describe('Profile Update - Basic Information', () => {
        const updatedProfileData = {
            name: '업데이트된 입양자',
            phone: '010-9999-8888',
            profileImage: 'https://example.com/updated-profile.jpg',
        };

        it('PATCH /api/adopter/profile - 기본 정보 업데이트 성공', async () => {
            await request(app.getHttpServer())
                .patch('/api/adopter/profile')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(updatedProfileData)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.name).toBe('업데이트된 입양자');
                    expect(res.body.item.phone).toBe('010-9999-8888');
                    expect(res.body.item.profileImage).toBe('https://example.com/updated-profile.jpg');
                    expect(res.body.message).toContain('프로필이 성공적으로 업데이트되었습니다');
                });
        });

        it('GET /api/adopter/profile - 업데이트된 정보 확인', async () => {
            await request(app.getHttpServer())
                .get('/api/adopter/profile')
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.item.name).toBe('업데이트된 입양자');
                    expect(res.body.item.phone).toBe('010-9999-8888');
                    expect(res.body.item.profileImage).toBe('https://example.com/updated-profile.jpg');
                    
                    // updatedAt이 최신으로 변경되었는지 확인
                    const updatedAt = new Date(res.body.item.updatedAt);
                    const createdAt = new Date(res.body.item.createdAt);
                    expect(updatedAt.getTime()).toBeGreaterThan(createdAt.getTime());
                });
        });
    });

    describe('Profile Update - Adoption Preferences', () => {
        const preferencesData = {
            preferences: {
                petType: ['dog', 'cat'],
                breeds: ['골든 리트리버', '페르시안', '푸들'],
                ageRange: {
                    min: 2,
                    max: 60,
                },
                sizePreference: ['small', 'medium'],
                location: {
                    regions: ['서울', '경기'],
                    maxDistance: 50,
                },
                priceRange: {
                    min: 500000,
                    max: 2000000,
                },
                specialNeeds: {
                    acceptDisabled: true,
                    acceptSick: false,
                    acceptOld: true,
                },
                livingEnvironment: {
                    houseType: 'apartment',
                    hasYard: false,
                    otherPets: true,
                    children: false,
                },
            },
        };

        it('PATCH /api/adopter/profile - 입양 선호도 설정 성공', async () => {
            await request(app.getHttpServer())
                .patch('/api/adopter/profile')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(preferencesData)
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.item.preferences).toBeDefined();
                    expect(res.body.item.preferences.petType).toEqual(['dog', 'cat']);
                    expect(res.body.item.preferences.breeds).toEqual(['골든 리트리버', '페르시안', '푸들']);
                    expect(res.body.item.preferences.ageRange.min).toBe(2);
                    expect(res.body.item.preferences.ageRange.max).toBe(60);
                });
        });

        it('GET /api/adopter/profile - 설정된 선호도 확인', async () => {
            await request(app.getHttpServer())
                .get('/api/adopter/profile')
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    const preferences = res.body.item.preferences;
                    expect(preferences.petType).toEqual(['dog', 'cat']);
                    expect(preferences.priceRange.min).toBe(500000);
                    expect(preferences.priceRange.max).toBe(2000000);
                    expect(preferences.specialNeeds.acceptDisabled).toBe(true);
                    expect(preferences.livingEnvironment.houseType).toBe('apartment');
                });
        });
    });

    describe('Profile Update Validation', () => {
        it('PATCH /api/adopter/profile - 유효하지 않은 전화번호 형식', async () => {
            await request(app.getHttpServer())
                .patch('/api/adopter/profile')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({
                    phone: 'invalid-phone-number',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('올바른 전화번호 형식이 아닙니다');
                });
        });

        it('PATCH /api/adopter/profile - 이름 길이 제한 초과', async () => {
            await request(app.getHttpServer())
                .patch('/api/adopter/profile')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({
                    name: 'A'.repeat(101), // 100자 초과
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('이름은 최대 100자까지 입력 가능합니다');
                });
        });

        it('PATCH /api/adopter/profile - 유효하지 않은 프로필 이미지 URL', async () => {
            await request(app.getHttpServer())
                .patch('/api/adopter/profile')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({
                    profileImage: 'not-a-valid-url',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('올바른 이미지 URL 형식이 아닙니다');
                });
        });

        it('PATCH /api/adopter/profile - 유효하지 않은 나이 범위', async () => {
            await request(app.getHttpServer())
                .patch('/api/adopter/profile')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({
                    preferences: {
                        ageRange: {
                            min: 50,
                            max: 10, // min > max는 유효하지 않음
                        },
                    },
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('최소 나이가 최대 나이보다 클 수 없습니다');
                });
        });

        it('PATCH /api/adopter/profile - 유효하지 않은 가격 범위', async () => {
            await request(app.getHttpServer())
                .patch('/api/adopter/profile')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({
                    preferences: {
                        priceRange: {
                            min: -100000, // 음수는 유효하지 않음
                            max: 1000000,
                        },
                    },
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('가격은 0원 이상이어야 합니다');
                });
        });
    });

    describe('Sensitive Information Protection', () => {
        it('PATCH /api/adopter/profile - 이메일 변경 시도 (보안상 제한)', async () => {
            await request(app.getHttpServer())
                .patch('/api/adopter/profile')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({
                    email: 'newemail@test.com',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('이메일은 프로필에서 변경할 수 없습니다');
                });
        });

        it('PATCH /api/adopter/profile - 비밀번호 변경 시도 (별도 API 필요)', async () => {
            await request(app.getHttpServer())
                .patch('/api/adopter/profile')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({
                    password: 'newpassword123',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('비밀번호는 별도 API를 통해 변경해주세요');
                });
        });

        it('PATCH /api/adopter/profile - 역할(role) 변경 시도 (보안상 제한)', async () => {
            await request(app.getHttpServer())
                .patch('/api/adopter/profile')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({
                    role: 'breeder',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('사용자 역할은 변경할 수 없습니다');
                });
        });

        it('PATCH /api/adopter/profile - 상태(status) 변경 시도 (관리자 권한 필요)', async () => {
            await request(app.getHttpServer())
                .patch('/api/adopter/profile')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({
                    status: 'suspended',
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('사용자 상태는 관리자만 변경할 수 있습니다');
                });
        });
    });

    describe('Statistics and Activity Data', () => {
        it('GET /api/adopter/profile - 통계 정보 포함 확인', async () => {
            await request(app.getHttpServer())
                .get('/api/adopter/profile')
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    const statistics = res.body.item.statistics;
                    expect(statistics).toBeDefined();
                    expect(statistics).toHaveProperty('totalApplications');
                    expect(statistics).toHaveProperty('successfulAdoptions');
                    expect(statistics).toHaveProperty('favoriteCount');
                    expect(statistics).toHaveProperty('reviewsWritten');
                    expect(statistics).toHaveProperty('reportsSubmitted');
                    expect(statistics).toHaveProperty('lastActivityAt');
                    
                    // 초기 통계값 확인
                    expect(typeof statistics.totalApplications).toBe('number');
                    expect(typeof statistics.successfulAdoptions).toBe('number');
                    expect(typeof statistics.favoriteCount).toBe('number');
                    expect(statistics.totalApplications).toBeGreaterThanOrEqual(0);
                });
        });
    });

    describe('Partial Profile Updates', () => {
        it('PATCH /api/adopter/profile - 이름만 부분 업데이트', async () => {
            await request(app.getHttpServer())
                .patch('/api/adopter/profile')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({
                    name: '부분 업데이트 테스트',
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.item.name).toBe('부분 업데이트 테스트');
                    // 다른 필드들은 변경되지 않아야 함
                    expect(res.body.item.email).toBe('adopter@test.com');
                });
        });

        it('PATCH /api/adopter/profile - 선호도만 부분 업데이트', async () => {
            await request(app.getHttpServer())
                .patch('/api/adopter/profile')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({
                    preferences: {
                        petType: ['dog'],
                    },
                })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.item.preferences.petType).toEqual(['dog']);
                    // 기본 정보는 변경되지 않아야 함
                    expect(res.body.item.name).toBe('부분 업데이트 테스트');
                });
        });
    });

    describe('Access Control and Security', () => {
        it('GET /api/adopter/profile - 인증 없는 접근 거부', async () => {
            await request(app.getHttpServer())
                .get('/api/adopter/profile')
                .expect(401);
        });

        it('PATCH /api/adopter/profile - 인증 없는 업데이트 거부', async () => {
            await request(app.getHttpServer())
                .patch('/api/adopter/profile')
                .send({ name: '해킹 시도' })
                .expect(401);
        });

        it('GET /api/adopter/profile - 브리더 권한으로 접근 거부', async () => {
            await request(app.getHttpServer())
                .get('/api/adopter/profile')
                .set('Authorization', `Bearer ${breederToken}`)
                .expect(403)
                .expect((res: any) => {
                    expect(res.body.message).toContain('입양자만 접근할 수 있습니다');
                });
        });

        it('PATCH /api/adopter/profile - 브리더 권한으로 업데이트 거부', async () => {
            await request(app.getHttpServer())
                .patch('/api/adopter/profile')
                .set('Authorization', `Bearer ${breederToken}`)
                .send({ name: '권한 없는 수정' })
                .expect(403)
                .expect((res: any) => {
                    expect(res.body.message).toContain('입양자만 접근할 수 있습니다');
                });
        });
    });

    describe('Response Data Structure Validation', () => {
        it('GET /api/adopter/profile - 응답 구조 완전성 검증', async () => {
            await request(app.getHttpServer())
                .get('/api/adopter/profile')
                .set('Authorization', `Bearer ${adopterToken}`)
                .expect(200)
                .expect((res: any) => {
                    // 기본 API 응답 구조
                    expect(res.body).toHaveProperty('success');
                    expect(res.body).toHaveProperty('item');
                    expect(res.body).toHaveProperty('timestamp');
                    expect(res.body.success).toBe(true);
                    
                    // 프로필 데이터 타입 검증
                    const profile = res.body.item;
                    expect(typeof profile.id).toBe('string');
                    expect(typeof profile.email).toBe('string');
                    expect(typeof profile.name).toBe('string');
                    expect(typeof profile.phone).toBe('string');
                    expect(typeof profile.role).toBe('string');
                    expect(typeof profile.status).toBe('string');
                    expect(typeof profile.createdAt).toBe('string');
                    expect(typeof profile.updatedAt).toBe('string');
                    
                    // 날짜 형식 검증
                    expect(new Date(profile.createdAt)).toBeInstanceOf(Date);
                    expect(new Date(profile.updatedAt)).toBeInstanceOf(Date);
                });
        });

        it('PATCH /api/adopter/profile - 업데이트 응답 구조 검증', async () => {
            await request(app.getHttpServer())
                .patch('/api/adopter/profile')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({ name: '응답 구조 테스트' })
                .expect(200)
                .expect((res: any) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body).toHaveProperty('item');
                    expect(res.body).toHaveProperty('message');
                    expect(res.body).toHaveProperty('timestamp');
                    expect(typeof res.body.message).toBe('string');
                    expect(res.body.message).toContain('성공');
                });
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('PATCH /api/adopter/profile - 빈 요청 바디 처리', async () => {
            await request(app.getHttpServer())
                .patch('/api/adopter/profile')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({})
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('업데이트할 정보가 없습니다');
                });
        });

        it('PATCH /api/adopter/profile - null 값 처리', async () => {
            await request(app.getHttpServer())
                .patch('/api/adopter/profile')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send({
                    name: null,
                    phone: null,
                })
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('null 값은 허용되지 않습니다');
                });
        });

        it('PATCH /api/adopter/profile - 매우 큰 데이터 처리', async () => {
            const largePreferences = {
                preferences: {
                    breeds: Array(1000).fill('테스트 품종'), // 매우 많은 품종
                },
            };

            await request(app.getHttpServer())
                .patch('/api/adopter/profile')
                .set('Authorization', `Bearer ${adopterToken}`)
                .send(largePreferences)
                .expect(400)
                .expect((res: any) => {
                    expect(res.body.message).toContain('품종 선택은 최대 50개까지 가능합니다');
                });
        });
    });
});