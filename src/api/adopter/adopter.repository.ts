import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Adopter, AdopterDocument } from '../../schema/adopter.schema';

/**
 * 입양자 데이터 접근 계층 Repository
 *
 * 역할:
 * - 입양자 관련 모든 MongoDB 데이터 조작 담당
 * - 비즈니스 로직과 데이터 접근 로직의 완전한 분리
 * - 복잡한 쿼리 최적화 및 성능 개선
 * - 일관된 에러 핸들링 및 데이터 검증
 *
 * 설계 원칙:
 * - 단일 책임 원칙: 오직 데이터 접근만 담당
 * - 의존성 역전: Service는 Repository 인터페이스에만 의존
 * - 캡슐화: MongoDB 스키마 구조 숨김 처리
 */
@Injectable()
export class AdopterRepository {
    constructor(@InjectModel(Adopter.name) private readonly adopterModel: Model<AdopterDocument>) {}

    /**
     * 입양자 ID로 기본 정보 조회
     * 비밀번호는 보안상 제외하고 반환
     *
     * @param adopterId 조회할 입양자 고유 ID
     * @returns 입양자 정보 (비밀번호 제외) 또는 null
     */
    async findById(adopterId: string): Promise<AdopterDocument | null> {
        try {
            return await this.adopterModel.findById(adopterId).select('-password_hash').exec();
        } catch (error) {
            throw new Error(`입양자 조회 실패: ${error.message}`);
        }
    }

    /**
     * 입양자 ID로 전체 데이터 조회 (관리자용)
     * 비밀번호는 여전히 제외
     *
     * @param adopterId 조회할 입양자 고유 ID
     * @returns 입양자 전체 정보 (비밀번호 제외) 또는 null
     */
    async findByIdWithAllData(adopterId: string): Promise<AdopterDocument | null> {
        try {
            return await this.adopterModel.findById(adopterId).select('-password_hash').exec();
        } catch (error) {
            throw new Error(`입양자 전체 정보 조회 실패: ${error.message}`);
        }
    }

    /**
     * 이메일로 입양자 조회 (로그인 시 사용)
     * 비밀번호 포함하여 반환
     *
     * @param email 조회할 이메일 주소
     * @returns 입양자 정보 (비밀번호 포함) 또는 null
     */
    async findByEmail(email: string): Promise<AdopterDocument | null> {
        try {
            return await this.adopterModel.findOne({ email_address: email.toLowerCase() }).exec();
        } catch (error) {
            throw new Error(`이메일로 입양자 조회 실패: ${error.message}`);
        }
    }

    /**
     * 새로운 입양자 계정 생성
     * 이메일 중복 체크는 Service Layer에서 처리됨
     *
     * @param adopterData 생성할 입양자 데이터
     * @returns 생성된 입양자 정보
     */
    async create(adopterData: Partial<Adopter>): Promise<AdopterDocument> {
        try {
            const adopter = new this.adopterModel({
                ...adopterData,
                created_at: new Date(),
                updated_at: new Date(),
                last_activity_at: new Date(),
            });
            return await adopter.save();
        } catch (error) {
            if (error.code === 11000) {
                throw new Error('이미 등록된 이메일 주소입니다.');
            }
            throw new Error(`입양자 생성 실패: ${error.message}`);
        }
    }

    /**
     * 입양자 프로필 정보 업데이트
     * 수정 시각 자동 갱신
     *
     * @param adopterId 수정할 입양자 ID
     * @param updateData 수정할 데이터
     * @returns 수정된 입양자 정보 또는 null
     */
    async updateProfile(adopterId: string, updateData: any): Promise<AdopterDocument | null> {
        try {
            return await this.adopterModel
                .findByIdAndUpdate(
                    adopterId,
                    {
                        $set: {
                            ...updateData,
                            updated_at: new Date(),
                            last_activity_at: new Date(),
                        },
                    },
                    { new: true, runValidators: true },
                )
                .select('-password_hash')
                .exec();
        } catch (error) {
            throw new Error(`입양자 프로필 업데이트 실패: ${error.message}`);
        }
    }

    /**
     * 즐겨찾기 브리더 추가
     * 중복 체크는 Service Layer에서 처리됨
     *
     * @param adopterId 입양자 ID
     * @param favoriteData 즐겨찾기할 브리더 정보
     */
    async addFavoriteBreeder(adopterId: string, favoriteData: any): Promise<void> {
        try {
            await this.adopterModel
                .findByIdAndUpdate(adopterId, {
                    $push: { favorite_breeder_list: favoriteData },
                    $set: {
                        updated_at: new Date(),
                        last_activity_at: new Date(),
                    },
                })
                .exec();
        } catch (error) {
            throw new Error(`즐겨찾기 브리더 추가 실패: ${error.message}`);
        }
    }

    /**
     * 즐겨찾기 브리더 제거
     *
     * @param adopterId 입양자 ID
     * @param breederId 제거할 브리더 ID
     */
    async removeFavoriteBreeder(adopterId: string, breederId: string): Promise<void> {
        try {
            await this.adopterModel
                .findByIdAndUpdate(adopterId, {
                    $pull: { favorite_breeder_list: { favorite_breeder_id: breederId } },
                    $set: {
                        updated_at: new Date(),
                        last_activity_at: new Date(),
                    },
                })
                .exec();
        } catch (error) {
            throw new Error(`즐겨찾기 브리더 제거 실패: ${error.message}`);
        }
    }

    /**
     * 입양 신청 내역 추가
     * 신청 일시 자동 설정
     *
     * @param adopterId 입양자 ID
     * @param applicationData 입양 신청 데이터
     */
    async addApplication(adopterId: string, applicationData: any): Promise<void> {
        try {
            await this.adopterModel
                .findByIdAndUpdate(adopterId, {
                    $push: { adoption_application_list: applicationData },
                    $set: {
                        updated_at: new Date(),
                        last_activity_at: new Date(),
                    },
                })
                .exec();
        } catch (error) {
            throw new Error(`입양 신청 추가 실패: ${error.message}`);
        }
    }

    /**
     * 입양 신청 상태 업데이트
     * MongoDB 배열 내 특정 요소 수정
     *
     * @param adopterId 입양자 ID
     * @param applicationId 입양 신청 ID
     * @param status 변경할 상태
     */
    async updateApplicationStatus(adopterId: string, applicationId: string, status: string): Promise<void> {
        try {
            await this.adopterModel
                .findOneAndUpdate(
                    {
                        _id: adopterId,
                        'adoption_application_list.application_id': applicationId,
                    },
                    {
                        $set: {
                            'adoption_application_list.$.application_status': status,
                            'adoption_application_list.$.updated_at': new Date(),
                            updated_at: new Date(),
                            last_activity_at: new Date(),
                        },
                    },
                )
                .exec();
        } catch (error) {
            throw new Error(`입양 신청 상태 업데이트 실패: ${error.message}`);
        }
    }

    /**
     * 작성한 후기 추가
     * 후기 작성 일시 자동 설정
     *
     * @param adopterId 입양자 ID
     * @param reviewData 후기 데이터
     */
    async addReview(adopterId: string, reviewData: any): Promise<void> {
        try {
            await this.adopterModel
                .findByIdAndUpdate(adopterId, {
                    $push: { written_review_list: reviewData },
                    $set: {
                        updated_at: new Date(),
                        last_activity_at: new Date(),
                    },
                })
                .exec();
        } catch (error) {
            throw new Error(`후기 추가 실패: ${error.message}`);
        }
    }

    /**
     * 입양 신청에 대한 후기 작성 완료 표시
     *
     * @param adopterId 입양자 ID
     * @param applicationId 입양 신청 ID
     */
    async markReviewWritten(adopterId: string, applicationId: string): Promise<void> {
        try {
            await this.adopterModel
                .findOneAndUpdate(
                    {
                        _id: adopterId,
                        'adoption_application_list.application_id': applicationId,
                    },
                    {
                        $set: {
                            'adoption_application_list.$.is_review_written': true,
                            updated_at: new Date(),
                            last_activity_at: new Date(),
                        },
                    },
                )
                .exec();
        } catch (error) {
            throw new Error(`후기 작성 완료 표시 실패: ${error.message}`);
        }
    }

    /**
     * 특정 입양 신청 내역 조회
     * 임베디드 배열에서 특정 요소 검색
     *
     * @param adopterId 입양자 ID
     * @param applicationId 입양 신청 ID
     * @returns 입양 신청 정보 또는 null
     */
    async findApplicationById(adopterId: string, applicationId: string): Promise<any | null> {
        try {
            const adopter = await this.adopterModel.findById(adopterId).lean().exec();
            if (!adopter) return null;

            return adopter.adoption_application_list?.find((app: any) => app.application_id === applicationId) || null;
        } catch (error) {
            throw new Error(`입양 신청 조회 실패: ${error.message}`);
        }
    }

    /**
     * 기존 입양 신청 존재 확인
     * 중복 신청 방지를 위한 검증용
     *
     * @param adopterId 입양자 ID
     * @param breederId 브리더 ID
     * @param petId 반려동물 ID
     * @returns 기존 신청 정보 또는 null
     */
    async findExistingApplication(adopterId: string, breederId: string, petId: string): Promise<any | null> {
        try {
            const adopter = await this.adopterModel.findById(adopterId).lean().exec();
            if (!adopter) return null;

            return (
                adopter.adoption_application_list?.find(
                    (app: any) => app.target_breeder_id === breederId && app.target_pet_id === petId,
                ) || null
            );
        } catch (error) {
            throw new Error(`기존 입양 신청 확인 실패: ${error.message}`);
        }
    }

    /**
     * 기존 즐겨찾기 브리더 확인
     * 중복 즐겨찾기 방지를 위한 검증용
     *
     * @param adopterId 입양자 ID
     * @param breederId 브리더 ID
     * @returns 즐겨찾기 정보 또는 null
     */
    async findExistingFavorite(adopterId: string, breederId: string): Promise<any | null> {
        try {
            const adopter = await this.adopterModel.findById(adopterId).lean().exec();
            if (!adopter) return null;

            return adopter.favorite_breeder_list?.find((fav: any) => fav.favorite_breeder_id === breederId) || null;
        } catch (error) {
            throw new Error(`기존 즐겨찾기 확인 실패: ${error.message}`);
        }
    }

    /**
     * 입양자 계정 비활성화 (소프트 삭제)
     * 실제 데이터는 보존하되 상태만 변경
     *
     * @param adopterId 비활성화할 입양자 ID
     */
    async softDelete(adopterId: string): Promise<void> {
        try {
            await this.adopterModel
                .findByIdAndUpdate(adopterId, {
                    $set: {
                        account_status: 'deactivated',
                        updated_at: new Date(),
                    },
                })
                .exec();
        } catch (error) {
            throw new Error(`입양자 계정 비활성화 실패: ${error.message}`);
        }
    }

    /**
     * 활성 입양자 수 통계 조회 (관리자용)
     * 대시보드 및 분석용 데이터
     *
     * @returns 활성 입양자 수
     */
    async countActiveAdopters(): Promise<number> {
        try {
            return await this.adopterModel
                .countDocuments({
                    account_status: { $in: ['active', 'suspended'] },
                })
                .exec();
        } catch (error) {
            throw new Error(`활성 입양자 수 조회 실패: ${error.message}`);
        }
    }

    /**
     * 입양자 최근 활동 시간 업데이트
     * 사용자 행동 추적 및 활성도 분석용
     *
     * @param adopterId 입양자 ID
     */
    async updateLastActivity(adopterId: string): Promise<void> {
        try {
            await this.adopterModel.findByIdAndUpdate(adopterId, { $set: { last_activity_at: new Date() } }).exec();
        } catch (error) {
            // 치명적이지 않은 오류이므로 로깅만 수행
            console.error(`입양자 활동 시간 업데이트 실패: ${error.message}`);
        }
    }

    /**
     * 입양자 검색 (관리자용)
     * 페이지네이션 및 필터링 지원
     *
     * @param filters 검색 필터 (이름, 이메일, 상태 등)
     * @param page 페이지 번호 (기본값: 1)
     * @param limit 페이지당 항목 수 (기본값: 20)
     * @returns 페이지네이션된 입양자 목록
     */
    async findWithFilters(filters: any, page: number = 1, limit: number = 20): Promise<any> {
        try {
            const query: any = {};

            // 필터 조건 동적 구성
            if (filters.status) {
                query.account_status = filters.status;
            }
            if (filters.email) {
                query.email_address = new RegExp(filters.email, 'i');
            }
            if (filters.name) {
                query.full_name = new RegExp(filters.name, 'i');
            }
            if (filters.dateFrom) {
                query.created_at = { ...query.created_at, $gte: new Date(filters.dateFrom) };
            }
            if (filters.dateTo) {
                query.created_at = { ...query.created_at, $lte: new Date(filters.dateTo) };
            }

            const skip = (page - 1) * limit;

            const [adopters, total] = await Promise.all([
                this.adopterModel
                    .find(query)
                    .select('-password_hash')
                    .sort({ created_at: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean()
                    .exec(),
                this.adopterModel.countDocuments(query).exec(),
            ]);

            return {
                adopters,
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
            throw new Error(`입양자 검색 실패: ${error.message}`);
        }
    }
}
