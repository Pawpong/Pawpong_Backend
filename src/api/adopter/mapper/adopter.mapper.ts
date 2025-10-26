import { plainToInstance } from 'class-transformer';

import { ApplicationCreateResponseDto } from '../dto/response/application-create-response.dto';
import { AdopterProfileResponseDto } from '../dto/response/adopter-profile-response.dto';

/**
 * Adopter 도메인 매퍼
 *
 * 역할:
 * - 도메인 엔티티 → DTO 변환 처리
 * - plainToInstance를 활용한 타입 안전성 보장
 * - 비즈니스 로직과 데이터 변환 로직 분리
 *
 * 설계 원칙:
 * - 단일 책임: 데이터 변환만 담당
 * - 타입 안전성: class-transformer 활용
 * - 재사용성: 공통 변환 로직 메서드화
 */
export class AdopterMapper {
    /**
     * 입양 신청 생성 응답 DTO 매핑
     *
     * @param savedApplication MongoDB Document
     * @param breederName 브리더 이름
     * @param petName 반려동물 이름 (선택)
     * @returns ApplicationCreateResponseDto
     */
    static toApplicationCreateResponse(
        savedApplication: any,
        breederName: string,
        petName?: string,
    ): ApplicationCreateResponseDto {
        return plainToInstance(ApplicationCreateResponseDto, {
            applicationId: savedApplication._id.toString(),
            breederId: savedApplication.breederId.toString(),
            breederName,
            petId: savedApplication.petId ? savedApplication.petId.toString() : undefined,
            petName,
            status: savedApplication.status,
            appliedAt: savedApplication.appliedAt.toISOString(),
            message: '입양 상담 신청이 성공적으로 접수되었습니다. 브리더의 응답을 기다려주세요.',
        });
    }

    /**
     * 입양자 프로필 응답 DTO 매핑
     *
     * @param adopter Adopter Document
     * @returns AdopterProfileResponseDto
     */
    static toProfileResponse(adopter: any): AdopterProfileResponseDto {
        return plainToInstance(AdopterProfileResponseDto, {
            adopterId: adopter._id.toString(),
            emailAddress: adopter.emailAddress,
            nickname: adopter.nickname,
            phoneNumber: adopter.phoneNumber || '',
            profileImageUrl: adopter.profileImageUrl,
            accountStatus: adopter.accountStatus,
            favoriteBreederList: (adopter.favoriteBreederList || []).map((fav: any) => ({
                breederId: fav.favoriteBreederId,
                breederName: fav.breederName,
                addedAt: fav.addedAt,
                breederProfileImageUrl: fav.breederProfileImageUrl,
                breederLocation: fav.breederLocation,
            })),
            adoptionApplicationList: (adopter.adoptionApplicationList || []).map((app: any) => ({
                applicationId: app.applicationId,
                breederId: app.targetBreederId,
                petId: app.targetPetId,
                applicationStatus: app.applicationStatus,
                appliedAt: app.appliedAt,
            })),
            writtenReviewList: (adopter.writtenReviewList || []).map((review: any) => ({
                reviewId: review.reviewId,
                breederId: review.targetBreederId,
                rating: review.overallRating,
                content: review.reviewContent,
                createdAt: review.createdAt,
            })),
            createdAt: adopter.createdAt,
            updatedAt: adopter.updatedAt,
        });
    }

    /**
     * 즐겨찾기 브리더 상세 정보 매핑
     *
     * @param favorite 즐겨찾기 데이터
     * @param breeder 브리더 Document (nullable)
     * @returns 즐겨찾기 브리더 상세 정보
     */
    static toFavoriteDetail(favorite: any, breeder: any | null): any {
        if (!breeder) {
            return {
                breederId: favorite.favoriteBreederId,
                breederName: favorite.breederName,
                profileImageUrl: favorite.breederProfileImageUrl || '',
                location: favorite.breederLocation || '',
                specialization: '',
                averageRating: 0,
                totalReviews: 0,
                availablePets: 0,
                addedAt: favorite.addedAt,
                isActive: false,
            };
        }

        return {
            breederId: breeder._id.toString(),
            breederName: breeder.name,
            profileImageUrl: breeder.profileImageUrl || '',
            location: `${breeder.profile?.location?.city || ''} ${breeder.profile?.location?.district || ''}`.trim(),
            specialization: breeder.profile?.specialization || '',
            averageRating: breeder.stats?.averageRating || 0,
            totalReviews: breeder.stats?.totalReviews || 0,
            availablePets:
                breeder.availablePets?.filter((pet: any) => pet.status === 'available' && pet.isActive).length || 0,
            addedAt: favorite.addedAt,
            isActive: true,
        };
    }

    /**
     * 입양자가 작성할 후기 데이터 매핑 (Adopter 컬렉션에 저장용)
     *
     * @param reviewId 후기 고유 ID
     * @param application 입양 신청 정보
     * @param reviewType 후기 유형
     * @param rating 평점
     * @param content 후기 내용
     * @param photos 사진 URL 배열
     * @returns 입양자 후기 데이터
     */
    static toAdopterReview(
        reviewId: string,
        application: any,
        reviewType: string,
        rating: number,
        content: string,
        photos: string[],
    ): any {
        return {
            reviewId,
            targetBreederId: application.targetBreederId,
            targetBreederName: application.targetBreederName,
            relatedApplicationId: application.applicationId,
            reviewType,
            overallRating: rating,
            petHealthRating: rating,
            communicationRating: rating,
            reviewContent: content,
            reviewPhotoUrls: photos,
            createdAt: new Date(),
            isVisible: true,
        };
    }

    /**
     * 브리더가 받을 후기 데이터 매핑 (BreederReview 컬렉션에 저장용)
     *
     * @param reviewId 후기 고유 ID
     * @param adopterId 입양자 ID
     * @param adopterName 입양자 이름
     * @param applicationId 입양 신청 ID
     * @param reviewType 후기 유형
     * @param rating 평점
     * @param content 후기 내용
     * @param photos 사진 URL 배열
     * @returns 브리더 후기 데이터
     */
    static toBreederReview(
        reviewId: string,
        adopterId: string,
        adopterName: string,
        applicationId: string,
        reviewType: string,
        rating: number,
        content: string,
        photos: string[],
    ): any {
        return {
            reviewId,
            adopterId,
            adopterName,
            applicationId,
            type: reviewType,
            rating,
            content,
            photos,
            writtenAt: new Date(),
            isVisible: true,
        };
    }

    /**
     * 즐겨찾기 브리더 데이터 매핑
     *
     * @param breederId 브리더 ID
     * @param breeder 브리더 Document
     * @returns 즐겨찾기 데이터
     */
    static toFavoriteBreeder(breederId: string, breeder: any): any {
        return {
            favoriteBreederId: breederId,
            breederName: breeder.name,
            breederProfileImageUrl: breeder.profileImageUrl || '',
            breederLocation: `${breeder.profile?.location?.city || ''} ${breeder.profile?.location?.district || ''}`,
            addedAt: new Date(),
        };
    }

    /**
     * 브리더 신고 데이터 매핑
     *
     * @param reportId 신고 ID
     * @param userId 신고자 ID
     * @param reporterName 신고자 이름
     * @param type 신고 유형
     * @param description 신고 내용
     * @param status 신고 상태
     * @returns 신고 데이터
     */
    static toReport(
        reportId: string,
        userId: string,
        reporterName: string,
        type: string,
        description: string,
        status: string,
    ): any {
        return {
            reportId,
            reporterId: userId,
            reporterName,
            type,
            description,
            reportedAt: new Date(),
            status,
        };
    }

    /**
     * 프로필 업데이트 데이터 매핑 (요청 DTO → 데이터베이스 스키마)
     *
     * @param updateData 프로필 업데이트 요청 데이터
     * @returns 매핑된 업데이트 데이터
     */
    static toProfileUpdateData(updateData: { name?: string; phone?: string; profileImage?: string }): any {
        const mappedData: any = {};
        if (updateData.name) mappedData.fullName = updateData.name;
        if (updateData.phone) mappedData.phoneNumber = updateData.phone;
        if (updateData.profileImage) mappedData.profileImageUrl = updateData.profileImage;
        return mappedData;
    }
}
