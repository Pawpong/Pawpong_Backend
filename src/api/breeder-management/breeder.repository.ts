import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Breeder, BreederDocument } from '../../schema/breeder.schema';
import { VerificationStatus, ApplicationStatus, PetStatus } from '../../common/enum/user.enum';

/**
 * 브리더 데이터 접근 계층 Repository
 *
 * 역할:
 * - 브리더 관련 모든 MongoDB 데이터 조작 담당
 * - 비즈니스 로직과 데이터 접근 로직의 완전한 분리
 * - 검색/필터링 쿼리 최적화 및 성능 개선
 * - 복잡한 집계 연산 처리 (통계, 평점 계산 등)
 *
 * 설계 원칙:
 * - 단일 책임 원칙: 오직 데이터 접근만 담당
 * - 쿼리 최적화: MongoDB 인덱스 활용 극대화
 * - 캡슐화: 복잡한 MongoDB 연산을 추상화
 * - 성능 우선: 읽기 최적화된 데이터 구조 활용
 */
@Injectable()
export class BreederRepository {
    constructor(@InjectModel(Breeder.name) private readonly breederModel: Model<BreederDocument>) {}

    /**
     * 브리더 ID로 기본 정보 조회
     * 비밀번호와 민감 정보는 제외하고 반환
     *
     * @param breederId 조회할 브리더 고유 ID
     * @returns 브리더 정보 (민감정보 제외) 또는 null
     */
    async findById(breederId: string): Promise<BreederDocument | null> {
        try {
            return await this.breederModel
                .findById(breederId)
                .select('-password -receivedApplications.applicationData -reports')
                .lean()
                .exec();
        } catch (error) {
            throw new Error(`브리더 조회 실패: ${error.message}`);
        }
    }

    /**
     * 브리더 ID로 전체 데이터 조회 (관리용)
     * 신청 데이터 포함하여 조회
     *
     * @param breederId 조회할 브리더 고유 ID
     * @returns 브리더 전체 정보 또는 null
     */
    async findByIdWithAllData(breederId: string): Promise<BreederDocument | null> {
        try {
            return await this.breederModel.findById(breederId).select('-password').exec();
        } catch (error) {
            throw new Error(`브리더 전체 정보 조회 실패: ${error.message}`);
        }
    }

    /**
     * 이메일로 브리더 조회 (로그인 시 사용)
     * 비밀번호 포함하여 반환
     *
     * @param email 조회할 이메일 주소
     * @returns 브리더 정보 (비밀번호 포함) 또는 null
     */
    async findByEmail(email: string): Promise<BreederDocument | null> {
        try {
            return await this.breederModel.findOne({ email: email.toLowerCase() }).exec();
        } catch (error) {
            throw new Error(`이메일로 브리더 조회 실패: ${error.message}`);
        }
    }

    /**
     * 새로운 브리더 계정 생성
     * 초기 상태 및 기본 설정 자동 구성
     *
     * @param breederData 생성할 브리더 데이터
     * @returns 생성된 브리더 정보
     */
    async create(breederData: Partial<Breeder>): Promise<BreederDocument> {
        try {
            const breeder = new this.breederModel({
                ...breederData,
                verification: {
                    status: VerificationStatus.PENDING,
                    plan: 'basic',
                    submittedAt: null,
                    documents: [],
                },
                stats: {
                    totalApplications: 0,
                    completedAdoptions: 0,
                    averageRating: 0,
                    totalReviews: 0,
                    profileViews: 0,
                },
                parentPets: [],
                availablePets: [],
                receivedApplications: [],
                reviews: [],
                reports: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            return await breeder.save();
        } catch (error) {
            if (error.code === 11000) {
                throw new Error('이미 등록된 이메일 주소입니다.');
            }
            throw new Error(`브리더 생성 실패: ${error.message}`);
        }
    }

    /**
     * 브리더 프로필 정보 업데이트
     * 수정 시각 자동 갱신
     *
     * @param breederId 수정할 브리더 ID
     * @param updateData 수정할 데이터
     * @returns 수정된 브리더 정보 또는 null
     */
    async updateProfile(breederId: string, updateData: any): Promise<BreederDocument | null> {
        try {
            return await this.breederModel
                .findByIdAndUpdate(
                    breederId,
                    {
                        $set: {
                            ...updateData,
                            updatedAt: new Date(),
                        },
                    },
                    { new: true, runValidators: true },
                )
                .select('-password')
                .exec();
        } catch (error) {
            throw new Error(`브리더 프로필 업데이트 실패: ${error.message}`);
        }
    }

    /**
     * 브리더 인증 정보 업데이트
     * 인증 상태, 제출 문서 등 관리
     *
     * @param breederId 브리더 ID
     * @param verificationData 인증 정보
     */
    async updateVerification(breederId: string, verificationData: any): Promise<void> {
        try {
            await this.breederModel
                .findByIdAndUpdate(breederId, {
                    $set: {
                        verification: verificationData,
                        updatedAt: new Date(),
                    },
                })
                .exec();
        } catch (error) {
            throw new Error(`브리더 인증 정보 업데이트 실패: ${error.message}`);
        }
    }

    /**
     * 부모 반려동물 추가
     * 브리더의 부모견/부모묘 정보 등록
     *
     * @param breederId 브리더 ID
     * @param parentPetData 부모 반려동물 정보
     */
    async addParentPet(breederId: string, parentPetData: any): Promise<void> {
        try {
            await this.breederModel
                .findByIdAndUpdate(breederId, {
                    $push: { parentPets: parentPetData },
                    $set: { updatedAt: new Date() },
                })
                .exec();
        } catch (error) {
            throw new Error(`부모 반려동물 추가 실패: ${error.message}`);
        }
    }

    /**
     * 부모 반려동물 정보 수정
     * MongoDB 배열 내 특정 요소 업데이트
     *
     * @param breederId 브리더 ID
     * @param petId 수정할 반려동물 ID
     * @param updateData 수정할 데이터
     */
    async updateParentPet(breederId: string, petId: string, updateData: any): Promise<void> {
        try {
            const updateFields: any = {};
            Object.keys(updateData).forEach((key) => {
                updateFields[`parentPets.$.${key}`] = updateData[key];
            });
            updateFields.updatedAt = new Date();

            await this.breederModel
                .findOneAndUpdate(
                    {
                        _id: breederId,
                        'parentPets.petId': petId,
                    },
                    { $set: updateFields },
                )
                .exec();
        } catch (error) {
            throw new Error(`부모 반려동물 업데이트 실패: ${error.message}`);
        }
    }

    /**
     * 부모 반려동물 제거
     *
     * @param breederId 브리더 ID
     * @param petId 제거할 반려동물 ID
     */
    async removeParentPet(breederId: string, petId: string): Promise<void> {
        try {
            await this.breederModel
                .findByIdAndUpdate(breederId, {
                    $pull: { parentPets: { petId } },
                    $set: { updatedAt: new Date() },
                })
                .exec();
        } catch (error) {
            throw new Error(`부모 반려동물 제거 실패: ${error.message}`);
        }
    }

    /**
     * 분양 가능 반려동물 추가
     * 새로운 분양 대상 등록
     *
     * @param breederId 브리더 ID
     * @param availablePetData 분양 가능 반려동물 정보
     */
    async addAvailablePet(breederId: string, availablePetData: any): Promise<void> {
        try {
            await this.breederModel
                .findByIdAndUpdate(breederId, {
                    $push: { availablePets: availablePetData },
                    $set: { updatedAt: new Date() },
                })
                .exec();
        } catch (error) {
            throw new Error(`분양 가능 반려동물 추가 실패: ${error.message}`);
        }
    }

    /**
     * 분양 가능 반려동물 정보 수정
     *
     * @param breederId 브리더 ID
     * @param petId 수정할 반려동물 ID
     * @param updateData 수정할 데이터
     */
    async updateAvailablePet(breederId: string, petId: string, updateData: any): Promise<void> {
        try {
            const updateFields: any = {};
            Object.keys(updateData).forEach((key) => {
                updateFields[`availablePets.$.${key}`] = updateData[key];
            });
            updateFields.updatedAt = new Date();

            await this.breederModel
                .findOneAndUpdate(
                    {
                        _id: breederId,
                        'availablePets.petId': petId,
                    },
                    { $set: updateFields },
                )
                .exec();
        } catch (error) {
            throw new Error(`분양 가능 반려동물 업데이트 실패: ${error.message}`);
        }
    }

    /**
     * 반려동물 분양 상태 업데이트
     * 예약, 분양 완료 등 상태 변경
     *
     * @param breederId 브리더 ID
     * @param petId 반려동물 ID
     * @param status 변경할 상태
     * @param additionalData 추가 데이터 (분양일시 등)
     */
    async updatePetStatus(breederId: string, petId: string, status: PetStatus, additionalData?: any): Promise<void> {
        try {
            const updateFields: any = {
                'availablePets.$.status': status,
                updatedAt: new Date(),
            };

            if (additionalData) {
                Object.assign(updateFields, additionalData);
            }

            await this.breederModel
                .findOneAndUpdate(
                    {
                        _id: breederId,
                        'availablePets.petId': petId,
                    },
                    { $set: updateFields },
                )
                .exec();
        } catch (error) {
            throw new Error(`반려동물 상태 업데이트 실패: ${error.message}`);
        }
    }

    /**
     * 분양 가능 반려동물 제거
     *
     * @param breederId 브리더 ID
     * @param petId 제거할 반려동물 ID
     */
    async removeAvailablePet(breederId: string, petId: string): Promise<void> {
        try {
            await this.breederModel
                .findByIdAndUpdate(breederId, {
                    $pull: { availablePets: { petId } },
                    $set: { updatedAt: new Date() },
                })
                .exec();
        } catch (error) {
            throw new Error(`분양 가능 반려동물 제거 실패: ${error.message}`);
        }
    }

    /**
     * 받은 입양 신청 추가
     * 신청 통계 자동 증가
     *
     * @param breederId 브리더 ID
     * @param applicationData 입양 신청 데이터
     */
    async addReceivedApplication(breederId: string, applicationData: any): Promise<void> {
        try {
            await this.breederModel
                .findByIdAndUpdate(breederId, {
                    $push: { receivedApplications: applicationData },
                    $inc: { 'stats.totalApplications': 1 },
                    $set: { updatedAt: new Date() },
                })
                .exec();
        } catch (error) {
            throw new Error(`받은 입양 신청 추가 실패: ${error.message}`);
        }
    }

    /**
     * 입양 신청 상태 업데이트
     * 승인, 거절 등 신청 처리
     *
     * @param breederId 브리더 ID
     * @param applicationId 입양 신청 ID
     * @param status 변경할 상태
     * @param additionalData 추가 데이터 (처리 일시, 메모 등)
     */
    async updateApplicationStatus(
        breederId: string,
        applicationId: string,
        status: any,
        additionalData?: any,
    ): Promise<void> {
        try {
            const updateFields: any = {
                'receivedApplications.$.status': status,
                'receivedApplications.$.processedAt': new Date(),
                updatedAt: new Date(),
            };

            if (additionalData) {
                Object.assign(updateFields, additionalData);
            }

            await this.breederModel
                .findOneAndUpdate(
                    {
                        _id: breederId,
                        'receivedApplications.applicationId': applicationId,
                    },
                    { $set: updateFields },
                )
                .exec();
        } catch (error) {
            throw new Error(`입양 신청 상태 업데이트 실패: ${error.message}`);
        }
    }

    /**
     * 완료된 입양 건수 증가
     * 통계 정보 업데이트
     *
     * @param breederId 브리더 ID
     */
    async incrementCompletedAdoptions(breederId: string): Promise<void> {
        try {
            await this.breederModel
                .findByIdAndUpdate(breederId, {
                    $inc: { 'stats.completedAdoptions': 1 },
                    $set: { updatedAt: new Date() },
                })
                .exec();
        } catch (error) {
            throw new Error(`완료된 입양 건수 증가 실패: ${error.message}`);
        }
    }

    /**
     * 받은 후기 추가
     * 후기 캐싱 및 통계 업데이트는 별도 처리
     *
     * @param breederId 브리더 ID
     * @param reviewData 후기 데이터
     */
    async addReview(breederId: string, reviewData: any): Promise<void> {
        try {
            await this.breederModel
                .findByIdAndUpdate(breederId, {
                    $push: { reviews: reviewData },
                    $set: { updatedAt: new Date() },
                })
                .exec();
        } catch (error) {
            throw new Error(`후기 추가 실패: ${error.message}`);
        }
    }

    /**
     * 후기 통계 업데이트
     * 평균 평점 및 후기 수 재계산
     *
     * @param breederId 브리더 ID
     * @param averageRating 평균 평점
     * @param totalReviews 총 후기 수
     */
    async updateReviewStats(breederId: string, averageRating: number, totalReviews: number): Promise<void> {
        try {
            await this.breederModel
                .findByIdAndUpdate(breederId, {
                    $set: {
                        'stats.averageRating': Math.round(averageRating * 10) / 10,
                        'stats.totalReviews': totalReviews,
                        updatedAt: new Date(),
                    },
                })
                .exec();
        } catch (error) {
            throw new Error(`후기 통계 업데이트 실패: ${error.message}`);
        }
    }

    /**
     * 신고 추가
     * 브리더에 대한 신고 접수
     *
     * @param breederId 브리더 ID
     * @param reportData 신고 데이터
     */
    async addReport(breederId: string, reportData: any): Promise<void> {
        try {
            await this.breederModel
                .findByIdAndUpdate(breederId, {
                    $push: { reports: reportData },
                    $set: { updatedAt: new Date() },
                })
                .exec();
        } catch (error) {
            throw new Error(`신고 추가 실패: ${error.message}`);
        }
    }

    /**
     * 특정 분양 가능 반려동물 조회
     *
     * @param breederId 브리더 ID
     * @param petId 반려동물 ID
     * @returns 반려동물 정보 또는 null
     */
    async findAvailablePetById(breederId: string, petId: string): Promise<any | null> {
        try {
            const breeder = await this.breederModel.findById(breederId).lean().exec();
            if (!breeder) return null;

            return breeder.availablePets?.find((pet: any) => pet.petId === petId) || null;
        } catch (error) {
            throw new Error(`분양 가능 반려동물 조회 실패: ${error.message}`);
        }
    }

    /**
     * 특정 부모 반려동물 조회
     *
     * @param breederId 브리더 ID
     * @param petId 반려동물 ID
     * @returns 부모 반려동물 정보 또는 null
     */
    async findParentPetById(breederId: string, petId: string): Promise<any | null> {
        try {
            const breeder = await this.breederModel.findById(breederId).lean().exec();
            if (!breeder) return null;

            return breeder.parentPets?.find((pet: any) => pet.petId === petId) || null;
        } catch (error) {
            throw new Error(`부모 반려동물 조회 실패: ${error.message}`);
        }
    }

    /**
     * 받은 입양 신청 목록 조회 (페이지네이션)
     * 브리더 대시보드용 신청 관리
     *
     * @param breederId 브리더 ID
     * @param page 페이지 번호 (기본값: 1)
     * @param limit 페이지당 항목 수 (기본값: 10)
     * @returns 페이지네이션된 신청 목록
     */
    async findReceivedApplications(breederId: string, page: number = 1, limit: number = 10): Promise<any> {
        try {
            const breeder = await this.breederModel.findById(breederId).lean().exec();
            if (!breeder) return null;

            const applications = breeder.receivedApplications || [];
            const total = applications.length;
            const skip = (page - 1) * limit;

            const paginatedApplications = applications
                .sort((a: any, b: any) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
                .slice(skip, skip + limit);

            return {
                applications: paginatedApplications,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: limit,
                    hasNextPage: skip + limit < total,
                    hasPrevPage: page > 1,
                },
            };
        } catch (error) {
            throw new Error(`받은 입양 신청 조회 실패: ${error.message}`);
        }
    }

    /**
     * 브리더 검색 (공개 API용)
     * 입양자를 위한 브리더 검색 및 필터링
     *
     * @param filters 검색 필터 (지역, 반려동물 종류 등)
     * @param page 페이지 번호 (기본값: 1)
     * @param limit 페이지당 항목 수 (기본값: 10)
     * @returns 페이지네이션된 브리더 목록
     */
    async findWithFilters(filters: any, page: number = 1, limit: number = 10): Promise<any> {
        try {
            const query: any = {
                status: 'active',
                'verification.status': VerificationStatus.APPROVED,
            };

            // 필터 조건 동적 구성
            if (filters.location) {
                query['profile.location.city'] = new RegExp(filters.location, 'i');
            }
            if (filters.petType) {
                query['availablePets.type'] = filters.petType;
            }
            if (filters.breed) {
                query['availablePets.breed'] = new RegExp(filters.breed, 'i');
            }
            if (filters.priceMin || filters.priceMax) {
                const priceQuery: any = {};
                if (filters.priceMin) priceQuery.$gte = filters.priceMin;
                if (filters.priceMax) priceQuery.$lte = filters.priceMax;
                query['availablePets.price'] = priceQuery;
            }

            const skip = (page - 1) * limit;

            const [breeders, total] = await Promise.all([
                this.breederModel
                    .find(query)
                    .select('-password -receivedApplications.applicationData -reports')
                    .sort({ 'stats.averageRating': -1, createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean()
                    .exec(),
                this.breederModel.countDocuments(query).exec(),
            ]);

            return {
                breeders,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: limit,
                    hasNextPage: skip + limit < total,
                    hasPrevPage: page > 1,
                },
            };
        } catch (error) {
            throw new Error(`브리더 검색 실패: ${error.message}`);
        }
    }

    /**
     * 인기 브리더 조회
     * 평점 기반 추천 브리더 목록
     *
     * @param limit 조회할 브리더 수 (기본값: 10)
     * @returns 인기 브리더 목록
     */
    async findPopularBreeders(limit: number = 10): Promise<BreederDocument[]> {
        try {
            return (await this.breederModel
                .find({
                    status: 'active',
                    'verification.status': VerificationStatus.APPROVED,
                    'stats.totalReviews': { $gte: 3 }, // 최소 3개 이상의 후기 보유
                })
                .select('-password -receivedApplications.applicationData -reports')
                .sort({
                    'stats.averageRating': -1,
                    'stats.totalReviews': -1,
                    'stats.completedAdoptions': -1,
                })
                .limit(limit)
                .lean()
                .exec()) as BreederDocument[];
        } catch (error) {
            throw new Error(`인기 브리더 조회 실패: ${error.message}`);
        }
    }

    /**
     * 승인 대기 브리더 조회 (관리자용)
     * 인증 심사 대기 목록
     *
     * @param page 페이지 번호 (기본값: 1)
     * @param limit 페이지당 항목 수 (기본값: 10)
     * @returns 페이지네이션된 대기 브리더 목록
     */
    async findPendingVerification(page: number = 1, limit: number = 10): Promise<any> {
        try {
            const query = { 'verification.status': VerificationStatus.REVIEWING };
            const skip = (page - 1) * limit;

            const [breeders, total] = await Promise.all([
                this.breederModel
                    .find(query)
                    .select('-password')
                    .sort({ 'verification.submittedAt': 1 })
                    .skip(skip)
                    .limit(limit)
                    .lean()
                    .exec(),
                this.breederModel.countDocuments(query).exec(),
            ]);

            return {
                breeders,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: limit,
                    hasNextPage: skip + limit < total,
                    hasPrevPage: page > 1,
                },
            };
        } catch (error) {
            throw new Error(`승인 대기 브리더 조회 실패: ${error.message}`);
        }
    }

    /**
     * 브리더 수 통계 조회 (관리자용)
     * 상태별 브리더 수 집계
     *
     * @param filters 필터 조건 (선택사항)
     * @returns 브리더 수
     */
    async countBreeders(filters?: any): Promise<{ [key: string]: number }> {
        try {
            const pipeline = [
                { $match: filters || {} },
                {
                    $group: {
                        _id: '$verification.status',
                        count: { $sum: 1 },
                    },
                },
            ];

            const results = await this.breederModel.aggregate(pipeline).exec();

            const stats: { [key: string]: number } = {
                total: 0,
                pending: 0,
                reviewing: 0,
                approved: 0,
                rejected: 0,
            };

            results.forEach((result: any) => {
                stats[result._id] = result.count;
                stats.total += result.count;
            });

            return stats;
        } catch (error) {
            throw new Error(`브리더 수 통계 조회 실패: ${error.message}`);
        }
    }

    /**
     * 브리더 프로필 조회수 증가
     * 사용자 유입 통계 추적
     *
     * @param breederId 브리더 ID
     */
    async incrementProfileViews(breederId: string): Promise<void> {
        try {
            await this.breederModel.findByIdAndUpdate(breederId, { $inc: { 'stats.profileViews': 1 } }).exec();
        } catch (error) {
            // 치명적이지 않은 오류이므로 로깅만 수행
            console.error(`프로필 조회수 증가 실패: ${error.message}`);
        }
    }

    /**
     * 브리더 통계 일괄 업데이트
     * 정기적인 통계 재계산 및 동기화
     *
     * @param breederId 브리더 ID
     * @param statsData 업데이트할 통계 데이터
     */
    async updateStats(breederId: string, statsData: any): Promise<void> {
        try {
            await this.breederModel
                .findByIdAndUpdate(breederId, {
                    $set: {
                        stats: {
                            ...statsData,
                            lastUpdated: new Date(),
                        },
                        updatedAt: new Date(),
                    },
                })
                .exec();
        } catch (error) {
            throw new Error(`브리더 통계 업데이트 실패: ${error.message}`);
        }
    }
}
