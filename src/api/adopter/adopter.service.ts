import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
    Inject,
    forwardRef,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import { ApplicationStatus, ReviewType, ReportStatus } from '../../common/enum/user.enum';

import { AdopterRepository } from './adopter.repository';
import { BreederRepository } from '../breeder-management/breeder.repository';

import { ApplicationCreateRequestDto } from './dto/request/application-create-request.dto';
import { ReviewCreateRequestDto } from './dto/request/review-create-request.dto';
import { FavoriteAddRequestDto } from './dto/request/favorite-add-request.dto';
import { ReportCreateRequestDto } from './dto/request/report-create-request.dto';
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
    ) {}

    /**
     * 입양 신청서 제출 처리
     * 입양자와 브리더 양쪽에 신청 내역 동시 저장
     *
     * 비즈니스 규칙:
     * - 입양자 계정 상태 확인 필수
     * - 브리더 및 반려동물 존재 여부 검증
     * - 반려동물 분양 가능 상태 확인
     * - 중복 신청 방지 검증
     * - 양방향 데이터 동기화 (입양자 ↔ 브리더)
     *
     * @param userId 입양자 고유 ID
     * @param createApplicationDto 입양 신청 데이터
     * @returns 생성된 신청서 ID 및 성공 메시지
     * @throws BadRequestException 잘못된 요청 데이터
     * @throws ConflictException 중복 신청 시도
     */
    async createApplication(userId: string, createApplicationDto: ApplicationCreateRequestDto): Promise<any> {
        const { breederId, petId, applicationForm, message, experienceLevel, livingEnvironment, hasOtherPets } = createApplicationDto;

        // 입양자 계정 존재 및 상태 검증
        const adopter = await this.adopterRepository.findById(userId);
        if (!adopter) {
            throw new BadRequestException('입양자 정보를 찾을 수 없습니다.');
        }

        // 브리더 계정 및 반려동물 존재 검증
        const breeder = await this.breederRepository.findById(breederId);
        if (!breeder) {
            throw new BadRequestException('해당 브리더를 찾을 수 없습니다.');
        }

        const pet = await this.breederRepository.findAvailablePetById(breederId, petId);
        if (!pet) {
            throw new BadRequestException('해당 반려동물을 찾을 수 없습니다.');
        }

        if (pet.status !== 'available') {
            throw new BadRequestException('현재 분양 신청이 불가능한 반려동물입니다.');
        }

        // 중복 신청 방지 검증
        const existingApplication = await this.adopterRepository.findExistingApplication(userId, breederId, petId);
        if (existingApplication) {
            throw new ConflictException('이미 해당 반려동물에 대한 입양 신청을 제출하셨습니다.');
        }

        const applicationId = randomUUID();

        // 입양자 신청 내역에 저장할 데이터 구성
        const newApplication = {
            application_id: applicationId,
            target_breeder_id: breederId,
            target_breeder_name: breeder.name,
            target_pet_id: petId,
            target_pet_name: pet.name,
            pet_type: pet.type,
            pet_breed_name: pet.breed,
            application_form_data: applicationForm || {},
            application_status: ApplicationStatus.CONSULTATION_PENDING,
            applied_at: new Date(),
            updated_at: new Date(),
            is_review_written: false,
        };

        await this.adopterRepository.addApplication(userId, newApplication);

        // 브리더 수신 신청 내역에 저장할 데이터 구성
        const receivedApplication = {
            applicationId,
            adopterId: userId,
            adopterName: adopter.full_name,
            adopterEmail: adopter.email_address,
            petId,
            petName: pet.name,
            status: ApplicationStatus.CONSULTATION_PENDING,
            applicationData: applicationForm || {},
            appliedAt: new Date(),
        };

        await this.breederRepository.addReceivedApplication(breederId, receivedApplication);

        return {
            applicationId,
            message: '입양 신청이 성공적으로 제출되었습니다.',
        };
    }

    /**
     * 입양 후기 작성 처리
     * 입양자와 브리더 양쪽에 후기 데이터 동기화 저장
     *
     * 비즈니스 규칙:
     * - 완료된 입양 신청에 대해서만 후기 작성 가능
     * - 한 번의 입양 신청당 하나의 후기만 작성 가능
     * - 브리더 평균 평점 실시간 업데이트
     * - 후기 작성 완료 상태 마킹
     *
     * @param userId 입양자 고유 ID
     * @param createReviewDto 후기 작성 데이터
     * @returns 생성된 후기 ID 및 성공 메시지
     * @throws BadRequestException 잘못된 요청 또는 비즈니스 규칙 위반
     */
    async createReview(userId: string, createReviewDto: ReviewCreateRequestDto): Promise<any> {
        const { applicationId, reviewType, rating, content, photos = [] } = createReviewDto;

        const adopter = await this.adopterRepository.findById(userId);
        if (!adopter) {
            throw new BadRequestException('입양자 정보를 찾을 수 없습니다.');
        }

        // 해당 입양 신청 내역 조회
        const application = await this.adopterRepository.findApplicationById(userId, applicationId);
        if (!application) {
            throw new BadRequestException('해당 입양 신청 내역을 찾을 수 없습니다.');
        }

        if (application.is_review_written) {
            throw new BadRequestException('이미 해당 입양 신청에 대한 후기를 작성하셨습니다.');
        }

        if (application.application_status === ApplicationStatus.CONSULTATION_PENDING) {
            throw new BadRequestException('상담이 완료된 후에 후기를 작성하실 수 있습니다.');
        }

        const reviewId = randomUUID();

        // 입양자 후기 목록에 저장할 데이터 구성
        const newReview = {
            review_id: reviewId,
            target_breeder_id: application.target_breeder_id,
            target_breeder_name: application.target_breeder_name,
            related_application_id: applicationId,
            review_type: reviewType,
            overall_rating: rating,
            pet_health_rating: rating, // 전체 평점을 기본값으로 설정
            communication_rating: rating, // 전체 평점을 기본값으로 설정
            review_content: content,
            review_photo_urls: photos,
            created_at: new Date(),
            is_visible: true,
        };

        await this.adopterRepository.addReview(userId, newReview);
        await this.adopterRepository.markReviewWritten(userId, applicationId);

        // 브리더 후기 캐시에 저장 및 통계 업데이트
        const breeder = await this.breederRepository.findById(application.target_breeder_id);
        if (breeder) {
            const breederReview = {
                reviewId,
                adopterId: userId,
                adopterName: adopter.full_name,
                applicationId,
                type: reviewType,
                rating,
                content,
                photos,
                writtenAt: new Date(),
                isVisible: true,
            };

            await this.breederRepository.addReview(application.target_breeder_id, breederReview);

            // 브리더 평점 통계 실시간 재계산 및 업데이트
            const updatedBreeder = await this.breederRepository.findById(application.target_breeder_id);
            if (updatedBreeder) {
                const totalReviews = updatedBreeder.reviews.length;
                const totalRating = updatedBreeder.reviews.reduce((sum: any, r: any) => sum + r.rating, 0);
                const averageRating = totalRating / totalReviews;

                await this.breederRepository.updateReviewStats(
                    application.target_breeder_id,
                    averageRating,
                    totalReviews,
                );
            }
        }

        return {
            reviewId,
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

        const favorite = {
            favorite_breeder_id: breederId,
            breeder_name: breeder.name,
            breeder_profile_image_url: breeder.profileImage || '',
            breeder_location: `${breeder.profile?.location?.city || ''} ${breeder.profile?.location?.district || ''}`,
            added_at: new Date(),
        };

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

        const report = {
            reportId,
            reporterId: userId,
            reporterName: adopter.full_name,
            type,
            description,
            reportedAt: new Date(),
            status: ReportStatus.PENDING,
        };

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

        return {
            adopterId: (adopter._id as any).toString(),
            emailAddress: adopter.email_address,
            fullName: adopter.full_name,
            phoneNumber: adopter.phone_number || '',
            profileImageUrl: adopter.profile_image_url,
            accountStatus: adopter.account_status,
            favoriteBreederList: (adopter.favorite_breeder_list || []).map((fav: any) => ({
                breederId: fav.favorite_breeder_id,
                breederName: fav.breeder_name,
                addedAt: fav.added_at,
                breederProfileImageUrl: fav.breeder_profile_image_url,
                breederLocation: fav.breeder_location,
            })),
            adoptionApplicationList: (adopter.adoption_application_list || []).map((app: any) => ({
                applicationId: app.application_id,
                breederId: app.target_breeder_id,
                petId: app.target_pet_id,
                applicationStatus: app.application_status,
                appliedAt: app.applied_at,
            })),
            writtenReviewList: (adopter.written_review_list || []).map((review: any) => ({
                reviewId: review.review_id,
                breederId: review.target_breeder_id,
                rating: review.overall_rating,
                content: review.review_content,
                createdAt: review.created_at,
            })),
            createdAt: (adopter as any).createdAt,
            updatedAt: (adopter as any).updatedAt,
        };
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
        // 요청 데이터를 데이터베이스 스키마에 맞게 변환
        const mappedUpdateData: any = {};
        if (updateData.name) mappedUpdateData.full_name = updateData.name;
        if (updateData.phone) mappedUpdateData.phone_number = updateData.phone;
        if (updateData.profileImage) mappedUpdateData.profile_image_url = updateData.profileImage;

        const adopter = await this.adopterRepository.updateProfile(userId, mappedUpdateData);

        if (!adopter) {
            throw new BadRequestException('입양자 정보를 찾을 수 없습니다.');
        }

        return { message: '프로필이 성공적으로 수정되었습니다.' };
    }
}
