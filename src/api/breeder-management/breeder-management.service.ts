import { Injectable, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

import { VerificationStatus, ApplicationStatus, PetStatus } from '../../common/enum/user.enum';

import { StorageService } from '../../common/storage/storage.service';

import { ParentPetAddDto } from './dto/request/parent-pet-add-request.dto';
import { ParentPetUpdateDto } from './dto/request/parent-pet-update-request.dto';
import { AvailablePetAddDto } from './dto/request/available-pet-add-request.dto';
import { ProfileUpdateRequestDto } from './dto/request/profile-update-request.dto';
import { VerificationSubmitRequestDto } from './dto/request/verification-submit-request.dto';
import { ApplicationStatusUpdateRequestDto } from './dto/request/application-status-update-request.dto';
import { BreederDashboardResponseDto } from '../breeder/dto/response/breeder-dashboard-response.dto';

import { BreederRepository } from './repository/breeder.repository';
import { AdopterRepository } from '../adopter/adopter.repository';
import { ParentPetRepository } from './repository/parent-pet.repository';
import { AdoptionApplicationRepository } from './repository/adoption-application.repository';
import { AvailablePetManagementRepository } from './repository/available-pet-management.repository';

/**
 * 브리더 관리 비즈니스 로직 처리 Service
 *
 * 역할:
 * - 인증된 브리더 전용 기능 처리 (대시보드, 프로필 관리, 반려동물 등록/관리)
 * - 입양 신청 관리 및 상태 업데이트 (승인, 거절, 상담 처리)
 * - 브리더 인증 신청 및 검증 프로세스 관리
 * - 부모견/부모묘 및 분양 가능 개체 등록/수정/삭제
 * - 통계 데이터 수집 및 대시보드 제공
 *
 * 설계 원칙:
 * - 권한 기반 접근: 인증된 브리더만 접근 가능한 기능들
 * - 비즈니스 로직 검증: 데이터 일관성 및 비즈니스 규칙 준수
 * - 도메인 간 동기화: 입양자와 브리더 데이터 일관성 유지
 * - 실시간 통계: 신청, 승인, 완료 등 실시간 데이터 반영
 */
@Injectable()
export class BreederManagementService {
    constructor(
        private storageService: StorageService,

        private breederRepository: BreederRepository,
        private adopterRepository: AdopterRepository,
        private parentPetRepository: ParentPetRepository,
        private availablePetRepository: AvailablePetManagementRepository,
        private adoptionApplicationRepository: AdoptionApplicationRepository,
    ) {}

    /**
     * 브리더 대시보드 데이터 조회
     * 인증 상태, 통계 정보, 최근 신청 내역 등 종합적인 대시보드 정보 제공
     *
     * @param userId 브리더 고유 ID
     * @returns 대시보드에 필요한 모든 데이터
     * @throws BadRequestException 존재하지 않는 브리더
     */
    async getDashboard(userId: string): Promise<BreederDashboardResponseDto> {
        const breeder = await this.breederRepository.findById(userId);
        if (!breeder) {
            throw new BadRequestException('브리더 정보를 찾을 수 없습니다.');
        }

        // 대기 중인 입양 신청 수 계산 (별도 컬렉션 조회)
        const pendingApplications = await this.adoptionApplicationRepository.countByStatus(
            userId,
            ApplicationStatus.CONSULTATION_PENDING,
        );

        // 최근 신청 내역 (최대 5개)
        const recentApplicationsList = await this.adoptionApplicationRepository.findRecentByBreeder(userId, 5);

        // 분양 가능한 반려동물 수 계산 (별도 컬렉션 조회)
        const availablePetsCount = await this.availablePetRepository.countByStatus(userId, PetStatus.AVAILABLE, true);

        return {
            profileInfo: {
                verificationInfo: {
                    verificationStatus: breeder.verification?.status || VerificationStatus.PENDING,
                    subscriptionPlan: breeder.verification?.plan || 'basic',
                    submittedAt: breeder.verification?.submittedAt,
                    reviewedAt: breeder.verification?.reviewedAt,
                    rejectionReason: breeder.verification?.rejectionReason,
                },
            },
            statisticsInfo: {
                totalApplicationCount: breeder.stats?.totalApplications || 0,
                pendingApplicationCount: pendingApplications,
                completedAdoptionCount: breeder.stats?.completedAdoptions || 0,
                averageRating: breeder.stats?.averageRating || 0,
                totalReviewCount: breeder.stats?.totalReviews || 0,
                profileViewCount: breeder.stats?.profileViews || 0,
            },
            recentApplicationList: recentApplicationsList.map((app: any) => ({
                applicationId: (app._id as any).toString(),
                adopterName: app.adopterName || 'Unknown',
                petName: app.petName || 'Unknown',
                applicationStatus: app.status,
                appliedAt: app.appliedAt,
            })),
            availablePetCount: availablePetsCount,
        };
    }

    /**
     * 브리더 프로필 정보 업데이트
     * 브리더 소개, 위치, 전문 분야, 경력 등 프로필 정보 수정
     *
     * 비즈니스 규칙:
     * - 프로필 사진 최대 3장 제한
     * - 필수 정보와 선택 정보 구분 처리
     * - MongoDB 중첩 객체 업데이트 최적화
     *
     * @param userId 브리더 고유 ID
     * @param updateData 수정할 프로필 데이터
     * @returns 성공 메시지
     * @throws BadRequestException 유효성 검사 실패 또는 존재하지 않는 브리더
     */
    async updateProfile(userId: string, updateData: ProfileUpdateRequestDto): Promise<any> {
        const breeder = await this.breederRepository.findByIdWithAllData(userId);
        if (!breeder) {
            throw new BadRequestException('브리더 정보를 찾을 수 없습니다.');
        }

        const profileUpdateData: any = {};

        // 프로필 객체가 존재하지 않는 경우 초기화
        if (!breeder.profile) {
            profileUpdateData.profile = {};
        }

        // 각 필드별 업데이트 데이터 구성 (MongoDB 중첩 객체 업데이트)
        if (updateData.profileDescription) {
            profileUpdateData['profile.description'] = updateData.profileDescription;
        }
        if (updateData.locationInfo) {
            profileUpdateData['profile.location'] = {
                city: updateData.locationInfo.cityName,
                district: updateData.locationInfo.districtName,
                address: updateData.locationInfo.detailAddress || '',
            };
        }
        if (updateData.profilePhotos) {
            if (updateData.profilePhotos.length > 3) {
                throw new BadRequestException('프로필 사진은 최대 3장까지만 업로드할 수 있습니다.');
            }
            profileUpdateData['profile.representativePhotos'] = updateData.profilePhotos;
        }
        if (updateData.specializationTypes) {
            profileUpdateData['profile.specialization'] = updateData.specializationTypes;
        }
        if (updateData.experienceYears !== undefined) {
            profileUpdateData['profile.experienceYears'] = updateData.experienceYears;
        }
        if (updateData.priceRangeInfo) {
            profileUpdateData['profile.priceRange'] = {
                min: updateData.priceRangeInfo.minimumPrice,
                max: updateData.priceRangeInfo.maximumPrice,
            };
        }

        await this.breederRepository.updateProfile(userId, profileUpdateData);

        return { message: '프로필이 성공적으로 수정되었습니다.' };
    }

    /**
     * 부모견/부모묘 등록
     * 브리더의 종견/종묘 정보를 등록하여 분양 개체의 혈통 정보 제공
     *
     * 비즈니스 규칙:
     * - 부모견당 사진 1장 제한
     * - 건강 정보 필수 입력
     * - 나이는 월 단위를 년 단위로 변환
     * - 고유 ID 자동 생성
     *
     * @param userId 브리더 고유 ID
     * @param parentPetDto 부모견 등록 데이터
     * @returns 생성된 부모견 ID 및 성공 메시지
     * @throws BadRequestException 유효성 검사 실패 또는 존재하지 않는 브리더
     */
    async addParentPet(userId: string, parentPetDto: ParentPetAddDto): Promise<any> {
        const breeder = await this.breederRepository.findById(userId);
        if (!breeder) {
            throw new BadRequestException('브리더 정보를 찾을 수 없습니다.');
        }

        const savedParentPet = await this.parentPetRepository.create({
            breederId: new Types.ObjectId(userId) as any,
            name: parentPetDto.name,
            breed: parentPetDto.breed,
            gender: parentPetDto.gender,
            birthDate: new Date(parentPetDto.birthDate),
            photoFileName: parentPetDto.photoFileName,
            description: parentPetDto.description || '',
            isActive: true,
        });

        return { petId: (savedParentPet._id as any).toString(), message: '부모견/부모묘가 성공적으로 등록되었습니다.' };
    }

    /**
     * 부모견/부모묘 정보 수정
     *
     * @param userId 브리더 고유 ID
     * @param petId 수정할 부모견 ID
     * @param updateData 수정할 데이터
     * @returns 성공 메시지
     * @throws BadRequestException 존재하지 않는 브리더 또는 부모견
     */
    async updateParentPet(userId: string, petId: string, updateData: ParentPetUpdateDto): Promise<any> {
        const pet = await this.parentPetRepository.findByIdAndBreeder(petId, userId);
        if (!pet) {
            throw new BadRequestException('해당 부모견/부모묘를 찾을 수 없습니다.');
        }

        const updateFields: any = {};
        if (updateData.name) updateFields.name = updateData.name;
        if (updateData.breed) updateFields.breed = updateData.breed;
        if (updateData.gender) updateFields.gender = updateData.gender;
        if (updateData.birthDate) updateFields.birthDate = new Date(updateData.birthDate);
        if (updateData.photoFileName) updateFields.photoFileName = updateData.photoFileName;
        if (updateData.description !== undefined) updateFields.description = updateData.description;

        await this.parentPetRepository.update(petId, updateFields);

        return { message: '부모견/부모묘 정보가 성공적으로 수정되었습니다.' };
    }

    /**
     * 부모견/부모묘 삭제
     *
     * @param userId 브리더 고유 ID
     * @param petId 삭제할 부모견 ID
     * @returns 성공 메시지
     * @throws BadRequestException 존재하지 않는 브리더 또는 부모견
     */
    async removeParentPet(userId: string, petId: string): Promise<any> {
        const pet = await this.parentPetRepository.findByIdAndBreeder(petId, userId);
        if (!pet) {
            throw new BadRequestException('해당 부모견/부모묘를 찾을 수 없습니다.');
        }

        await this.parentPetRepository.delete(petId);

        return { message: '부모견/부모묘가 성공적으로 삭제되었습니다.' };
    }

    /**
     * 분양 가능한 반려동물 등록
     * 입양자들이 신청할 수 있는 분양 개체 등록
     *
     * 비즈니스 규칙:
     * - 분양 개체당 사진 1장 제한
     * - 출생일, 가격, 건강 정보 필수
     * - 등록 즉시 분양 가능 상태로 설정
     * - 고유 ID 자동 생성
     *
     * @param userId 브리더 고유 ID
     * @param availablePetDto 분양 개체 등록 데이터
     * @returns 생성된 반려동물 ID 및 성공 메시지
     * @throws BadRequestException 유효성 검사 실패 또는 존재하지 않는 브리더
     */
    async addAvailablePet(userId: string, availablePetDto: AvailablePetAddDto): Promise<any> {
        const breeder = await this.breederRepository.findById(userId);
        if (!breeder) {
            throw new BadRequestException('브리더 정보를 찾을 수 없습니다.');
        }

        const savedPet = await this.availablePetRepository.create({
            breederId: new Types.ObjectId(userId) as any,
            name: availablePetDto.name,
            breed: availablePetDto.breed,
            gender: availablePetDto.gender,
            birthDate: new Date(availablePetDto.birthDate),
            price: availablePetDto.price,
            status: 'available',
            photos: [],
            description: availablePetDto.description || '',
            parentInfo: availablePetDto.parentInfo
                ? {
                      mother: availablePetDto.parentInfo.mother as any,
                      father: availablePetDto.parentInfo.father as any,
                  }
                : undefined,
        });

        return {
            petId: (savedPet._id as any).toString(),
            message: '분양 가능한 반려동물이 성공적으로 등록되었습니다.',
        };
    }

    /**
     * 분양 가능한 반려동물 정보 수정
     *
     * @param userId 브리더 고유 ID
     * @param petId 수정할 반려동물 ID
     * @param updateData 수정할 데이터
     * @returns 성공 메시지
     * @throws BadRequestException 존재하지 않는 브리더 또는 반려동물
     */
    async updateAvailablePet(userId: string, petId: string, updateData: Partial<AvailablePetAddDto>): Promise<any> {
        const pet = await this.availablePetRepository.findByIdAndBreeder(petId, userId);
        if (!pet) {
            throw new BadRequestException('해당 분양 개체를 찾을 수 없습니다.');
        }

        const updateFields: any = {};
        if (updateData.name) updateFields.name = updateData.name;
        if (updateData.breed) updateFields.breed = updateData.breed;
        if (updateData.gender) updateFields.gender = updateData.gender;
        if (updateData.birthDate) updateFields.birthDate = new Date(updateData.birthDate);
        if (updateData.price) updateFields.price = updateData.price;
        if (updateData.description !== undefined) updateFields.description = updateData.description;
        if (updateData.parentInfo) {
            updateFields.parentInfo = {
                mother: updateData.parentInfo.mother,
                father: updateData.parentInfo.father,
            };
        }

        await this.availablePetRepository.update(petId, updateFields);

        return { message: '분양 개체 정보가 성공적으로 수정되었습니다.' };
    }

    /**
     * 분양 개체 상태 업데이트
     * 분양 가능, 예약됨, 분양 완료 등의 상태 변경 처리
     *
     * 비즈니스 규칙:
     * - 분양 완료 시 완료 시각 기록
     * - 예약 시 예약 시각 기록
     * - 상태별 추가 데이터 자동 설정
     *
     * @param userId 브리더 고유 ID
     * @param petId 상태를 변경할 반려동물 ID
     * @param status 변경할 상태
     * @returns 성공 메시지
     * @throws BadRequestException 존재하지 않는 브리더 또는 반려동물
     */
    async updatePetStatus(userId: string, petId: string, status: PetStatus): Promise<any> {
        const pet = await this.availablePetRepository.findByIdAndBreeder(petId, userId);
        if (!pet) {
            throw new BadRequestException('해당 분양 개체를 찾을 수 없습니다.');
        }

        await this.availablePetRepository.updateStatus(petId, status);

        return { message: '반려동물 상태가 성공적으로 업데이트되었습니다.' };
    }

    /**
     * 분양 가능한 반려동물 삭제
     *
     * @param userId 브리더 고유 ID
     * @param petId 삭제할 반려동물 ID
     * @returns 성공 메시지
     * @throws BadRequestException 존재하지 않는 브리더 또는 반려동물
     */
    async removeAvailablePet(userId: string, petId: string): Promise<any> {
        const pet = await this.availablePetRepository.findByIdAndBreeder(petId, userId);
        if (!pet) {
            throw new BadRequestException('해당 분양 개체를 찾을 수 없습니다.');
        }

        await this.availablePetRepository.delete(petId);

        return { message: '분양 개체가 성공적으로 삭제되었습니다.' };
    }

    /**
     * 받은 입양 신청 목록 조회 (페이지네이션)
     *
     * @param userId 브리더 고유 ID
     * @param page 페이지 번호 (기본값: 1)
     * @param limit 페이지당 항목 수 (기본값: 10)
     * @returns 페이지네이션된 입양 신청 목록
     * @throws BadRequestException 존재하지 않는 브리더
     */
    async getReceivedApplications(userId: string, page: number = 1, limit: number = 10): Promise<any> {
        const { applications, total } = await this.adoptionApplicationRepository.findByBreederId(userId, page, limit);

        return {
            applications,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit,
                hasNextPage: (page - 1) * limit + limit < total,
                hasPrevPage: page > 1,
            },
        };
    }

    /**
     * 받은 입양 신청 상세 조회
     * 브리더가 받은 특정 입양 신청의 상세 정보 조회
     *
     * @param userId 브리더 고유 ID
     * @param applicationId 신청 ID
     * @returns 신청 상세 정보
     * @throws BadRequestException 존재하지 않는 신청 또는 권한 없음
     */
    async getApplicationDetail(userId: string, applicationId: string): Promise<any> {
        // 신청 조회 (본인이 받은 신청만 조회 가능)
        const application = await this.adoptionApplicationRepository.findByIdAndBreeder(applicationId, userId);

        if (!application) {
            throw new BadRequestException('해당 입양 신청을 찾을 수 없거나 조회 권한이 없습니다.');
        }

        // 입양자 정보 조회
        const adopter = await this.adopterRepository.findById(application.adopterId.toString());

        return {
            applicationId: (application as any)._id.toString(),
            adopterId: application.adopterId.toString(),
            adopterName: application.adopterName,
            adopterEmail: application.adopterEmail,
            adopterPhone: application.adopterPhone,
            petId: application.petId?.toString(),
            petName: application.petName,
            status: application.status,
            standardResponses: application.standardResponses,
            customResponses: application.customResponses || [],
            appliedAt: application.appliedAt.toISOString(),
            processedAt: application.processedAt?.toISOString(),
            breederNotes: application.breederNotes,
        };
    }

    /**
     * 입양 신청 상태 업데이트
     * 브리더가 받은 입양 신청에 대한 승인, 거절, 상담 처리
     *
     * 비즈니스 규칙:
     * - 양방향 데이터 동기화 (브리더 ↔ 입양자)
     * - 승인 완료 시 통계 업데이트
     * - 처리 메모 선택 사항
     * - 상태 변경 이력 추적
     *
     * @param userId 브리더 고유 ID
     * @param applicationId 처리할 입양 신청 ID
     * @param updateData 상태 및 처리 내용
     * @returns 성공 메시지
     * @throws BadRequestException 존재하지 않는 브리더 또는 신청
     */
    async updateApplicationStatus(
        userId: string,
        applicationId: string,
        updateData: ApplicationStatusUpdateRequestDto,
    ): Promise<any> {
        const application = await this.adoptionApplicationRepository.findByIdAndBreeder(applicationId, userId);

        if (!application) {
            throw new BadRequestException('해당 입양 신청을 찾을 수 없습니다.');
        }

        await this.adoptionApplicationRepository.updateStatus(applicationId, updateData.status as ApplicationStatus);

        // 입양 승인 완료 시 통계 업데이트
        if (updateData.status === ApplicationStatus.ADOPTION_APPROVED) {
            await this.breederRepository.incrementCompletedAdoptions(userId);
        }

        // ✅ 참조 방식: AdoptionApplication 컬렉션만 업데이트하면 됨
        // (입양자 문서에 신청 내역 없음)

        return { message: '입양 신청 상태가 성공적으로 업데이트되었습니다.' };
    }

    /**
     * 브리더 인증 신청 제출
     * 관리자 검토를 위한 브리더 인증 서류 및 정보 제출
     *
     * 비즈니스 규칙:
     * - 이미 인증된 브리더는 재신청 불가
     * - 인증 서류 첨부 필수
     * - 제출 즉시 검토 중 상태로 변경
     * - 이메일 연락처 필수
     *
     * @param userId 브리더 고유 ID
     * @param verificationData 인증 신청 데이터
     * @returns 성공 메시지
     * @throws BadRequestException 이미 인증된 브리더 또는 존재하지 않는 브리더
     */
    async submitVerification(userId: string, verificationData: VerificationSubmitRequestDto): Promise<any> {
        const breeder = await this.breederRepository.findById(userId);
        if (!breeder) {
            throw new BadRequestException('브리더 정보를 찾을 수 없습니다.');
        }

        if (breeder.verification?.status === VerificationStatus.APPROVED) {
            throw new BadRequestException('이미 인증이 완료된 브리더입니다.');
        }

        const verification = {
            status: VerificationStatus.REVIEWING,
            plan: verificationData.plan,
            submittedAt: new Date(),
            documents: verificationData.documents || [],
            submittedByEmail: verificationData.submittedByEmail,
        };

        await this.breederRepository.updateVerification(userId, verification);

        return { message: '브리더 인증 신청이 성공적으로 제출되었습니다. 관리자 검토 후 결과를 알려드립니다.' };
    }

    /**
     * 브리더 인증 상태 조회
     * 인증된 브리더가 자신의 인증 상태와 관련 정보를 확인
     *
     * 반환 정보:
     * - 인증 상태 (pending, reviewing, approved, rejected)
     * - 구독 플랜 및 브리더 레벨
     * - 제출/검토 일시
     * - 인증 문서 URL (Signed URL, 1시간 유효)
     * - 거절 사유 (거절된 경우)
     *
     * @param userId 브리더 고유 ID
     * @returns 인증 상태 정보
     * @throws BadRequestException 존재하지 않는 브리더
     */
    async getVerificationStatus(userId: string): Promise<any> {
        const breeder = await this.breederRepository.findById(userId);
        if (!breeder) {
            throw new BadRequestException('브리더 정보를 찾을 수 없습니다.');
        }

        const verification = breeder.verification;

        // 문서 URL을 Signed URL로 변환 (1시간 유효)
        const documents =
            verification?.documents?.map((doc: any) => ({
                type: doc.type,
                url: this.storageService.generateSignedUrl(doc.fileName, 60),
                uploadedAt: doc.uploadedAt,
            })) || [];

        return {
            status: verification?.status || 'pending',
            plan: verification?.plan,
            level: verification?.level,
            submittedAt: verification?.submittedAt,
            reviewedAt: verification?.reviewedAt,
            documents,
            rejectionReason: verification?.rejectionReason,
            submittedByEmail: verification?.submittedByEmail || false,
        };
    }

    /**
     * 브리더 전체 프로필 정보 조회
     * 브리더 관리 페이지에서 사용할 모든 정보 제공
     *
     * 포함 정보:
     * - 기본 정보 (이름, 이메일, 연락처 등)
     * - 인증 상태 및 프로필 정보
     * - 활성화된 부모견/분양 개체 목록
     * - 공개 가능한 후기 및 통계
     * - 신고 내역 (관리 목적)
     *
     * @param userId 브리더 고유 ID
     * @returns 브리더 전체 프로필 정보
     * @throws BadRequestException 존재하지 않는 브리더
     */
    async getBreederProfile(userId: string): Promise<any> {
        const breeder = await this.breederRepository.findById(userId);
        if (!breeder) {
            throw new BadRequestException('브리더 정보를 찾을 수 없습니다.');
        }

        // 별도 컬렉션에서 데이터 조회
        const [parentPets, availablePets] = await Promise.all([
            this.parentPetRepository.findByBreederId(userId, true),
            this.availablePetRepository.findByBreederIdWithFilters(userId, { includeInactive: false }),
        ]);

        const availablePetsData = (availablePets as any).pets || availablePets;

        // 파일명을 Signed URL로 변환 (1시간 유효)
        const profileImageFileName = this.storageService.generateSignedUrlSafe(breeder.profileImageFileName, 60);

        // verification.documents의 fileName을 동적으로 Signed URL로 변환
        const verificationWithSignedUrls = {
            ...breeder.verification,
            documents: breeder.verification.documents.map((doc: any) => ({
                type: doc.type,
                url: this.storageService.generateSignedUrl(doc.fileName, 60), // fileName → Signed URL 변환
                uploadedAt: doc.uploadedAt,
            })),
        };

        return {
            id: (breeder._id as any).toString(),
            name: breeder.name,
            email: breeder.emailAddress,
            phone: breeder.phoneNumber,
            profileImage: profileImageFileName,
            status: breeder.accountStatus,
            verification: verificationWithSignedUrls,
            profile: breeder.profile,
            parentPets,
            availablePets: availablePetsData,
            applicationForm: breeder.applicationForm,
            stats: breeder.stats,
        };
    }

    /**
     * 브리더 자신의 개체 목록 조회 (관리용)
     * 모든 상태의 개체를 포함하며, 비활성화된 개체도 조회 가능
     *
     * @param userId 브리더 고유 ID
     * @param status 상태 필터 (선택사항)
     * @param includeInactive 비활성화된 개체 포함 여부
     * @param page 페이지 번호
     * @param limit 페이지당 항목 수
     * @returns 페이지네이션된 개체 목록과 통계
     */
    async getMyPets(
        userId: string,
        status?: string,
        includeInactive: boolean = false,
        page: number = 1,
        limit: number = 20,
    ): Promise<any> {
        const breeder = await this.breederRepository.findById(userId);
        if (!breeder) {
            throw new BadRequestException('브리더 정보를 찾을 수 없습니다.');
        }

        // 통계 계산 및 데이터 조회
        const [statsResult, availableCount, reservedCount, adoptedCount, inactiveCount] = await Promise.all([
            this.availablePetRepository.findByBreederIdWithFilters(userId, { status, includeInactive, page, limit }),
            this.availablePetRepository.countByStatus(userId, PetStatus.AVAILABLE, true),
            this.availablePetRepository.countByStatus(userId, PetStatus.RESERVED, true),
            this.availablePetRepository.countByStatus(userId, PetStatus.ADOPTED, true),
            this.availablePetRepository.countInactive(userId),
        ]);

        const { pets, total } = statsResult;

        // 각 개체별 입양 신청 수 조회
        const petIds = pets.map((pet: any) => pet.petId || (pet._id as any).toString());
        const applicationCountMap = await this.adoptionApplicationRepository.countByPetIds(petIds);

        // 데이터 변환
        const items = pets.map((pet: any) => {
            const birthDate = new Date(pet.birthDate);
            const now = new Date();
            const ageInMonths = Math.floor((now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

            return {
                petId: pet.petId,
                name: pet.name,
                breed: pet.breed,
                gender: pet.gender,
                birthDate: pet.birthDate,
                ageInMonths,
                price: pet.price,
                status: pet.status,
                isActive: pet.isActive,
                mainPhoto: pet.photos?.[0] || '',
                photoCount: pet.photos?.length || 0,
                viewCount: pet.viewCount || 0,
                applicationCount: applicationCountMap.get(pet.petId) || 0,
                createdAt: pet.createdAt,
                updatedAt: pet.updatedAt,
            };
        });

        const totalPages = Math.ceil(total / limit);

        return {
            items,
            pagination: {
                currentPage: page,
                pageSize: limit,
                totalItems: total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
            availableCount,
            reservedCount,
            adoptedCount,
            inactiveCount,
        };
    }

    /**
     * 브리더 자신에게 달린 후기 목록 조회 (관리용)
     * 공개/비공개 후기 모두 조회 가능
     *
     * @param userId 브리더 고유 ID
     * @param visibility 공개 여부 필터 (all, visible, hidden)
     * @param page 페이지 번호
     * @param limit 페이지당 항목 수
     * @returns 페이지네이션된 후기 목록과 통계
     */
    async getMyReviews(userId: string, visibility: string = 'all', page: number = 1, limit: number = 10): Promise<any> {
        const breeder = await this.breederRepository.findById(userId);
        if (!breeder) {
            throw new BadRequestException('브리더 정보를 찾을 수 없습니다.');
        }

        // 브리더 스키마의 reviews 필드에서 조회
        let allReviews = (breeder as any).reviews || [];

        // 공개 여부 필터링
        if (visibility === 'visible') {
            allReviews = allReviews.filter((review: any) => review.isVisible);
        } else if (visibility === 'hidden') {
            allReviews = allReviews.filter((review: any) => !review.isVisible);
        }

        const total = allReviews.length;
        const visibleCount = (breeder as any).reviews?.filter((r: any) => r.isVisible).length || 0;
        const hiddenCount = total - visibleCount;

        // 최신순 정렬 및 페이지네이션
        const skip = (page - 1) * limit;
        const reviews = allReviews
            .sort((a: any, b: any) => new Date(b.writtenAt).getTime() - new Date(a.writtenAt).getTime())
            .slice(skip, skip + limit)
            .map((review: any) => ({
                reviewId: review.reviewId,
                adopterId: review.adopterId || '',
                adopterName: review.adopterName,
                petName: review.petName || '',
                rating: review.rating || 0,
                petHealthRating: review.petHealthRating,
                communicationRating: review.communicationRating,
                content: review.content,
                photos: review.photos || [],
                writtenAt: review.writtenAt,
                type: review.type || 'adoption',
                isVisible: review.isVisible,
                reportCount: review.reportCount || 0,
            }));

        const totalPages = Math.ceil(total / limit);

        return {
            items: reviews,
            pagination: {
                currentPage: page,
                pageSize: limit,
                totalItems: total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
            averageRating: breeder.stats?.averageRating || 0,
            totalReviews: total,
            visibleReviews: visibleCount,
            hiddenReviews: hiddenCount,
        };
    }

    /**
     * 표준 입양 신청 폼 질문 17개 (Figma 디자인 기반 - 수정 불가)
     *
     * 모든 브리더에게 자동으로 포함되는 필수 질문들입니다.
     */
    private getStandardQuestions() {
        return [
            {
                id: 'privacyConsent',
                type: 'checkbox',
                label: '개인정보 수집 및 이용에 동의하시나요?',
                required: true,
                order: 1,
                isStandard: true,
            },
            {
                id: 'selfIntroduction',
                type: 'textarea',
                label: '간단하게 자기소개 부탁드려요 (성별, 연령대, 거주지, 생활 패턴 등)',
                required: true,
                order: 2,
                isStandard: true,
            },
            {
                id: 'familyMembers',
                type: 'text',
                label: '함께 거주하는 가족 구성원을 알려주세요',
                required: true,
                order: 3,
                isStandard: true,
            },
            {
                id: 'allFamilyConsent',
                type: 'checkbox',
                label: '모든 가족 구성원들이 입양에 동의하셨나요?',
                required: true,
                order: 4,
                isStandard: true,
            },
            {
                id: 'allergyTestInfo',
                type: 'text',
                label: '본인을 포함한 모든 가족 구성원분들께서 알러지 검사를 마치셨나요?',
                required: true,
                order: 5,
                isStandard: true,
            },
            {
                id: 'timeAwayFromHome',
                type: 'text',
                label: '평균적으로 집을 비우는 시간은 얼마나 되나요?',
                required: true,
                order: 6,
                isStandard: true,
            },
            {
                id: 'livingSpaceDescription',
                type: 'textarea',
                label: '아이와 함께 지내게 될 공간을 소개해 주세요',
                required: true,
                order: 7,
                isStandard: true,
            },
            {
                id: 'previousPetExperience',
                type: 'textarea',
                label: '현재 함께하는, 또는 이전에 함께했던 반려동물에 대해 알려주세요',
                required: true,
                order: 8,
                isStandard: true,
            },
            {
                id: 'canProvideBasicCare',
                type: 'checkbox',
                label: '정기 예방접종·건강검진·훈련 등 기본 케어를 책임지고 해주실 수 있나요?',
                required: true,
                order: 9,
                isStandard: true,
            },
            {
                id: 'canAffordMedicalExpenses',
                type: 'checkbox',
                label: '예상치 못한 질병이나 사고 등으로 치료비가 발생할 경우 감당 가능하신가요?',
                required: true,
                order: 10,
                isStandard: true,
            },
            {
                id: 'neuteringConsent',
                type: 'checkbox',
                label: '모든 아이들은 중성화 후 분양되거나, 입양 후 중성화를 진행해야 합니다. 동의하십니까?',
                required: true,
                order: 11,
                isStandard: true,
            },
            {
                id: 'preferredPetDescription',
                type: 'textarea',
                label: '마음에 두신 아이가 있으신가요? (특징: 성별, 타입, 외모, 컬러패턴, 성격 등)',
                required: false,
                order: 12,
                isStandard: true,
            },
            {
                id: 'desiredAdoptionTiming',
                type: 'text',
                label: '원하시는 입양 시기가 있나요?',
                required: false,
                order: 13,
                isStandard: true,
            },
            {
                id: 'additionalNotes',
                type: 'textarea',
                label: '마지막으로 궁금하신 점이나 남기시고 싶으신 말씀이 있나요?',
                required: false,
                order: 14,
                isStandard: true,
            },
        ]; // 총 14개 표준 질문
    }

    /**
     * 입양 신청 폼 조회 (표준 + 커스텀 질문)
     *
     * 브리더가 설정한 전체 폼 구조를 조회합니다.
     * 표준 17개 질문은 자동으로 포함되며, 브리더가 추가한 커스텀 질문도 함께 반환합니다.
     *
     * @param breederId 브리더 ID
     * @returns 전체 폼 구조 (표준 + 커스텀 질문)
     */
    async getApplicationForm(breederId: string): Promise<any> {
        const breeder = await this.breederRepository.findById(breederId);
        if (!breeder) {
            throw new BadRequestException('브리더 정보를 찾을 수 없습니다.');
        }

        const standardQuestions = this.getStandardQuestions();

        // 브리더의 커스텀 질문 가져오기
        const customQuestions = (breeder.applicationForm || []).map((q, index) => ({
            id: q.id,
            type: q.type,
            label: q.label,
            required: q.required,
            options: q.options,
            placeholder: q.placeholder,
            order: standardQuestions.length + index + 1, // 표준 질문 다음에 순서 배치
            isStandard: false,
        }));

        return {
            standardQuestions,
            customQuestions,
            totalQuestions: standardQuestions.length + customQuestions.length,
        };
    }

    /**
     * 입양 신청 폼 수정 (커스텀 질문만)
     *
     * 브리더가 커스텀 질문을 추가/수정/삭제합니다.
     * 표준 17개 질문은 수정할 수 없습니다.
     *
     * @param breederId 브리더 ID
     * @param updateDto 커스텀 질문 목록
     * @returns 성공 메시지
     */
    async updateApplicationForm(breederId: string, updateDto: any): Promise<any> {
        const breeder = await this.breederRepository.findById(breederId);
        if (!breeder) {
            throw new BadRequestException('브리더 정보를 찾을 수 없습니다.');
        }

        // 커스텀 질문 ID 중복 검증
        const ids = updateDto.customQuestions.map((q: any) => q.id);
        const uniqueIds = new Set(ids);
        if (ids.length !== uniqueIds.size) {
            throw new BadRequestException('질문 ID가 중복되었습니다.');
        }

        // 표준 질문 ID와 충돌 방지
        const standardIds = this.getStandardQuestions().map((q) => q.id);
        const conflicts = ids.filter((id: string) => standardIds.includes(id));
        if (conflicts.length > 0) {
            throw new BadRequestException(`다음 ID는 표준 질문과 중복되어 사용할 수 없습니다: ${conflicts.join(', ')}`);
        }

        // 브리더 문서 업데이트
        breeder.applicationForm = updateDto.customQuestions.map((q: any) => ({
            id: q.id,
            type: q.type,
            label: q.label,
            required: q.required,
            options: q.options,
            placeholder: q.placeholder,
            order: q.order,
        }));

        await breeder.save();

        return {
            message: '입양 신청 폼이 성공적으로 업데이트되었습니다.',
            customQuestions: breeder.applicationForm,
        };
    }
}
