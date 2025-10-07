import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
import { AdoptionApplication, AdoptionApplicationDocument } from '../../schema/adoption-application.schema';
import { AvailablePet, AvailablePetDocument } from '../../schema/available-pet.schema';
import { ParentPet, ParentPetDocument } from '../../schema/parent-pet.schema';

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
        @InjectModel(AdoptionApplication.name) private adoptionApplicationModel: Model<AdoptionApplicationDocument>,
        @InjectModel(AvailablePet.name) private availablePetModel: Model<AvailablePetDocument>,
        @InjectModel(ParentPet.name) private parentPetModel: Model<ParentPetDocument>,
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
        const pendingApplications = await this.adoptionApplicationModel.countDocuments({
            breederId: userId,
            status: ApplicationStatus.CONSULTATION_PENDING,
        });

        // 최근 신청 내역 (최대 5개)
        const recentApplicationsList = await this.adoptionApplicationModel
            .find({ breederId: userId })
            .sort({ appliedAt: -1 })
            .limit(5)
            .lean();

        // 분양 가능한 반려동물 수 계산 (별도 컬렉션 조회)
        const availablePetsCount = await this.availablePetModel.countDocuments({
            breederId: userId,
            status: PetStatus.AVAILABLE,
            isActive: true,
        });

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

        const parentPet = new this.parentPetModel({
            breederId: userId,
            name: parentPetDto.petName,
            breed: parentPetDto.breedName,
            photos: parentPetDto.photoUrls || [],
            description: '',
            isActive: true,
        });

        const savedParentPet = await parentPet.save();

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
    async updateParentPet(userId: string, petId: string, updateData: Partial<ParentPetAddDto>): Promise<any> {
        const pet = await this.parentPetModel.findOne({ _id: petId, breederId: userId });
        if (!pet) {
            throw new BadRequestException('해당 부모견/부모묘를 찾을 수 없습니다.');
        }

        if (updateData.photoUrls && updateData.photoUrls.length > 1) {
            throw new BadRequestException('부모견/부모묘는 사진을 1장까지만 등록할 수 있습니다.');
        }

        const updateFields: any = {};
        if (updateData.petName) updateFields.name = updateData.petName;
        if (updateData.breedName) updateFields.breed = updateData.breedName;
        if (updateData.photoUrls) updateFields.photos = updateData.photoUrls;

        await this.parentPetModel.findByIdAndUpdate(petId, { $set: updateFields });

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
        const pet = await this.parentPetModel.findOne({ _id: petId, breederId: userId });
        if (!pet) {
            throw new BadRequestException('해당 부모견/부모묘를 찾을 수 없습니다.');
        }

        await this.parentPetModel.findByIdAndDelete(petId);

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

        const availablePet = new this.availablePetModel({
            breederId: userId,
            name: availablePetDto.petName,
            breed: availablePetDto.breedName,
            birthDate: new Date(availablePetDto.birthDate),
            price: availablePetDto.adoptionPrice,
            status: 'available',
            photos: availablePetDto.photoUrls || [],
            description: '',
        });

        const savedPet = await availablePet.save();

        return { petId: (savedPet._id as any).toString(), message: '분양 가능한 반려동물이 성공적으로 등록되었습니다.' };
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
        const pet = await this.availablePetModel.findOne({ _id: petId, breederId: userId });
        if (!pet) {
            throw new BadRequestException('해당 분양 개체를 찾을 수 없습니다.');
        }

        if (updateData.photoUrls && updateData.photoUrls.length > 1) {
            throw new BadRequestException('분양 개체는 사진을 1장까지만 등록할 수 있습니다.');
        }

        const updateFields: any = {};
        if (updateData.petName) updateFields.name = updateData.petName;
        if (updateData.breedName) updateFields.breed = updateData.breedName;
        if (updateData.birthDate) updateFields.birthDate = new Date(updateData.birthDate);
        if (updateData.adoptionPrice) updateFields.price = updateData.adoptionPrice;
        if (updateData.photoUrls) updateFields.photos = updateData.photoUrls;

        await this.availablePetModel.findByIdAndUpdate(petId, { $set: updateFields });

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
        const pet = await this.availablePetModel.findOne({ _id: petId, breederId: userId });
        if (!pet) {
            throw new BadRequestException('해당 분양 개체를 찾을 수 없습니다.');
        }

        await this.availablePetModel.findByIdAndUpdate(petId, { $set: { status } });

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
        const pet = await this.availablePetModel.findOne({ _id: petId, breederId: userId });
        if (!pet) {
            throw new BadRequestException('해당 분양 개체를 찾을 수 없습니다.');
        }

        await this.availablePetModel.findByIdAndDelete(petId);

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
        const skip = (page - 1) * limit;

        const [applications, total] = await Promise.all([
            this.adoptionApplicationModel
                .find({ breederId: userId })
                .sort({ appliedAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            this.adoptionApplicationModel.countDocuments({ breederId: userId }),
        ]);

        return {
            applications,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit,
                hasNextPage: skip + limit < total,
                hasPrevPage: page > 1,
            },
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
        const application = await this.adoptionApplicationModel.findOne({
            _id: applicationId,
            breederId: userId,
        });

        if (!application) {
            throw new BadRequestException('해당 입양 신청을 찾을 수 없습니다.');
        }

        application.status = updateData.status as any;
        await application.save();

        // 입양 승인 완료 시 통계 업데이트
        if (updateData.status === ApplicationStatus.ADOPTION_APPROVED) {
            await this.breederRepository.incrementCompletedAdoptions(userId);
        }

        // 입양자 쪽 신청 상태도 동시 업데이트 (데이터 일관성 보장)
        await this.adopterRepository.updateApplicationStatus(
            application.adopterId.toString(),
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

        // 별도 컬렉션에서 데이터 조회
        const [parentPets, availablePets] = await Promise.all([
            this.parentPetModel.find({ breederId: userId, isActive: true }).lean(),
            this.availablePetModel.find({ breederId: userId, isActive: true }).lean(),
        ]);

        return {
            id: (breeder._id as any).toString(),
            name: breeder.name,
            email: breeder.email,
            phone: breeder.phone,
            profileImage: breeder.profileImage,
            status: breeder.status,
            verification: breeder.verification,
            profile: breeder.profile,
            parentPets,
            availablePets,
            applicationForm: breeder.applicationForm,
            stats: breeder.stats,
        };
    }
}
