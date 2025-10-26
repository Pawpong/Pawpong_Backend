import { plainToInstance } from 'class-transformer';

import { AuthResponseDto } from '../dto/response/auth-response.dto';
import { VerificationDocumentsResponseDto } from '../dto/response/verification-documents-response.dto';
import { RegisterAdopterResponseDto } from '../dto/response/register-adopter-response.dto';
import { RegisterBreederResponseDto } from '../dto/response/register-breeder-response.dto';

/**
 * Auth 도메인 매퍼
 *
 * 역할:
 * - 인증/회원가입 관련 엔티티 → DTO 변환 처리
 * - plainToInstance를 활용한 타입 안전성 보장
 * - 비즈니스 로직과 데이터 변환 로직 분리
 *
 * 설계 원칙:
 * - 단일 책임: 데이터 변환만 담당
 * - 타입 안전성: class-transformer 활용
 * - 재사용성: 공통 변환 로직 메서드화
 */
export class AuthMapper {
    /**
     * 입양자 등록 응답 DTO 매핑
     *
     * @param savedAdopter 저장된 입양자 Document
     * @param tokens JWT 토큰 객체
     * @returns RegisterAdopterResponseDto
     */
    static toAdopterRegisterResponse(
        savedAdopter: any,
        tokens: { accessToken: string; refreshToken: string },
    ): RegisterAdopterResponseDto {
        return plainToInstance(RegisterAdopterResponseDto, {
            adopterId: savedAdopter._id.toString(),
            email: savedAdopter.emailAddress,
            nickname: savedAdopter.nickname,
            phoneNumber: savedAdopter.phoneNumber || '',
            profileImage: savedAdopter.profileImageUrl || '',
            userRole: 'adopter',
            accountStatus: savedAdopter.accountStatus,
            createdAt: savedAdopter.createdAt?.toISOString() || new Date().toISOString(),
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        });
    }

    /**
     * 브리더 등록 응답 DTO 매핑
     *
     * @param savedBreeder 저장된 브리더 Document
     * @param tokens JWT 토큰 객체
     * @returns RegisterBreederResponseDto
     */
    static toBreederRegisterResponse(
        savedBreeder: any,
        tokens: { accessToken: string; refreshToken: string },
    ): RegisterBreederResponseDto {
        return plainToInstance(RegisterBreederResponseDto, {
            breederId: savedBreeder._id.toString(),
            email: savedBreeder.emailAddress,
            breederName: savedBreeder.name,
            breederLocation: `${savedBreeder.profile?.location?.city || ''} ${savedBreeder.profile?.location?.district || ''}`.trim(),
            animal: savedBreeder.petType,
            breeds: savedBreeder.breeds,
            plan: savedBreeder.verification.plan,
            level: savedBreeder.verification.level,
            verificationStatus: savedBreeder.verification.status,
            createdAt: savedBreeder.createdAt?.toISOString() || new Date().toISOString(),
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        });
    }

    /**
     * 소셜 회원가입 완료 응답 DTO 매핑
     *
     * @param savedUser 저장된 사용자 Document (Adopter 또는 Breeder)
     * @param tokens JWT 토큰 객체
     * @param role 사용자 역할
     * @returns AuthResponseDto
     */
    static toSocialRegistrationResponse(
        savedUser: any,
        tokens: {
            accessToken: string;
            refreshToken: string;
            accessTokenExpiresIn: number;
            refreshTokenExpiresIn: number;
        },
        role: 'adopter' | 'breeder',
    ): AuthResponseDto {
        return plainToInstance(AuthResponseDto, {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            accessTokenExpiresIn: tokens.accessTokenExpiresIn,
            refreshTokenExpiresIn: tokens.refreshTokenExpiresIn,
            userInfo: {
                userId: savedUser._id.toString(),
                emailAddress: savedUser.emailAddress,
                nickname: role === 'adopter' ? savedUser.nickname : savedUser.name,
                userRole: role,
                accountStatus: savedUser.accountStatus,
                profileImageUrl: savedUser.profileImageUrl,
            },
            message: '소셜 회원가입이 완료되었습니다.',
        });
    }

    /**
     * 소셜 로그인 토큰 발급 응답 매핑
     *
     * @param user 사용자 정보 객체
     * @param tokens JWT 토큰 객체
     * @returns 소셜 로그인 토큰 응답
     */
    static toSocialLoginTokenResponse(
        user: any,
        tokens: {
            accessToken: string;
            refreshToken: string;
            accessTokenExpiresIn: number;
            refreshTokenExpiresIn: number;
        },
    ): {
        accessToken: string;
        refreshToken: string;
        accessTokenExpiresIn: number;
        refreshTokenExpiresIn: number;
        userInfo: {
            userId: string;
            email: string;
            name: string;
            role: string;
        };
    } {
        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            accessTokenExpiresIn: tokens.accessTokenExpiresIn,
            refreshTokenExpiresIn: tokens.refreshTokenExpiresIn,
            userInfo: {
                userId: user.userId,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        };
    }

    /**
     * 브리더 서류 제출 응답 DTO 매핑
     *
     * @param breeder 브리더 Document
     * @param breederLevel 브리더 레벨
     * @param documents 제출된 서류 정보
     * @returns 서류 제출 응답 데이터
     */
    static toDocumentSubmitResponse(
        breeder: any,
        breederLevel: 'elite' | 'new',
        documents: {
            idCardUrl: string;
            animalProductionLicenseUrl: string;
            adoptionContractSampleUrl?: string;
            recentAssociationDocumentUrl?: string;
            breederCertificationUrl?: string;
            ticaCfaDocumentUrl?: string;
        },
    ): {
        breederId: string;
        verificationStatus: string;
        uploadedDocuments: any;
        isDocumentsComplete: boolean;
        submittedAt: Date;
        estimatedProcessingTime: string;
    } {
        const uploadedDocuments: any = {
            idCard: documents.idCardUrl,
            animalProductionLicense: documents.animalProductionLicenseUrl,
        };

        if (breederLevel === 'elite') {
            uploadedDocuments.adoptionContractSample = documents.adoptionContractSampleUrl;
            uploadedDocuments.recentAssociationDocument = documents.recentAssociationDocumentUrl;
            uploadedDocuments.breederCertification = documents.breederCertificationUrl;
            if (documents.ticaCfaDocumentUrl) {
                uploadedDocuments.ticaCfaDocument = documents.ticaCfaDocumentUrl;
            }
        }

        return {
            breederId: breeder._id.toString(),
            verificationStatus: breeder.verification.status,
            uploadedDocuments,
            isDocumentsComplete: true,
            submittedAt: breeder.verification.submittedAt,
            estimatedProcessingTime: '3-5일',
        };
    }

    /**
     * 소셜 유저 체크 응답 매핑 (입양자)
     *
     * @param adopter 입양자 Document
     * @returns 소셜 유저 체크 응답
     */
    static toSocialUserCheckResponseAdopter(adopter: any): {
        exists: boolean;
        userRole: string;
        userId: string;
        email: string;
        nickname: string;
        profileImageUrl: string;
    } {
        return {
            exists: true,
            userRole: 'adopter',
            userId: adopter._id.toString(),
            email: adopter.emailAddress,
            nickname: adopter.nickname,
            profileImageUrl: adopter.profileImageUrl,
        };
    }

    /**
     * 소셜 유저 체크 응답 매핑 (브리더)
     *
     * @param breeder 브리더 Document
     * @returns 소셜 유저 체크 응답
     */
    static toSocialUserCheckResponseBreeder(breeder: any): {
        exists: boolean;
        userRole: string;
        userId: string;
        email: string;
        nickname: string;
        profileImageUrl: string;
    } {
        return {
            exists: true,
            userRole: 'breeder',
            userId: breeder._id.toString(),
            email: breeder.emailAddress,
            nickname: breeder.name,
            profileImageUrl: breeder.profileImageUrl,
        };
    }

    /**
     * 소셜 유저 체크 응답 매핑 (미가입 사용자)
     *
     * @returns 미가입 사용자 응답
     */
    static toSocialUserCheckResponseNotFound(): {
        exists: boolean;
    } {
        return {
            exists: false,
        };
    }

    /**
     * 프로필 이미지 업로드 응답 매핑
     *
     * @param result 업로드 결과 (cdnUrl, fileName)
     * @param fileSize 파일 크기
     * @returns 프로필 이미지 업로드 응답
     */
    static toProfileImageUploadResponse(
        result: { cdnUrl: string; fileName: string },
        fileSize: number,
    ): {
        cdnUrl: string;
        fileName: string;
        size: number;
    } {
        return {
            cdnUrl: result.cdnUrl,
            fileName: result.fileName,
            size: fileSize,
        };
    }

    /**
     * 브리더 서류 업로드 응답 매핑
     *
     * @param uploadedDocuments 업로드된 서류 배열
     * @returns 서류 업로드 응답
     */
    static toBreederDocumentsUploadResponse(
        uploadedDocuments: Array<{
            type: string;
            url: string;
            filename: string;
            size: number;
            uploadedAt: Date;
        }>,
    ): {
        response: VerificationDocumentsResponseDto;
        count: number;
    } {
        const response = new VerificationDocumentsResponseDto(uploadedDocuments, uploadedDocuments);

        return {
            response,
            count: uploadedDocuments.length,
        };
    }

    /**
     * 토큰 생성 응답 매핑 (내부용)
     *
     * @param userId 사용자 ID
     * @param email 이메일
     * @param role 역할
     * @param jwtService JWT 서비스
     * @returns 토큰 객체
     */
    static generateTokens(
        userId: string,
        email: string,
        role: string,
        jwtService: any,
    ): {
        accessToken: string;
        refreshToken: string;
        accessTokenExpiresIn: number;
        refreshTokenExpiresIn: number;
    } {
        const payload = {
            sub: userId,
            email,
            role,
        };

        // Access 토큰 (1시간)
        const accessToken = jwtService.sign(payload, {
            expiresIn: '1h',
        });

        // Refresh 토큰 (7일)
        const refreshToken = jwtService.sign(
            { ...payload, type: 'refresh' },
            {
                expiresIn: '7d',
            },
        );

        return {
            accessToken,
            refreshToken,
            accessTokenExpiresIn: 3600, // 1시간 (초)
            refreshTokenExpiresIn: 604800, // 7일 (초)
        };
    }

    /**
     * 소셜 로그인 정보 파싱 (tempId → provider, providerId)
     *
     * @param tempId 임시 ID (예: "temp_kakao_4479198661_1759826027884")
     * @returns 파싱된 소셜 정보 또는 undefined
     */
    static parseSocialAuthInfo(tempId?: string, provider?: string): any | undefined {
        if (!tempId || !provider) {
            return undefined;
        }

        // tempId 파싱: "temp_kakao_4479198661_1759826027884" 형식
        const tempIdParts = tempId.split('_');
        if (tempIdParts.length === 4 && tempIdParts[0] === 'temp') {
            const parsedProvider = tempIdParts[1];
            const providerId = tempIdParts[2];

            return {
                authProvider: parsedProvider,
                providerUserId: providerId,
                providerEmail: '', // 이메일은 별도로 설정
            };
        }

        return undefined;
    }

    /**
     * 전화번호 정규화 (하이픈 제거, 숫자만)
     *
     * @param phone 전화번호
     * @returns 정규화된 전화번호 또는 undefined
     */
    static normalizePhoneNumber(phone?: string): string | undefined {
        if (!phone) return undefined;
        return phone.replace(/[^0-9]/g, '');
    }

    /**
     * 브리더 위치 문자열 생성
     *
     * @param city 도시
     * @param district 구/군 (선택)
     * @returns 위치 문자열
     */
    static formatBreederLocation(city: string, district?: string): string {
        return `${city} ${district || ''}`.trim();
    }

    /**
     * 서류 타입을 camelCase에서 snake_case로 변환
     *
     * @param camelCaseType camelCase 서류 타입
     * @returns snake_case 서류 타입
     */
    static convertDocumentTypeToSnakeCase(camelCaseType: string): string {
        const typeMapping: Record<string, string> = {
            idCard: 'id_card',
            animalProductionLicense: 'animal_production_license',
            adoptionContractSample: 'adoption_contract_sample',
            recentAssociationDocument: 'pedigree',
            pedigree: 'pedigree',
            breederCertification: 'breeder_certification',
        };

        return typeMapping[camelCaseType] || camelCaseType;
    }

    /**
     * 서류 URL에서 문서 타입 추출
     *
     * @param url 서류 URL
     * @returns 추출된 문서 타입
     */
    static extractDocumentType(url: string): string {
        const fileName = url.split('/').pop() || '';
        const lowerFileName = fileName.toLowerCase();

        if (lowerFileName.includes('id_card') || lowerFileName.includes('신분증')) {
            return 'id_card';
        } else if (lowerFileName.includes('animal_production') || lowerFileName.includes('동물생산업')) {
            return 'animal_production_license';
        } else if (lowerFileName.includes('adoption_contract') || lowerFileName.includes('입양계약서')) {
            return 'adoption_contract_sample';
        } else if (lowerFileName.includes('pedigree') || lowerFileName.includes('혈통서')) {
            return 'pedigree';
        } else if (
            lowerFileName.includes('breeder_certification') ||
            lowerFileName.includes('브리더인증') ||
            lowerFileName.includes('tica') ||
            lowerFileName.includes('cfa')
        ) {
            return 'breeder_certification';
        }

        return 'other';
    }
}
