import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { ApplicationStatus, ReportStatus } from '../../common/enum/user.enum';
import { StorageService } from '../../common/storage/storage.service';

import { BreederReview, BreederReviewDocument } from '../../schema/breeder-review.schema';
import { AdoptionApplication, AdoptionApplicationDocument } from '../../schema/adoption-application.schema';

import { AdopterRepository } from './adopter.repository';
import { BreederRepository } from '../breeder-management/breeder.repository';

import { AdopterMapper } from './mapper/adopter.mapper';

import { FavoriteAddRequestDto } from './dto/request/favorite-add-request.dto';
import { ReviewCreateRequestDto } from './dto/request/review-create-request.dto';
import { ReportCreateRequestDto } from './dto/request/report-create-request.dto';
import { ApplicationCreateRequestDto } from './dto/request/application-create-request.dto';
import { AdopterProfileResponseDto } from './dto/response/adopter-profile-response.dto';

/**
 * 입양자 비즈니스 로직 처리 Service
 *
 * 역할:
 * - 입양 신청, 후기 작성, 즐겨찾기, 신고 등 입양자 핵심 기능 처리
 * - Repository 계층과 Controller 계층 사이의 비즈니스 로직 담당
 * - 복잡한 비즈니스 규칙 검증 및 데이터 일관성 보장
 * - 도메인 간 데이터 동기화 및 관계 관리
 *
 * 설계 원칙:
 * - 단일 책임 원칙: 입양자 도메인 비즈니스 로직만 담당
 * - 의존성 주입: Repository를 통한 데이터 접근
 * - 트랜잭션 일관성: 관련 데이터 동시 업데이트
 * - 예외 안전성: 모든 에러 케이스 대응
 */
@Injectable()
export class AdopterService {
    constructor(
        private adopterRepository: AdopterRepository,
        private breederRepository: BreederRepository,
        private storageService: StorageService,
        @InjectModel(BreederReview.name) private breederReviewModel: Model<BreederReviewDocument>,
        @InjectModel(AdoptionApplication.name) private adoptionApplicationModel: Model<AdoptionApplicationDocument>,
    ) {}

    /**
     * 입양 신청서 제출 처리
     *
     * 별도 컬렉션(adoption_applications)에 신청 정보를 저장합니다.
     * 입양자와 브리더 양쪽에서 이 컬렉션을 참조합니다.
     *
     * 비즈니스 규칙:
     * - 입양자 계정 상태 확인 필수
     * - 브리더 존재 여부 검증
     * - 반려동물 ID는 선택사항 (특정 개체 또는 전체 상담)
     * - 개인정보 수집 동의 필수
     * - 중복 신청 방지 검증 (같은 브리더에게 대기 중인 신청이 있는 경우)
     *
     * @param userId 입양자 고유 ID (JWT에서 추출)
     * @param dto 입양 신청 데이터 (Figma 디자인 기반 필드)
     * @returns 생성된 신청서 정보
     * @throws BadRequestException 잘못된 요청 데이터
     * @throws ConflictException 중복 신청 시도
     */
    async createApplication(userId: string, dto: ApplicationCreateRequestDto): Promise<any> {
        // 1. 입양자 계정 존재 및 상태 검증
        const adopter = await this.adopterRepository.findById(userId);
        if (!adopter) {
            throw new BadRequestException('입양자 정보를 찾을 수 없습니다.');
        }

        // 2. 개인정보 수집 동의 확인
        if (!dto.privacyConsent) {
            throw new BadRequestException('개인정보 수집 및 이용에 동의해야 신청이 가능합니다.');
        }

        // 3. 브리더 계정 존재 검증
        const breeder = await this.breederRepository.findById(dto.breederId);
        if (!breeder) {
            throw new BadRequestException('해당 브리더를 찾을 수 없습니다.');
        }

        // 4. 반려동물 검증 (petId가 있는 경우에만)
        let pet: any = null;
        if (dto.petId) {
            pet = await this.breederRepository.findAvailablePetById(dto.breederId, dto.petId);
            if (!pet) {
                throw new BadRequestException('해당 반려동물을 찾을 수 없습니다.');
            }

            if (pet.status !== 'available') {
                throw new BadRequestException('현재 분양 신청이 불가능한 반려동물입니다.');
            }
        }

        // 5. 중복 신청 방지 검증 (같은 브리더에게 대기 중인 신청이 있는지 확인)
        const existingPendingApplication = await this.adoptionApplicationModel.findOne({
            adopterId: userId,
            breederId: dto.breederId,
            status: ApplicationStatus.CONSULTATION_PENDING,
        });

        if (existingPendingApplication) {
            throw new ConflictException('해당 브리더에게 이미 대기 중인 상담 신청이 있습니다.');
        }

        // 6. AdoptionApplication 컬렉션에 저장할 데이터 구성
        const newApplication = new this.adoptionApplicationModel({
            breederId: dto.breederId,
            adopterId: userId,
            adopterName: adopter.nickname,
            adopterEmail: adopter.emailAddress,
            adopterPhone: adopter.phoneNumber || '',
            petId: pet ? dto.petId : undefined,
            petName: pet ? pet.name : undefined,
            status: ApplicationStatus.CONSULTATION_PENDING,
            applicationData: {
                privacyConsent: dto.privacyConsent,
                selfIntroduction: dto.selfIntroduction,
                familyMembers: dto.familyMembers,
                allFamilyConsent: dto.allFamilyConsent,
                allergyTestInfo: dto.allergyTestInfo,
                timeAwayFromHome: dto.timeAwayFromHome,
                livingSpaceDescription: dto.livingSpaceDescription,
                previousPetExperience: dto.previousPetExperience,
            },
            appliedAt: new Date(),
        });

        const savedApplication = await newApplication.save();

        // 7. 응답 데이터 구성 (Mapper 패턴 사용)
        return AdopterMapper.toApplicationCreateResponse(savedApplication, breeder.name, pet?.name);
    }

    /**
     * 입양 후기 작성 처리 (단순화)
     *
     * 변경사항:
     * - applicationId 검증 제거 (자유롭게 작성 가능)
     * - 브리더 존재 여부만 확인
     * - 중복 후기 방지
     *
     * @param userId 입양자 고유 ID (JWT에서 추출)
     * @param createReviewDto 후기 작성 데이터
     * @returns 생성된 후기 ID 및 성공 메시지
     * @throws BadRequestException 잘못된 요청
     */
    async createReview(userId: string, createReviewDto: ReviewCreateRequestDto): Promise<any> {
        const { breederId, reviewType, content } = createReviewDto;

        // 1. 입양자 존재 확인
        const adopter = await this.adopterRepository.findById(userId);
        if (!adopter) {
            throw new BadRequestException('입양자 정보를 찾을 수 없습니다.');
        }

        // 2. 브리더 존재 확인
        const breeder = await this.breederRepository.findById(breederId);
        if (!breeder) {
            throw new BadRequestException('해당 브리더를 찾을 수 없습니다.');
        }

        // 3. 중복 후기 작성 방지 (같은 브리더에게 이미 작성한 후기가 있는지 확인)
        const existingReview = await this.breederReviewModel.findOne({
            adopterId: userId,
            breederId: breederId,
        });

        if (existingReview) {
            throw new ConflictException('이미 해당 브리더에 대한 후기를 작성하셨습니다.');
        }

        // 4. BreederReview 컬렉션에 후기 저장
        const newReview = new this.breederReviewModel({
            breederId: breederId,
            adopterId: userId,
            type: reviewType,
            content: content,
            writtenAt: new Date(),
            isVisible: true,
        });

        const savedReview = await newReview.save();

        // 5. 브리더 통계 업데이트
        await this.breederRepository.incrementReviewCount(breederId);

        return {
            reviewId: (savedReview._id as any).toString(),
            message: '후기가 성공적으로 등록되었습니다.',
        };
    }

    /**
     * 즐겨찾기 브리더 추가
     * 브리더 기본 정보를 캐시하여 빠른 조회 지원
     *
     * 비즈니스 규칙:
     * - 중복 즐겨찾기 방지
     * - 브리더 기본 정보 스냅샷 저장
     * - 실시간 브리더 정보 반영
     *
     * @param userId 입양자 고유 ID
     * @param addFavoriteDto 즐겨찾기 추가 데이터
     * @returns 성공 메시지
     * @throws ConflictException 이미 즐겨찾기된 브리더
     */
    async addFavorite(userId: string, addFavoriteDto: FavoriteAddRequestDto): Promise<any> {
        const { breederId } = addFavoriteDto;

        const adopter = await this.adopterRepository.findById(userId);
        if (!adopter) {
            throw new BadRequestException('입양자 정보를 찾을 수 없습니다.');
        }

        const breeder = await this.breederRepository.findById(breederId);
        if (!breeder) {
            throw new BadRequestException('해당 브리더를 찾을 수 없습니다.');
        }

        // 중복 즐겨찾기 검증
        const existingFavorite = await this.adopterRepository.findExistingFavorite(userId, breederId);
        if (existingFavorite) {
            throw new ConflictException('이미 즐겨찾기에 추가된 브리더입니다.');
        }

        // 즐겨찾기 데이터 구성 (Mapper 패턴 사용)
        const favorite = AdopterMapper.toFavoriteBreeder(breederId, breeder);

        await this.adopterRepository.addFavoriteBreeder(userId, favorite);

        return { message: '브리더를 즐겨찾기에 추가했습니다.' };
    }

    /**
     * 즐겨찾기 브리더 제거
     *
     * @param userId 입양자 고유 ID
     * @param breederId 제거할 브리더 ID
     * @returns 성공 메시지
     * @throws BadRequestException 존재하지 않는 즐겨찾기
     */
    async removeFavorite(userId: string, breederId: string): Promise<any> {
        const adopter = await this.adopterRepository.findById(userId);
        if (!adopter) {
            throw new BadRequestException('입양자 정보를 찾을 수 없습니다.');
        }

        const existingFavorite = await this.adopterRepository.findExistingFavorite(userId, breederId);
        if (!existingFavorite) {
            throw new BadRequestException('즐겨찾기 목록에서 해당 브리더를 찾을 수 없습니다.');
        }

        await this.adopterRepository.removeFavoriteBreeder(userId, breederId);

        return { message: '즐겨찾기에서 브리더를 제거했습니다.' };
    }

    /**
     * 즐겨찾기 브리더 목록 조회
     * 페이지네이션을 지원하며, 브리더의 최신 정보와 함께 반환
     *
     * @param userId 입양자 고유 ID
     * @param page 페이지 번호 (기본값: 1)
     * @param limit 페이지당 항목 수 (기본값: 10)
     * @returns 즐겨찾기 브리더 목록과 페이지네이션 정보
     * @throws BadRequestException 존재하지 않는 입양자
     */
    async getFavoriteList(userId: string, page: number = 1, limit: number = 10): Promise<any> {
        const adopter = await this.adopterRepository.findById(userId);
        if (!adopter) {
            throw new BadRequestException('입양자 정보를 찾을 수 없습니다.');
        }

        const { favorites, total } = await this.adopterRepository.findFavoriteList(userId, page, limit);

        // 각 즐겨찾기 브리더의 최신 정보 조회 (Mapper 패턴 사용)
        const favoriteListWithDetails = await Promise.all(
            favorites.map(async (fav: any) => {
                try {
                    const breeder = await this.breederRepository.findById(fav.favoriteBreederId);
                    return AdopterMapper.toFavoriteDetail(fav, breeder);
                } catch (error) {
                    // 에러 발생 시 기본 정보 반환
                    return AdopterMapper.toFavoriteDetail(fav, null);
                }
            }),
        );

        const totalPages = Math.ceil(total / limit);

        return {
            items: favoriteListWithDetails,
            pagination: {
                currentPage: page,
                pageSize: limit,
                totalItems: total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        };
    }

    /**
     * 브리더 신고 제출
     * 관리자 검토를 위한 신고 내역 생성
     *
     * 비즈니스 규칙:
     * - 신고자 정보 기록 및 추적
     * - 신고 사유 및 상세 내용 필수
     * - 관리자 검토 대기 상태로 초기화
     *
     * @param userId 신고자 (입양자) 고유 ID
     * @param createReportDto 신고 내용 데이터
     * @returns 생성된 신고 ID 및 성공 메시지
     */
    async createReport(userId: string, createReportDto: ReportCreateRequestDto): Promise<any> {
        const { breederId, type, description } = createReportDto;

        const adopter = await this.adopterRepository.findById(userId);
        if (!adopter) {
            throw new BadRequestException('입양자 정보를 찾을 수 없습니다.');
        }

        const breeder = await this.breederRepository.findById(breederId);
        if (!breeder) {
            throw new BadRequestException('신고할 브리더를 찾을 수 없습니다.');
        }

        const reportId = randomUUID();

        // 신고 데이터 구성 (Mapper 패턴 사용)
        const report = AdopterMapper.toReport(
            reportId,
            userId,
            adopter.nickname,
            type,
            description,
            ReportStatus.PENDING,
        );

        await this.breederRepository.addReport(breederId, report);

        return {
            reportId,
            message: '신고가 성공적으로 접수되었습니다. 관리자 검토 후 처리됩니다.',
        };
    }

    /**
     * 입양자 프로필 정보 조회
     * 즐겨찾기, 입양 신청 내역, 작성한 후기 등 전체 데이터 포함
     *
     * @param userId 입양자 고유 ID
     * @returns 입양자 전체 프로필 정보
     * @throws BadRequestException 존재하지 않는 입양자
     */
    async getProfile(userId: string): Promise<AdopterProfileResponseDto> {
        const adopter = await this.adopterRepository.findById(userId);
        if (!adopter) {
            throw new BadRequestException('입양자 정보를 찾을 수 없습니다.');
        }

        // 프로필 응답 데이터 구성 (Mapper 패턴 사용)
        const profileResponse = AdopterMapper.toProfileResponse(adopter);

        // 파일명을 Signed URL로 변환 (1시간 유효)
        if (profileResponse.profileImageFileName) {
            profileResponse.profileImageFileName = this.storageService.generateSignedUrlSafe(
                profileResponse.profileImageFileName,
                60,
            );
        }

        return profileResponse;
    }

    /**
     * 입양자 프로필 정보 수정
     * 이름, 연락처, 프로필 이미지 등 기본 정보 변경
     *
     * @param userId 입양자 고유 ID
     * @param updateData 수정할 프로필 데이터
     * @returns 성공 메시지
     * @throws BadRequestException 존재하지 않는 입양자
     */
    async updateProfile(
        userId: string,
        updateData: { name?: string; phone?: string; profileImage?: string },
    ): Promise<any> {
        // 요청 데이터를 데이터베이스 스키마에 맞게 변환 (Mapper 패턴 사용)
        const mappedUpdateData = AdopterMapper.toProfileUpdateData(updateData);

        const adopter = await this.adopterRepository.updateProfile(userId, mappedUpdateData);

        if (!adopter) {
            throw new BadRequestException('입양자 정보를 찾을 수 없습니다.');
        }

        return { message: '프로필이 성공적으로 수정되었습니다.' };
    }

    /**
     * 입양자가 작성한 후기 목록 조회 (브리더 상세 정보 포함)
     *
     * 반환 정보:
     * - 브리더 닉네임, 프로필 사진, 레벨, 브리딩 동물 종류
     * - 후기 내용, 후기 종류, 작성 일자
     * - 최신순 정렬, 페이지당 10개
     *
     * @param userId 입양자 고유 ID
     * @param page 페이지 번호
     * @param limit 페이지당 항목 수
     * @returns 후기 목록과 페이지네이션 정보
     */
    async getMyReviews(userId: string, page: number = 1, limit: number = 10): Promise<any> {
        const adopter = await this.adopterRepository.findById(userId);
        if (!adopter) {
            throw new BadRequestException('입양자 정보를 찾을 수 없습니다.');
        }

        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            this.breederReviewModel
                .find({ adopterId: userId })
                .sort({ writtenAt: -1 }) // 최신순 정렬
                .skip(skip)
                .limit(limit)
                .populate('breederId', 'nickname profileImageFileName verification.level petType') // 브리더 상세 정보
                .lean()
                .exec(),
            this.breederReviewModel.countDocuments({ adopterId: userId }).exec(),
        ]);

        const formattedReviews = reviews.map((review: any) => {
            const breeder = review.breederId;
            return {
                reviewId: review._id.toString(),
                breederNickname: breeder?.nickname || '알 수 없음',
                breederProfileImage: breeder?.profileImageFileName
                    ? this.storageService.generateSignedUrlSafe(breeder.profileImageFileName, 60)
                    : null,
                breederLevel: breeder?.verification?.level || 'new',
                breedingPetType: breeder?.petType || 'unknown',
                content: review.content,
                reviewType: review.type,
                writtenAt: review.writtenAt,
            };
        });

        const totalPages = Math.ceil(total / limit);

        return {
            items: formattedReviews,
            pagination: {
                currentPage: page,
                pageSize: limit,
                totalItems: total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        };
    }

    /**
     * 후기 세부 조회
     *
     * @param userId 입양자 고유 ID
     * @param reviewId 후기 ID
     * @returns 후기 세부 정보
     */
    async getReviewDetail(userId: string, reviewId: string): Promise<any> {
        const review = await this.breederReviewModel
            .findOne({ _id: reviewId, adopterId: userId })
            .populate('breederId', 'nickname profileImageFileName verification.level petType')
            .lean()
            .exec();

        if (!review) {
            throw new BadRequestException('후기를 찾을 수 없습니다.');
        }

        const breeder = review.breederId as any;

        return {
            reviewId: review._id.toString(),
            breederNickname: breeder?.nickname || '알 수 없음',
            breederProfileImage: breeder?.profileImageFileName
                ? this.storageService.generateSignedUrlSafe(breeder.profileImageFileName, 60)
                : null,
            breederLevel: breeder?.verification?.level || 'new',
            breedingPetType: breeder?.petType || 'unknown',
            content: review.content,
            reviewType: review.type,
            writtenAt: review.writtenAt,
            isVisible: review.isVisible,
        };
    }
}
