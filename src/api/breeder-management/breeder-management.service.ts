import { Injectable, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { BreederRepository } from './breeder.repository';
import { AdopterRepository } from '../adopter/adopter.repository';
import { ProfileUpdateRequestDto } from './dto/request/profile-update-request.dto';
import { ApplicationStatusUpdateRequestDto } from './dto/request/applicationStatusUpdate-request.dto';
import { VerificationSubmitRequestDto } from './dto/request/verification-submit-request.dto';
import { ParentPetAddDto } from './dto/request/parent-pet-add-request.dto';
import { AvailablePetAddDto } from './dto/request/available-pet-add-request.dto';
import { BreederDashboardResponseDto } from '../breeder/dto/response/breeder-dashboard-response.dto';
import { VerificationStatus, ApplicationStatus, PetStatus } from '../../common/enum/user.enum';

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
        private breederRepository: BreederRepository,
        private adopterRepository: AdopterRepository,
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

        // 대기 중인 입양 신청 수 계산
        const pendingApplications =
            breeder.receivedApplications?.filter((app: any) => app.status === ApplicationStatus.CONSULTATION_PENDING)
                .length || 0;

        // 최근 신청 내역 (최대 5개)
        const recentApplications = breeder.receivedApplications?.slice(-5) || [];
        // 분양 가능한 반려동물 수 계산
        const availablePetsCount =
            breeder.availablePets?.filter((pet: any) => pet.status === PetStatus.AVAILABLE).length || 0;

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
            recentApplicationList: recentApplications.map((app: any) => ({
                applicationId: app.applicationId,
                adopterName: app.adopterName,
                petName: app.petName,
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
        if (updateData.description) {
            profileUpdateData['profile.description'] = updateData.description;
        }
        if (updateData.location) {
            profileUpdateData['profile.location'] = {
                city: updateData.location,
                district: '',
                address: '',
            };
        }
        if (updateData.photos) {
            if (updateData.photos.length > 3) {
                throw new BadRequestException('프로필 사진은 최대 3장까지만 업로드할 수 있습니다.');
            }
            profileUpdateData['profile.photos'] = updateData.photos;
        }
        if (updateData.specialization) {
            profileUpdateData['profile.specialization'] = [updateData.specialization];
        }
        if (updateData.experienceYears !== undefined) {
            profileUpdateData['profile.experienceYears'] = updateData.experienceYears;
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

        if (parentPetDto.photoUrls && parentPetDto.photoUrls.length > 1) {
            throw new BadRequestException('부모견/부모묘는 사진을 1장까지만 등록할 수 있습니다.');
        }

        const petId = randomUUID();
        const parentPet = {
            petId,
            name: parentPetDto.petName,
            breed: parentPetDto.breedName,
            type: parentPetDto.petType,
            age: Math.floor(parentPetDto.ageInMonths / 12) || 1, // 월 단위를 년 단위로 변환
            gender: parentPetDto.gender,
            photos: parentPetDto.photoUrls || [],
            healthInfo: {
                vaccinated: parentPetDto.healthInfo?.isVaccinated ?? false,
                neutered: parentPetDto.healthInfo?.isNeutered ?? false,
                healthChecked: parentPetDto.healthInfo?.isHealthChecked ?? false,
                healthIssues: parentPetDto.healthInfo?.healthIssues ?? '',
            },
            healthRecords: [], // 추후 건강 기록 추가를 위한 빈 배열
            isActive: true,
        };

        await this.breederRepository.addParentPet(userId, parentPet);

        return { petId, message: '부모견/부모묘가 성공적으로 등록되었습니다.' };
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
    async updateParentPet(userId: string, petId: string, updateData: Partial<ParentPetAddDto>): Promise<any> {
        const breeder = await this.breederRepository.findById(userId);
        if (!breeder) {
            throw new BadRequestException('브리더 정보를 찾을 수 없습니다.');
        }

        const pet = await this.breederRepository.findParentPetById(userId, petId);
        if (!pet) {
            throw new BadRequestException('해당 부모견/부모묘를 찾을 수 없습니다.');
        }

        if (updateData.photoUrls && updateData.photoUrls.length > 1) {
            throw new BadRequestException('부모견/부모묘는 사진을 1장까지만 등록할 수 있습니다.');
        }

        await this.breederRepository.updateParentPet(userId, petId, updateData);

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
        const breeder = await this.breederRepository.findById(userId);
        if (!breeder) {
            throw new BadRequestException('브리더 정보를 찾을 수 없습니다.');
        }

        const pet = await this.breederRepository.findParentPetById(userId, petId);
        if (!pet) {
            throw new BadRequestException('해당 부모견/부모묘를 찾을 수 없습니다.');
        }

        await this.breederRepository.removeParentPet(userId, petId);

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

        if (availablePetDto.photoUrls && availablePetDto.photoUrls.length > 1) {
            throw new BadRequestException('분양 개체는 사진을 1장까지만 등록할 수 있습니다.');
        }

        const petId = randomUUID();
        const availablePet = {
            petId,
            name: availablePetDto.petName,
            breed: availablePetDto.breedName,
            type: availablePetDto.petType,
            birthDate: new Date(availablePetDto.birthDate),
            gender: availablePetDto.gender,
            price: availablePetDto.adoptionPrice,
            photos: availablePetDto.photoUrls || [],
            description: '', // 추후 상세 설명 추가 가능
            healthInfo: {
                vaccinated: availablePetDto.healthInfo?.isVaccinated ?? false,
                neutered: availablePetDto.healthInfo?.isNeutered ?? false,
                healthChecked: availablePetDto.healthInfo?.isHealthChecked ?? false,
                healthIssues: availablePetDto.healthInfo?.healthIssues ?? '',
            },
            availableFrom: new Date(), // 등록 즉시 분양 가능
            status: PetStatus.AVAILABLE,
            isActive: true,
        };

        await this.breederRepository.addAvailablePet(userId, availablePet);

        return { petId, message: '분양 가능한 반려동물이 성공적으로 등록되었습니다.' };
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
        const breeder = await this.breederRepository.findById(userId);
        if (!breeder) {
            throw new BadRequestException('브리더 정보를 찾을 수 없습니다.');
        }

        const pet = await this.breederRepository.findAvailablePetById(userId, petId);
        if (!pet) {
            throw new BadRequestException('해당 분양 개체를 찾을 수 없습니다.');
        }

        if (updateData.photoUrls && updateData.photoUrls.length > 1) {
            throw new BadRequestException('분양 개체는 사진을 1장까지만 등록할 수 있습니다.');
        }

        await this.breederRepository.updateAvailablePet(userId, petId, updateData);

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
        const breeder = await this.breederRepository.findById(userId);
        if (!breeder) {
            throw new BadRequestException('브리더 정보를 찾을 수 없습니다.');
        }

        const pet = await this.breederRepository.findAvailablePetById(userId, petId);
        if (!pet) {
            throw new BadRequestException('해당 분양 개체를 찾을 수 없습니다.');
        }

        const additionalData: any = {};

        // 상태별 추가 데이터 설정
        if (status === PetStatus.ADOPTED) {
            additionalData['availablePets.$.adoptedAt'] = new Date();
        } else if (status === PetStatus.RESERVED) {
            additionalData['availablePets.$.reservedAt'] = new Date();
        }

        await this.breederRepository.updatePetStatus(userId, petId, status, additionalData);

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
        const breeder = await this.breederRepository.findById(userId);
        if (!breeder) {
            throw new BadRequestException('브리더 정보를 찾을 수 없습니다.');
        }

        const pet = await this.breederRepository.findAvailablePetById(userId, petId);
        if (!pet) {
            throw new BadRequestException('해당 분양 개체를 찾을 수 없습니다.');
        }

        await this.breederRepository.removeAvailablePet(userId, petId);

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
        const breeder = await this.breederRepository.findById(userId);
        if (!breeder) {
            throw new BadRequestException('브리더 정보를 찾을 수 없습니다.');
        }

        return this.breederRepository.findReceivedApplications(userId, page, limit);
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
        const breeder = await this.breederRepository.findByIdWithAllData(userId);
        if (!breeder) {
            throw new BadRequestException('브리더 정보를 찾을 수 없습니다.');
        }

        const application = breeder.receivedApplications.find((app: any) => app.applicationId === applicationId);
        if (!application) {
            throw new BadRequestException('해당 입양 신청을 찾을 수 없습니다.');
        }

        // 추가 업데이트 데이터 구성
        const additionalUpdateData: any = {};
        if (updateData.notes) {
            additionalUpdateData['receivedApplications.$.notes'] = updateData.notes;
        }

        await this.breederRepository.updateApplicationStatus(
            userId,
            applicationId,
            updateData.status as any,
            additionalUpdateData,
        );

        // 입양 승인 완료 시 통계 업데이트
        if (updateData.status === ApplicationStatus.ADOPTION_APPROVED) {
            await this.breederRepository.incrementCompletedAdoptions(userId);
        }

        // 입양자 쪽 신청 상태도 동시 업데이트 (데이터 일관성 보장)
        await this.adopterRepository.updateApplicationStatus(
            application.adopterId,
            applicationId,
            updateData.status as any,
        );

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

        return {
            id: (breeder._id as any).toString(),
            name: breeder.name,
            email: breeder.email,
            phone: breeder.phone,
            profileImage: breeder.profileImage,
            status: breeder.status,
            verification: breeder.verification,
            profile: breeder.profile,
            parentPets: breeder.parentPets?.filter((pet: any) => pet.isActive) || [], // 활성화된 부모견만 조회
            availablePets: breeder.availablePets?.filter((pet: any) => pet.isActive) || [], // 활성화된 분양 개체만 조회
            applicationForm: breeder.applicationForm,
            reviews: breeder.reviews?.filter((review: any) => review.isVisible) || [], // 공개 가능한 후기만 조회
            stats: breeder.stats,
            reports: breeder.reports, // 관리 목적의 신고 내역
        };
    }
}
