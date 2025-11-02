import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { SocialProvider, UserStatus, VerificationStatus, BreederPlan } from '../../common/enum/user.enum';

import { StorageService } from '../../common/storage/storage.service';
import { CustomLoggerService } from '../../common/logger/custom-logger.service';

import { Adopter, AdopterDocument } from '../../schema/adopter.schema';
import { Breeder, BreederDocument } from '../../schema/breeder.schema';

import { RefreshTokenRequestDto } from './dto/request/refresh-token-request.dto';
import { RegisterAdopterRequestDto } from './dto/request/register-adopter-request.dto';

import { AuthResponseDto } from './dto/response/auth-response.dto';
import { TokenResponseDto } from './dto/response/token-response.dto';
import { VerificationDocumentsResponseDto } from './dto/response/verification-documents-response.dto';
import { RegisterAdopterResponseDto } from './dto/response/register-adopter-response.dto';

import { AuthMapper } from './mapper/auth.mapper';
import { AuthAdopterRepository } from './repository/auth-adopter.repository';
import { AuthBreederRepository } from './repository/auth-breeder.repository';

/**
 * 임시 업로드 파일 정보 (tempId 기반)
 */
interface TempUploadInfo {
    profileImage?: string; // 파일명
    documents?: Array<{
        fileName: string;
        type: string;
    }>;
    createdAt: Date;
}

@Injectable()
export class AuthService {
    /**
     * tempId를 키로 사용하는 임시 파일 저장소
     * 회원가입 전 업로드된 파일 정보를 임시 보관
     */
    private tempUploads = new Map<string, TempUploadInfo>();

    constructor(
        private readonly authAdopterRepository: AuthAdopterRepository,
        private readonly authBreederRepository: AuthBreederRepository,
        private jwtService: JwtService,
        private readonly logger: CustomLoggerService,
        private readonly storageService: StorageService,
    ) {
        // 1시간마다 오래된 임시 데이터 정리 (메모리 누수 방지)
        setInterval(() => this.cleanupOldTempUploads(), 60 * 60 * 1000);
    }

    /**
     * 1시간 이상 된 임시 업로드 데이터 삭제
     */
    private cleanupOldTempUploads(): void {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        let deletedCount = 0;

        for (const [tempId, info] of this.tempUploads.entries()) {
            if (info.createdAt < oneHourAgo) {
                this.tempUploads.delete(tempId);
                deletedCount++;
            }
        }

        if (deletedCount > 0) {
            this.logger.log(`[cleanupOldTempUploads] ${deletedCount}개의 오래된 임시 업로드 데이터 삭제됨`);
        }
    }

    /**
     * URL에서 파일명 추출 (프론트엔드가 잘못된 값을 보낼 경우 대비)
     *
     * @param urlOrFilename - Signed URL 또는 파일명
     * @returns 파일명 (예: "profiles/uuid.png")
     *
     * @example
     * // URL인 경우
     * extractFilenameFromUrl("https://cdn.pawpong.kr/profiles/uuid.png?Expires=123&Signature=abc")
     * // → "profiles/uuid.png"
     *
     * // 이미 파일명인 경우
     * extractFilenameFromUrl("profiles/uuid.png")
     * // → "profiles/uuid.png"
     */
    private extractFilenameFromUrl(urlOrFilename: string): string {
        if (!urlOrFilename) {
            return urlOrFilename;
        }

        // URL인지 확인 (http:// 또는 https://로 시작)
        if (urlOrFilename.startsWith('http://') || urlOrFilename.startsWith('https://')) {
            try {
                const url = new URL(urlOrFilename);
                // 도메인 이후 경로 추출 (맨 앞 / 제거)
                let pathname = url.pathname;
                if (pathname.startsWith('/')) {
                    pathname = pathname.substring(1);
                }
                this.logger.logWarning('extractFilenameFromUrl', `URL에서 파일명 추출됨 (프론트엔드가 url 대신 filename을 보내야 함)`, {
                    원본URL: urlOrFilename,
                    추출된파일명: pathname,
                });
                return pathname;
            } catch (error) {
                this.logger.logError('extractFilenameFromUrl', 'URL 파싱 실패', error);
                return urlOrFilename;
            }
        }

        // 이미 파일명인 경우 그대로 반환
        return urlOrFilename;
    }

    /**
     * Access 토큰과 Refresh 토큰을 생성합니다.
     */
    private generateTokens(userId: string, email: string, role: string) {
        const payload = {
            sub: userId,
            email,
            role,
        };

        // Access 토큰 (1시간)
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: '1h',
        });

        // Refresh 토큰 (7일)
        const refreshToken = this.jwtService.sign(
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
     * Refresh 토큰을 해시하여 저장합니다.
     */
    private async hashRefreshToken(refreshToken: string): Promise<string> {
        return bcrypt.hash(refreshToken, 10);
    }

    // 유틸리티 메서드들은 AuthMapper로 이동되었습니다.

    async validateUser(userId: string, role: string): Promise<any> {
        if (role === 'adopter') {
            return this.authAdopterRepository.findById(userId);
        } else if (role === 'breeder') {
            return this.authBreederRepository.findById(userId);
        }
        return null;
    }

    /**
     * Refresh 토큰을 사용하여 새로운 Access 토큰을 발급합니다.
     */
    async refreshToken(refreshTokenDto: RefreshTokenRequestDto): Promise<TokenResponseDto> {
        try {
            // Refresh 토큰 검증
            const payload = this.jwtService.verify(refreshTokenDto.refreshToken);

            // Refresh 토큰인지 확인
            if (!payload.type || payload.type !== 'refresh') {
                throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
            }

            // 사용자 조회
            let user: any;
            let hashedToken: string;

            if (payload.role === 'adopter') {
                user = await this.authAdopterRepository.findById(payload.sub);
                hashedToken = user?.refreshToken;
            } else if (payload.role === 'breeder') {
                user = await this.authBreederRepository.findById(payload.sub);
                hashedToken = user?.refreshToken;
            } else {
                throw new UnauthorizedException('유효하지 않은 사용자 역할입니다.');
            }

            if (!user) {
                throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
            }

            // 저장된 Refresh 토큰과 비교
            if (!hashedToken) {
                throw new UnauthorizedException('리프레시 토큰이 존재하지 않습니다.');
            }

            const isTokenValid = await bcrypt.compare(refreshTokenDto.refreshToken, hashedToken);
            if (!isTokenValid) {
                throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
            }

            // 새로운 토큰 생성
            const tokens = this.generateTokens(payload.sub, payload.email, payload.role);

            // 새 Refresh 토큰 해시 후 저장
            const newHashedRefreshToken = await this.hashRefreshToken(tokens.refreshToken);

            if (payload.role === 'adopter') {
                await this.authAdopterRepository.updateRefreshToken(payload.sub, newHashedRefreshToken);
            } else if (payload.role === 'breeder') {
                await this.authBreederRepository.updateRefreshToken(payload.sub, newHashedRefreshToken);
            }

            return tokens;
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new UnauthorizedException('리프레시 토큰이 만료되었습니다.');
            }
            if (error.name === 'JsonWebTokenError') {
                throw new UnauthorizedException('유효하지 않은 토큰 형식입니다.');
            }
            throw error;
        }
    }

    /**
     * 로그아웃 시 Refresh 토큰을 제거합니다.
     */
    async logout(userId: string, role: string): Promise<void> {
        if (role === 'adopter') {
            await this.authAdopterRepository.updateRefreshToken(userId, null);
        } else if (role === 'breeder') {
            await this.authBreederRepository.updateRefreshToken(userId, null);
        }
    }

    /**
     * 이메일 중복 체크 - 입양자와 브리더 모두 확인
     */
    async checkEmailDuplicate(email: string): Promise<boolean> {
        const adopter = await this.authAdopterRepository.findByEmail(email);
        if (adopter) return true;

        const breeder = await this.authBreederRepository.findByEmail(email);
        if (breeder) return true;

        return false;
    }

    /**
     * 닉네임 중복 체크 - 입양자만 확인
     */
    async checkNicknameDuplicate(nickname: string): Promise<boolean> {
        const adopter = await this.authAdopterRepository.findByNickname(nickname);
        return !!adopter;
    }

    /**
     * 소셜 로그인 처리 - 사용자 조회 또는 임시 생성
     */
    async handleSocialLogin(profile: {
        provider: string;
        providerId: string;
        email: string;
        name: string;
        profileImage?: string;
    }): Promise<{ needsAdditionalInfo: boolean; tempUserId?: string; user?: any }> {
        // 기존 사용자 조회 (Adopter)
        let adopter = await this.authAdopterRepository.findBySocialAuth(profile.provider, profile.providerId);

        if (adopter) {
            // 기존 사용자 로그인
            return {
                needsAdditionalInfo: false,
                user: {
                    userId: (adopter._id as any).toString(),
                    email: adopter.emailAddress,
                    name: adopter.nickname,
                    role: 'adopter',
                    profileImage: adopter.profileImageFileName,
                },
            };
        }

        // 기존 사용자 조회 (Breeder)
        let breeder = await this.authBreederRepository.findBySocialAuth(profile.provider, profile.providerId);

        if (breeder) {
            // 기존 사용자 로그인
            return {
                needsAdditionalInfo: false,
                user: {
                    userId: (breeder._id as any).toString(),
                    email: breeder.emailAddress,
                    name: breeder.name,
                    role: 'breeder',
                    profileImage: breeder.profileImageFileName,
                },
            };
        }

        // 신규 사용자 - 추가 정보 필요
        // 임시 사용자 ID 생성 (세션 또는 JWT로 관리)
        const tempUserId = `temp_${profile.provider}_${profile.providerId}_${Date.now()}`;

        // 소셜 로그인 프로필 이미지는 사용하지 않음
        // 브리더 서류처럼 사용자가 회원가입 시 직접 업로드한 이미지만 사용
        this.logger.log(`[handleSocialLogin] 신규 사용자 tempId 생성: ${tempUserId} (프로필 이미지는 사용자가 직접 업로드)`);

        return {
            needsAdditionalInfo: true,
            tempUserId,
        };
    }

    /**
     * 입양자 회원가입 처리 (일반 + 소셜 로그인 모두 지원)
     */
    async registerAdopter(dto: RegisterAdopterRequestDto): Promise<RegisterAdopterResponseDto> {
        this.logger.logStart('registerAdopter', '입양자 회원가입 처리 시작', dto, 'AuthService');

        // tempId 파싱: "temp_kakao_4479198661_1759826027884" 형식
        const tempIdParts = dto.tempId.split('_');
        if (tempIdParts.length !== 4 || tempIdParts[0] !== 'temp') {
            throw new BadRequestException('유효하지 않은 임시 ID 형식입니다.');
        }

        const provider = tempIdParts[1]; // kakao, google, naver
        const providerId = tempIdParts[2]; // 소셜 제공자의 사용자 ID

        this.logger.logSuccess(
            'registerAdopter',
            'tempId 파싱 완료',
            { provider, providerId, nickname: dto.nickname },
            'AuthService',
        );

        // 소셜 제공자로부터 기존 사용자 정보 조회 (이미 가입했는지 확인)
        const existingAdopter = await this.authAdopterRepository.findBySocialAuth(provider, providerId);

        if (existingAdopter) {
            throw new ConflictException('이미 입양자로 가입된 소셜 계정입니다.');
        }

        // 필수 필드 검증
        if (!dto.email) {
            throw new BadRequestException('이메일 정보가 필요합니다.');
        }

        if (!dto.nickname) {
            throw new BadRequestException('닉네임이 필요합니다.');
        }

        // 닉네임 중복 체크
        const existingNickname = await this.authAdopterRepository.findByNickname(dto.nickname);

        if (existingNickname) {
            throw new ConflictException('이미 사용 중인 닉네임입니다.');
        }

        // 입양자 생성
        const savedAdopter = await this.authAdopterRepository.create({
            emailAddress: dto.email,
            nickname: dto.nickname,
            phoneNumber: AuthMapper.normalizePhoneNumber(dto.phone),
            profileImageFileName: dto.profileImage ? this.extractFilenameFromUrl(dto.profileImage) : '',
            socialAuthInfo: {
                authProvider: provider,
                providerUserId: providerId,
                providerEmail: dto.email,
            },
            accountStatus: UserStatus.ACTIVE,
            userRole: 'adopter',
            marketingAgreed: dto.marketingAgreed || false,
            notificationSettings: {
                emailNotifications: true,
                pushNotifications: true,
                applicationStatusNotifications: true,
                favoriteBreederNotifications: true,
            },
            favoriteBreederList: [],
            submittedReportList: [],
            // ✅ 제거: adoptionApplicationList (별도 컬렉션에서 관리)
            // ✅ 제거: writtenReviewList (별도 컬렉션에서 관리)
        });

        // 토큰 생성
        const tokens = this.generateTokens((savedAdopter._id as any).toString(), savedAdopter.emailAddress, 'adopter');

        // Refresh 토큰 저장
        const hashedRefreshToken = await this.hashRefreshToken(tokens.refreshToken);
        await this.authAdopterRepository.update((savedAdopter._id as any).toString(), {
            refreshToken: hashedRefreshToken,
            lastActivityAt: new Date(),
        });

        this.logger.logSuccess('registerAdopter', '입양자 회원가입 완료', {
            userId: (savedAdopter._id as any).toString(),
            nickname: savedAdopter.nickname,
        });

        // 응답 데이터 구성 (Mapper 패턴 사용)
        return AuthMapper.toAdopterRegisterResponse(savedAdopter, tokens);
    }

    /**
     * 소셜 회원가입 완료 처리
     */
    async completeSocialRegistration(
        profile: {
            provider: string;
            providerId: string;
            email: string;
            name: string;
            profileImage?: string;
        },
        additionalInfo: {
            role: 'adopter' | 'breeder';
            nickname?: string;
            phone?: string;
            petType?: string;
            plan?: string;
            breederName?: string;
            introduction?: string;
            district?: string;
            breeds?: string[];
            level?: string;
            marketingAgreed?: boolean;
        },
    ): Promise<AuthResponseDto> {
        if (additionalInfo.role === 'adopter') {
            // 닉네임 필수 체크

            // 닉네임 중복 체크
            const existingNickname = await this.authAdopterRepository.findByNickname(additionalInfo.nickname!);

            if (existingNickname) {
                throw new ConflictException('Nickname already exists');
            }

            // 입양자 생성
            const savedAdopter = await this.authAdopterRepository.create({
                emailAddress: profile.email,
                nickname: additionalInfo.nickname,
                phoneNumber: AuthMapper.normalizePhoneNumber(additionalInfo.phone),
                profileImageFileName: profile.profileImage,
                socialAuthInfo: {
                    authProvider: profile.provider,
                    providerUserId: profile.providerId,
                    providerEmail: profile.email,
                },
                accountStatus: UserStatus.ACTIVE,
                userRole: 'adopter',
                marketingAgreed: additionalInfo.marketingAgreed || false,
                notificationSettings: {
                    emailNotifications: true,
                    pushNotifications: true,
                    applicationStatusNotifications: true,
                    favoriteBreederNotifications: true,
                },
                favoriteBreederList: [],
                submittedReportList: [],
                // ✅ 제거: adoptionApplicationList (별도 컬렉션에서 관리)
                // ✅ 제거: writtenReviewList (별도 컬렉션에서 관리)
            });

            // 토큰 생성
            const tokens = this.generateTokens(
                (savedAdopter._id as any).toString(),
                savedAdopter.emailAddress,
                'adopter',
            );

            // Refresh 토큰 저장
            const hashedRefreshToken = await this.hashRefreshToken(tokens.refreshToken);
            await this.authAdopterRepository.update((savedAdopter._id as any).toString(), {
                refreshToken: hashedRefreshToken,
                lastActivityAt: new Date(),
            });

            return {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                accessTokenExpiresIn: tokens.accessTokenExpiresIn,
                refreshTokenExpiresIn: tokens.refreshTokenExpiresIn,
                userInfo: {
                    userId: (savedAdopter._id as any).toString(),
                    emailAddress: savedAdopter.emailAddress,
                    nickname: savedAdopter.nickname,
                    userRole: 'adopter',
                    accountStatus: savedAdopter.accountStatus,
                    profileImageFileName: savedAdopter.profileImageFileName,
                },
                message: '소셜 회원가입이 완료되었습니다.',
            };
        } else {
            // 브리더 생성
            if (!additionalInfo.breederName || !additionalInfo.district) {
                throw new BadRequestException('브리더는 브리더명, 지역이 필요합니다.');
            }

            if (!additionalInfo.breeds || additionalInfo.breeds.length === 0) {
                throw new BadRequestException('최소 1개의 품종이 필요합니다.');
            }

            const savedBreeder = await this.authBreederRepository.create({
                // User 스키마 필드 (상속)
                emailAddress: profile.email,
                nickname: additionalInfo.breederName, // 브리더명을 nickname으로 사용
                phoneNumber: AuthMapper.normalizePhoneNumber(additionalInfo.phone),
                profileImageFileName: profile.profileImage,
                socialAuthInfo: {
                    authProvider: profile.provider,
                    providerUserId: profile.providerId,
                    providerEmail: profile.email,
                },
                userRole: 'breeder',
                accountStatus: UserStatus.ACTIVE,
                termsAgreed: true,
                privacyAgreed: true,
                marketingAgreed: additionalInfo.marketingAgreed || false,
                lastLoginAt: new Date(),
                lastActivityAt: new Date(),

                // Breeder 전용 필드
                name: additionalInfo.breederName, // 업체명
                petType: additionalInfo.petType || 'dog',
                breeds: additionalInfo.breeds || [],
                verification: {
                    status: VerificationStatus.PENDING,
                    plan: additionalInfo.plan === 'pro' ? BreederPlan.PRO : BreederPlan.BASIC,
                    level: additionalInfo.level || 'new',
                    documents: [],
                },
                profile: {
                    description: additionalInfo.introduction || '',
                    specialization: [additionalInfo.petType || 'dog'],
                    location: {
                        city: additionalInfo.district, // district를 city 필드에 저장
                        district: '',
                    },
                    representativePhotos: [],
                },
                applicationForm: [],
                stats: {
                    totalApplications: 0,
                    totalFavorites: 0,
                    completedAdoptions: 0,
                    averageRating: 0,
                    totalReviews: 0,
                    profileViews: 0,
                    priceRange: {
                        min: 0,
                        max: 0,
                    },
                    lastUpdated: new Date(),
                },
            });

            // 토큰 생성
            const tokens = this.generateTokens(
                (savedBreeder._id as any).toString(),
                savedBreeder.emailAddress,
                'breeder',
            );

            // Refresh 토큰 저장
            const hashedRefreshToken = await this.hashRefreshToken(tokens.refreshToken);
            await this.authBreederRepository.update((savedBreeder._id as any).toString(), {
                refreshToken: hashedRefreshToken,
                lastLoginAt: new Date(),
            });

            return {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                accessTokenExpiresIn: tokens.accessTokenExpiresIn,
                refreshTokenExpiresIn: tokens.refreshTokenExpiresIn,
                userInfo: {
                    userId: (savedBreeder._id as any).toString(),
                    emailAddress: savedBreeder.emailAddress,
                    nickname: savedBreeder.nickname,
                    userRole: 'breeder',
                    accountStatus: savedBreeder.accountStatus,
                    profileImageFileName: savedBreeder.profileImageFileName,
                },
                message: '소셜 회원가입이 완료되었습니다.',
            };
        }
    }

    /**
     * 소셜 로그인 기존 사용자 토큰 발급
     */
    async generateSocialLoginTokens(user: any) {
        const tokens = this.generateTokens(user.userId, user.email, user.role);

        // Refresh 토큰 저장
        const hashedRefreshToken = await this.hashRefreshToken(tokens.refreshToken);

        if (user.role === 'adopter') {
            await this.authAdopterRepository.update(user.userId, {
                refreshToken: hashedRefreshToken,
                lastActivityAt: new Date(),
            });
        } else if (user.role === 'breeder') {
            await this.authBreederRepository.update(user.userId, {
                refreshToken: hashedRefreshToken,
                lastLoginAt: new Date(),
            });
        }

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
     * 브리더 서류 업로드 및 제출 (파일 업로드 기반)
     * 파일을 GCP Storage에 업로드하고 URL을 생성한 후 제출합니다.
     */
    async uploadAndSubmitBreederDocuments(
        userId: string,
        breederLevel: 'elite' | 'new',
        files: {
            idCard?: Express.Multer.File[];
            animalProductionLicense?: Express.Multer.File[];
            adoptionContractSample?: Express.Multer.File[];
            recentAssociationDocument?: Express.Multer.File[];
            breederCertification?: Express.Multer.File[];
            ticaCfaDocument?: Express.Multer.File[];
        },
    ): Promise<{
        breederId: string;
        verificationStatus: string;
        uploadedDocuments: any;
        isDocumentsComplete: boolean;
        submittedAt: Date;
        estimatedProcessingTime: string;
    }> {
        this.logger.logStart('uploadAndSubmitBreederDocuments', '브리더 서류 파일 업로드 시작', {
            userId,
            breederLevel,
        });

        // 필수 파일 검증
        if (!files.idCard || files.idCard.length === 0) {
            throw new BadRequestException('신분증 사본 파일이 필요합니다.');
        }
        if (!files.animalProductionLicense || files.animalProductionLicense.length === 0) {
            throw new BadRequestException('동물생산업 등록증 파일이 필요합니다.');
        }

        // Elite 레벨 필수 파일 검증
        if (breederLevel === 'elite') {
            if (!files.adoptionContractSample || files.adoptionContractSample.length === 0) {
                throw new BadRequestException('표준 입양계약서 샘플 파일이 필요합니다.');
            }
            if (!files.recentAssociationDocument || files.recentAssociationDocument.length === 0) {
                throw new BadRequestException('최근 발급한 협회 서류 파일이 필요합니다.');
            }
            if (!files.breederCertification || files.breederCertification.length === 0) {
                throw new BadRequestException('고양이 브리더 인증 서류 파일이 필요합니다.');
            }
        }

        // 파일 업로드 (GCP Storage)
        const uploadedUrls: {
            idCardUrl: string;
            animalProductionLicenseUrl: string;
            adoptionContractSampleUrl?: string;
            recentAssociationDocumentUrl?: string;
            breederCertificationUrl?: string;
            ticaCfaDocumentUrl?: string;
        } = {
            idCardUrl: '',
            animalProductionLicenseUrl: '',
        };

        try {
            // 신분증 업로드
            const idCardResult = await this.storageService.uploadFile(files.idCard[0], 'breeder-documents');
            uploadedUrls.idCardUrl = idCardResult.cdnUrl;

            // 동물생산업 등록증 업로드
            const licenseResult = await this.storageService.uploadFile(
                files.animalProductionLicense[0],
                'breeder-documents',
            );
            uploadedUrls.animalProductionLicenseUrl = licenseResult.cdnUrl;

            // Elite 레벨 서류 업로드
            if (breederLevel === 'elite') {
                const contractResult = await this.storageService.uploadFile(
                    files.adoptionContractSample![0],
                    'breeder-documents',
                );
                uploadedUrls.adoptionContractSampleUrl = contractResult.cdnUrl;

                const associationResult = await this.storageService.uploadFile(
                    files.recentAssociationDocument![0],
                    'breeder-documents',
                );
                uploadedUrls.recentAssociationDocumentUrl = associationResult.cdnUrl;

                const certificationResult = await this.storageService.uploadFile(
                    files.breederCertification![0],
                    'breeder-documents',
                );
                uploadedUrls.breederCertificationUrl = certificationResult.cdnUrl;

                // TICA/CFA 서류 (선택사항)
                if (files.ticaCfaDocument && files.ticaCfaDocument.length > 0) {
                    const ticaCfaResult = await this.storageService.uploadFile(
                        files.ticaCfaDocument[0],
                        'breeder-documents',
                    );
                    uploadedUrls.ticaCfaDocumentUrl = ticaCfaResult.cdnUrl;
                }
            }

            this.logger.logSuccess('uploadAndSubmitBreederDocuments', '파일 업로드 완료', {
                uploadedCount: Object.keys(uploadedUrls).filter((k) => uploadedUrls[k as keyof typeof uploadedUrls])
                    .length,
            });
        } catch (error) {
            this.logger.logError('uploadAndSubmitBreederDocuments', '파일 업로드 실패', error);
            throw new BadRequestException('파일 업로드에 실패했습니다. 다시 시도해주세요.');
        }

        // 기존 submitBreederDocuments 메서드 호출
        return this.submitBreederDocuments(userId, breederLevel, uploadedUrls);
    }

    /**
     * 브리더 서류 제출 (URL 기반)
     * Elite 레벨과 New 레벨에 따라 필수 서류가 다름
     */
    async submitBreederDocuments(
        userId: string,
        breederLevel: 'elite' | 'new',
        documents: {
            idCardUrl: string;
            animalProductionLicenseUrl: string;
            adoptionContractSampleUrl?: string;
            recentAssociationDocumentUrl?: string;
            breederCertificationUrl?: string;
            ticaCfaDocumentUrl?: string;
        },
    ): Promise<{
        breederId: string;
        verificationStatus: string;
        uploadedDocuments: any;
        isDocumentsComplete: boolean;
        submittedAt: Date;
        estimatedProcessingTime: string;
    }> {
        this.logger.logStart('submitBreederDocuments', '브리더 서류 제출 시작', {
            userId,
            breederLevel,
        });

        const breeder = await this.authBreederRepository.findById(userId);

        if (!breeder) {
            this.logger.logError('submitBreederDocuments', '브리더를 찾을 수 없음', new Error('Breeder not found'));
            throw new BadRequestException('브리더를 찾을 수 없습니다.');
        }

        // 브리더 레벨에 따른 필수 서류 검증
        const documentArray: { type: string; url: string; uploadedAt: Date }[] = [];

        // 공통 필수 서류 (모든 레벨)
        documentArray.push({
            type: 'id_card',
            url: documents.idCardUrl,
            uploadedAt: new Date(),
        });
        documentArray.push({
            type: 'animal_production_license',
            url: documents.animalProductionLicenseUrl,
            uploadedAt: new Date(),
        });

        // Elite 레벨 필수 서류 검증
        if (breederLevel === 'elite') {
            if (!documents.adoptionContractSampleUrl) {
                throw new BadRequestException('표준 입양계약서 샘플이 필요합니다.');
            }
            if (!documents.recentAssociationDocumentUrl) {
                throw new BadRequestException('최근 발급한 협회 서류가 필요합니다.');
            }
            if (!documents.breederCertificationUrl) {
                throw new BadRequestException('고양이 브리더 인증 서류가 필요합니다.');
            }

            documentArray.push({
                type: 'adoption_contract_sample',
                url: documents.adoptionContractSampleUrl,
                uploadedAt: new Date(),
            });
            documentArray.push({
                type: 'association_document',
                url: documents.recentAssociationDocumentUrl,
                uploadedAt: new Date(),
            });
            documentArray.push({
                type: 'breeder_certification',
                url: documents.breederCertificationUrl,
                uploadedAt: new Date(),
            });

            // Elite 레벨 선택 서류
            if (documents.ticaCfaDocumentUrl) {
                documentArray.push({
                    type: 'tica_cfa_document',
                    url: documents.ticaCfaDocumentUrl,
                    uploadedAt: new Date(),
                });
            }
        }

        // 서류 정보를 verification.documents에 저장
        const submittedAt = new Date();
        await this.authBreederRepository.updateVerificationDocuments(
            userId,
            documentArray,
            breederLevel,
            VerificationStatus.REVIEWING,
            submittedAt,
        );

        this.logger.logSuccess('submitBreederDocuments', '브리더 서류 제출 완료', {
            breederId: breeder._id,
            level: breederLevel,
            documentsCount: documentArray.length,
        });

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
            breederId: (breeder._id as any).toString(),
            verificationStatus: VerificationStatus.REVIEWING,
            uploadedDocuments,
            isDocumentsComplete: true,
            submittedAt: submittedAt,
            estimatedProcessingTime: '3-5일',
        };
    }

    /**
     * 소셜 로그인 사용자 존재 여부 확인
     * 프론트엔드에서 로그인/회원가입 플로우를 결정하기 위해 사용
     */
    async checkSocialUser(
        provider: string,
        providerId: string,
        email?: string,
    ): Promise<{
        exists: boolean;
        userRole?: string;
        userId?: string;
        email?: string;
        nickname?: string;
        profileImageFileName?: string;
    }> {
        this.logger.logStart('checkSocialUser', '소셜 사용자 존재 여부 확인', {
            provider,
            providerId,
            email,
        });

        // 입양자 검색
        const adopter = await this.authAdopterRepository.findBySocialAuth(provider, providerId);

        if (adopter) {
            this.logger.logSuccess('checkSocialUser', '입양자 계정 발견', {
                userId: adopter._id,
            });

            // 입양자 응답 (Mapper 패턴 사용)
            return AuthMapper.toSocialUserCheckResponseAdopter(adopter);
        }

        // 브리더 검색
        const breeder = await this.authBreederRepository.findBySocialAuth(provider, providerId);

        if (breeder) {
            this.logger.logSuccess('checkSocialUser', '브리더 계정 발견', {
                userId: breeder._id,
            });

            // 브리더 응답 (Mapper 패턴 사용)
            return AuthMapper.toSocialUserCheckResponseBreeder(breeder);
        }

        this.logger.logSuccess('checkSocialUser', '미가입 사용자', {
            provider,
            providerId,
        });

        // 미가입 사용자 응답 (Mapper 패턴 사용)
        return AuthMapper.toSocialUserCheckResponseNotFound();
    }

    /**
     * 브리더 회원가입 (일반 가입 + 소셜 로그인 지원)
     * 프론트엔드 회원가입 플로우에 맞춰 구현
     * - 버킷 연결 부분은 제외하고 순수 회원가입만 처리
     * - 서류 제출은 나중에 할 수 있도록 선택적으로 처리
     */
    async registerBreeder(dto: {
        email: string;
        phoneNumber: string;
        breederName: string;
        breederLocation: { city: string; district?: string };
        animal: string;
        breeds: string[];
        plan: string;
        level: string;
        agreements: {
            termsOfService: boolean;
            privacyPolicy: boolean;
            marketingConsent?: boolean;
        };
        tempId?: string;
        provider?: string;
        profileImage?: string;
        documentUrls?: string[];
        documentTypes?: string[];
    }): Promise<{
        breederId: string;
        email: string;
        breederName: string;
        breederLocation: string;
        animal: string;
        breeds: string[];
        plan: string;
        level: string;
        verificationStatus: string;
        createdAt: string;
        accessToken: string;
        refreshToken: string;
    }> {
        this.logger.logStart('registerBreeder', '브리더 회원가입 시작', {
            email: dto.email,
            breederName: dto.breederName,
            animal: dto.animal,
            plan: dto.plan,
            level: dto.level,
            tempId: dto.tempId,
        });

        // 필수 약관 동의 확인
        if (!dto.agreements.termsOfService || !dto.agreements.privacyPolicy) {
            throw new BadRequestException('필수 약관에 동의해야 합니다.');
        }

        // 이메일 중복 체크
        const existingBreeder = await this.authBreederRepository.findByEmail(dto.email);

        if (existingBreeder) {
            throw new ConflictException('이미 가입된 이메일입니다.');
        }

        // 입양자로도 가입되어 있는지 확인
        const existingAdopter = await this.authAdopterRepository.findByEmail(dto.email);

        if (existingAdopter) {
            throw new ConflictException('해당 이메일로 입양자 계정이 이미 존재합니다.');
        }

        // 소셜 로그인 정보 파싱 (tempId가 있는 경우)
        let socialAuthInfo: any = undefined;

        if (dto.tempId && dto.provider) {
            // tempId 파싱: "temp_kakao_4479198661_1759826027884" 형식
            const tempIdParts = dto.tempId.split('_');
            if (tempIdParts.length === 4 && tempIdParts[0] === 'temp') {
                const provider = tempIdParts[1];
                const providerId = tempIdParts[2];

                socialAuthInfo = {
                    authProvider: provider,
                    providerUserId: providerId,
                    providerEmail: dto.email,
                };

                this.logger.logSuccess('registerBreeder', '소셜 로그인 정보 파싱 완료', {
                    provider,
                    providerId,
                });
            }
        }

        // breederLocation은 이미 객체 형태로 전달됨 (district는 선택)
        const city = dto.breederLocation.city;
        const district = dto.breederLocation.district || '';

        // tempId로 임시 저장된 파일 정보 조회 (회원가입 전 업로드한 파일)
        let tempUploadInfo: TempUploadInfo | undefined;
        if (dto.tempId) {
            tempUploadInfo = this.tempUploads.get(dto.tempId);
            if (tempUploadInfo) {
                this.logger.logSuccess('registerBreeder', 'tempId로 임시 저장된 파일 정보 조회 완료', {
                    tempId: dto.tempId,
                    hasProfileImage: !!tempUploadInfo.profileImage,
                    documentCount: tempUploadInfo.documents?.length || 0,
                });
            } else {
                this.logger.log(`[registerBreeder] tempId로 임시 저장된 파일 정보가 없습니다: ${dto.tempId}`);
            }
        }

        // 프론트엔드가 보낸 값과 임시 저장된 값 병합
        const finalProfileImage = dto.profileImage || tempUploadInfo?.profileImage;
        const finalDocumentUrls = dto.documentUrls || tempUploadInfo?.documents?.map((doc) => doc.fileName);
        const finalDocumentTypes = dto.documentTypes || tempUploadInfo?.documents?.map((doc) => {
            // snake_case를 camelCase로 변환
            const typeMapping: Record<string, string> = {
                id_card: 'idCard',
                animal_production_license: 'animalProductionLicense',
                adoption_contract_sample: 'adoptionContractSample',
                recent_association_document: 'recentAssociationDocument',
                breeder_certification: 'breederCertification',
                tica_cfa_document: 'ticaCfaDocument',
            };
            return typeMapping[doc.type] || doc.type;
        });

        // 프론트엔드가 보낸 값 로깅 (디버깅용)
        this.logger.log(`[registerBreeder] 프론트엔드가 보낸 profileImage: ${dto.profileImage}`);
        this.logger.log(`[registerBreeder] 프론트엔드가 보낸 documentUrls: ${JSON.stringify(dto.documentUrls)}`);
        this.logger.log(`[registerBreeder] 최종 profileImage: ${finalProfileImage}`);
        this.logger.log(`[registerBreeder] 최종 documentUrls: ${JSON.stringify(finalDocumentUrls)}`);

        // 업로드된 서류 파일명 배열을 documents 배열로 변환 (Mapper 패턴 사용)
        // 최종 파일명과 타입을 사용 (프론트엔드 또는 tempId에서 가져온 값)
        const verificationDocuments =
            finalDocumentUrls?.map((urlOrFilename, index) => {
                // URL에서 파일명 추출 (URL이면 경고 로그와 함께 변환, 파일명이면 그대로 사용)
                const fileName = this.extractFilenameFromUrl(urlOrFilename);
                const camelCaseType = finalDocumentTypes?.[index] || AuthMapper.extractDocumentType(fileName);
                // camelCase를 snake_case로 변환 (스키마 enum 형식에 맞춤)
                const snakeCaseType = AuthMapper.convertDocumentTypeToSnakeCase(camelCaseType);
                return {
                    fileName: fileName, // 파일명만 저장 (조회 시 동적으로 Signed URL 생성)
                    type: snakeCaseType,
                    uploadedAt: new Date(),
                };
            }) || [];

        if (verificationDocuments.length > 0) {
            this.logger.logSuccess('registerBreeder', '인증 서류 파일명 처리 완료', {
                documentCount: verificationDocuments.length,
                documentTypes: verificationDocuments.map((doc) => doc.type),
                savedFileNames: verificationDocuments.map((doc) => doc.fileName), // 실제 저장되는 파일명
            });
        }

        // 회원가입 완료 후 tempId 임시 저장소에서 삭제
        if (dto.tempId && tempUploadInfo) {
            this.tempUploads.delete(dto.tempId);
            this.logger.log(`[registerBreeder] tempId 임시 저장소에서 삭제됨: ${dto.tempId}`);
        }

        // 브리더 생성
        const savedBreeder = await this.authBreederRepository.create({
            // User 스키마 필드 (상속)
            emailAddress: dto.email,
            nickname: dto.breederName, // 브리더명을 nickname으로 사용
            phoneNumber: AuthMapper.normalizePhoneNumber(dto.phoneNumber),
            profileImageFileName: finalProfileImage ? this.extractFilenameFromUrl(finalProfileImage) : undefined,
            socialAuthInfo: socialAuthInfo,
            userRole: 'breeder',
            accountStatus: UserStatus.ACTIVE,
            termsAgreed: dto.agreements.termsOfService,
            privacyAgreed: dto.agreements.privacyPolicy,
            marketingAgreed: dto.agreements.marketingConsent || false,
            lastLoginAt: new Date(),
            lastActivityAt: new Date(),

            // Breeder 전용 필드
            name: dto.breederName, // 업체명
            petType: dto.animal, // cat or dog
            breeds: dto.breeds,
            verification: {
                status: VerificationStatus.PENDING,
                plan: dto.plan === 'pro' ? BreederPlan.PRO : BreederPlan.BASIC,
                level: dto.level, // elite or new
                documents: verificationDocuments,
            },
            profile: {
                description: '', // 초기에는 빈 문자열
                specialization: [dto.animal], // cat or dog
                location: {
                    city: city,
                    district: district,
                },
                representativePhotos: [],
            },
            applicationForm: [],
            stats: {
                totalApplications: 0,
                totalFavorites: 0,
                completedAdoptions: 0,
                averageRating: 0,
                totalReviews: 0,
                profileViews: 0,
                priceRange: {
                    min: 0,
                    max: 0,
                },
                lastUpdated: new Date(),
            },
        });

        this.logger.logSuccess('registerBreeder', '브리더 생성 완료', {
            breederId: savedBreeder._id,
            email: savedBreeder.emailAddress,
            name: savedBreeder.name,
        });

        // 토큰 생성
        const tokens = this.generateTokens((savedBreeder._id as any).toString(), savedBreeder.emailAddress, 'breeder');

        // Refresh 토큰 저장
        const hashedRefreshToken = await this.hashRefreshToken(tokens.refreshToken);
        await this.authBreederRepository.updateRefreshToken((savedBreeder._id as any).toString(), hashedRefreshToken);

        this.logger.logSuccess('registerBreeder', '브리더 회원가입 완료', {
            breederId: savedBreeder._id,
            accessToken: tokens.accessToken.substring(0, 20) + '...',
        });

        // 응답 데이터 구성 (Mapper 패턴 사용)
        return AuthMapper.toBreederRegisterResponse(savedBreeder, tokens);
    }

    /**
     * 프로필 이미지 업로드 (회원가입 시 사용)
     * 로그인 사용자의 경우 자동으로 DB에 저장
     * 비로그인 사용자의 경우 tempId로 임시 저장
     */
    async uploadProfileImage(
        file: Express.Multer.File,
        user?: { userId: string; role: string },
        tempId?: string,
    ): Promise<{ cdnUrl: string; fileName: string; size: number }> {
        this.logger.logStart('uploadProfileImage', '프로필 이미지 업로드 시작', {
            fileSize: file.size,
            mimeType: file.mimetype,
            hasUser: !!user,
            tempId: tempId || 'N/A',
        });

        // 파일 크기 검증 (5MB)
        if (file.size > 5 * 1024 * 1024) {
            throw new BadRequestException('파일 크기는 5MB를 초과할 수 없습니다.');
        }

        // 파일 타입 검증
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('이미지 파일만 업로드 가능합니다. (jpg, jpeg, png, gif, webp)');
        }

        // GCP Storage에 업로드
        const result = await this.storageService.uploadFile(file, 'profiles');

        // 로그인 사용자인 경우 DB 업데이트 (파일명만 저장)
        if (user) {
            if (user.role === 'breeder') {
                await this.authBreederRepository.updateProfileImage(user.userId, result.fileName);
                this.logger.logSuccess('uploadProfileImage', '브리더 프로필 이미지 파일명 DB 저장 완료', {
                    userId: user.userId,
                    fileName: result.fileName,
                });
            } else if (user.role === 'adopter') {
                await this.authAdopterRepository.updateProfileImage(user.userId, result.fileName);
                this.logger.logSuccess('uploadProfileImage', '입양자 프로필 이미지 파일명 DB 저장 완료', {
                    userId: user.userId,
                    fileName: result.fileName,
                });
            }
        }
        // tempId가 있으면 임시 저장 (로그인 여부와 무관하게 저장)
        // 사용자가 로그인 상태에서 다시 회원가입을 시도할 수 있으므로 둘 다 저장
        if (tempId) {
            const existing = this.tempUploads.get(tempId) || { createdAt: new Date() };
            this.tempUploads.set(tempId, {
                ...existing,
                profileImage: result.fileName,
                createdAt: existing.createdAt, // 기존 생성 시간 유지
            });
            this.logger.logSuccess('uploadProfileImage', 'tempId로 프로필 이미지 임시 저장 완료', {
                tempId,
                fileName: result.fileName,
                hasUser: !!user,
                tempUploadsSize: this.tempUploads.size,
            });
        }

        this.logger.logSuccess('uploadProfileImage', '프로필 이미지 업로드 완료', {
            cdnUrl: result.cdnUrl,
            fileName: result.fileName,
        });

        return {
            cdnUrl: result.cdnUrl,
            fileName: result.fileName,
            size: file.size,
        };
    }

    /**
     * 브리더 인증 서류 업로드 (회원가입 시 사용)
     * New/Elite 레벨에 따라 필수 서류 검증
     * tempId가 있으면 임시 저장소에 보관
     */
    async uploadBreederDocuments(
        files: Express.Multer.File[],
        types: string[],
        level: 'new' | 'elite',
        tempId?: string,
    ): Promise<{ response: VerificationDocumentsResponseDto; count: number }> {
        this.logger.logStart('uploadBreederDocuments', '브리더 인증 서류 업로드 시작', {
            fileCount: files.length,
            types,
            level,
            tempId: tempId || 'N/A',
        });

        if (!files || files.length === 0) {
            throw new BadRequestException('파일이 업로드되지 않았습니다.');
        }

        // New/Elite 레벨별 허용 서류 타입 정의
        const allowedTypes = {
            new: ['idCard', 'animalProductionLicense'],
            elite: [
                'idCard',
                'animalProductionLicense',
                'adoptionContractSample',
                'recentAssociationDocument',
                'breederCertification',
                'ticaCfaDocument', // 선택
            ],
        };

        // New/Elite 레벨별 필수 서류 정의
        const requiredTypes = {
            new: ['idCard', 'animalProductionLicense'], // 필수 2개
            elite: [
                'idCard',
                'animalProductionLicense',
                'adoptionContractSample',
                'recentAssociationDocument',
                'breederCertification',
            ], // 필수 5개 (ticaCfaDocument는 선택)
        };

        // 레벨 검증
        if (!['new', 'elite'].includes(level)) {
            throw new BadRequestException('레벨은 "new" 또는 "elite"만 가능합니다.');
        }

        // 서류 타입 검증
        const validTypes = allowedTypes[level];
        for (const type of types) {
            if (!validTypes.includes(type)) {
                throw new BadRequestException(
                    `${level} 레벨에서 유효하지 않은 서류 타입입니다: ${type}. 허용된 타입: ${validTypes.join(', ')}`,
                );
            }
        }

        // 중복 서류 타입 검증
        const uniqueTypes = new Set(types);
        if (uniqueTypes.size !== types.length) {
            throw new BadRequestException('중복된 서류 타입이 있습니다. 각 서류는 한 번만 업로드해야 합니다.');
        }

        // 필수 서류 검증
        const required = requiredTypes[level];
        const missingRequired = required.filter((type) => !types.includes(type));
        if (missingRequired.length > 0) {
            throw new BadRequestException(`${level} 레벨 필수 서류가 누락되었습니다: ${missingRequired.join(', ')}`);
        }

        // files와 types 배열 길이 일치 검증
        if (files.length !== types.length) {
            throw new BadRequestException(
                `파일 개수(${files.length})와 서류 타입 개수(${types.length})가 일치하지 않습니다.`,
            );
        }

        // 파일 타입 및 크기 검증 (PDF, 모든 이미지 허용, 최대 10MB)
        const allowedMimeTypes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'image/heic',
            'image/heif',
            'image/gif',
            'image/bmp',
            'image/tiff',
        ];

        for (const file of files) {
            if (file.size > 10 * 1024 * 1024) {
                throw new BadRequestException(`파일 "${file.originalname}"의 크기는 10MB를 초과할 수 없습니다.`);
            }
            if (!allowedMimeTypes.includes(file.mimetype)) {
                throw new BadRequestException(
                    `파일 "${file.originalname}"은(는) PDF 또는 이미지 파일만 업로드 가능합니다. (pdf, jpg, jpeg, png, webp, heic, gif 등)`,
                );
            }
        }

        // 파일 업로드
        const uploadedDocuments: Array<{
            type: string;
            url: string;
            filename: string;
            size: number;
            uploadedAt: Date;
        }> = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const type = types[i];

            // 파일 업로드 (임시 폴더에 저장, 회원가입 완료 시 브리더 ID 폴더로 이동 가능)
            const result = await this.storageService.uploadFile(file, `documents/verification/temp/${level}`);

            uploadedDocuments.push({
                type,
                url: result.cdnUrl, // 응답용 Signed URL
                filename: result.fileName, // DB 저장용 파일명
                size: file.size,
                uploadedAt: new Date(),
            });

            this.logger.logSuccess('uploadBreederDocuments', `서류 업로드 완료 (${i + 1}/${files.length})`, {
                level,
                type,
                fileName: result.fileName,
            });
        }

        this.logger.logSuccess('uploadBreederDocuments', `${level} 레벨 인증 서류 업로드 완료`, {
            totalCount: uploadedDocuments.length,
            level,
        });

        // tempId가 있으면 임시 저장소에 보관
        if (tempId) {
            const existing = this.tempUploads.get(tempId) || { createdAt: new Date() };
            this.tempUploads.set(tempId, {
                ...existing,
                documents: uploadedDocuments.map((doc) => ({
                    fileName: doc.filename,
                    type: doc.type,
                })),
                createdAt: existing.createdAt, // 기존 생성 시간 유지
            });
            this.logger.logSuccess('uploadBreederDocuments', 'tempId로 서류 정보 임시 저장 완료', {
                tempId,
                documentCount: uploadedDocuments.length,
                tempUploadsSize: this.tempUploads.size,
            });
        }

        const response = new VerificationDocumentsResponseDto(uploadedDocuments, uploadedDocuments);

        return {
            response,
            count: uploadedDocuments.length,
        };
    }
}
