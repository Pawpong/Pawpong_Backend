import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { SocialProvider, UserStatus, VerificationStatus, BreederPlan } from '../../common/enum/user.enum';

import { StorageService } from 'src/common/storage/storage.service';
import { CustomLoggerService } from '../../common/logger/custom-logger.service';

import { Adopter, AdopterDocument } from '../../schema/adopter.schema';
import { Breeder, BreederDocument } from '../../schema/breeder.schema';

import { RefreshTokenRequestDto } from './dto/request/refresh-token-request.dto';

import { AuthResponseDto } from './dto/response/auth-response.dto';
import { TokenResponseDto } from './dto/response/token-response.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(Adopter.name) private adopterModel: Model<AdopterDocument>,
        @InjectModel(Breeder.name) private breederModel: Model<BreederDocument>,
        private jwtService: JwtService,
        private readonly logger: CustomLoggerService,
        private readonly storageService: StorageService,
    ) {}

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

    /**
     * 전화번호 정규화 (하이픈 제거, 숫자만)
     */
    private normalizePhoneNumber(phone?: string): string | undefined {
        if (!phone) return undefined;
        return phone.replace(/[^0-9]/g, '');
    }

    /**
     * 서류 URL에서 문서 타입 추출
     * URL 경로에서 파일명을 분석하여 문서 타입을 추론
     */
    private extractDocumentType(url: string): string {
        const fileName = url.split('/').pop() || '';
        const lowerFileName = fileName.toLowerCase();

        if (lowerFileName.includes('id_card') || lowerFileName.includes('신분증')) {
            return 'id_card';
        } else if (
            lowerFileName.includes('animal_production') ||
            lowerFileName.includes('동물생산업')
        ) {
            return 'animal_production_license';
        } else if (
            lowerFileName.includes('adoption_contract') ||
            lowerFileName.includes('입양계약서')
        ) {
            return 'adoption_contract_sample';
        } else if (
            lowerFileName.includes('pedigree') ||
            lowerFileName.includes('혈통서')
        ) {
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

    async validateUser(userId: string, role: string): Promise<any> {
        if (role === 'adopter') {
            return this.adopterModel.findById(userId);
        } else if (role === 'breeder') {
            return this.breederModel.findById(userId);
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
                user = await this.adopterModel.findById(payload.sub);
                hashedToken = user?.refreshToken;
            } else if (payload.role === 'breeder') {
                user = await this.breederModel.findById(payload.sub);
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
            user.refreshToken = newHashedRefreshToken;
            await user.save();

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
            await this.adopterModel.findByIdAndUpdate(userId, {
                refreshToken: null,
            });
        } else if (role === 'breeder') {
            await this.breederModel.findByIdAndUpdate(userId, {
                refreshToken: null,
            });
        }
    }

    /**
     * 이메일 중복 체크 - 입양자와 브리더 모두 확인
     */
    async checkEmailDuplicate(email: string): Promise<boolean> {
        const adopter = await this.adopterModel.findOne({ emailAddress: email }).lean().exec();
        if (adopter) return true;

        const breeder = await this.breederModel.findOne({ email: email }).lean().exec();
        if (breeder) return true;

        return false;
    }

    /**
     * 닉네임 중복 체크 - 입양자만 확인
     */
    async checkNicknameDuplicate(nickname: string): Promise<boolean> {
        const adopter = await this.adopterModel.findOne({ nickname: nickname });
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
        let adopter = await this.adopterModel.findOne({
            'socialAuthInfo.authProvider': profile.provider,
            'socialAuthInfo.providerUserId': profile.providerId,
        });

        if (adopter) {
            // 기존 사용자 로그인
            return {
                needsAdditionalInfo: false,
                user: {
                    userId: (adopter._id as any).toString(),
                    email: adopter.emailAddress,
                    name: adopter.nickname,
                    role: 'adopter',
                    profileImage: adopter.profileImageUrl,
                },
            };
        }

        // 기존 사용자 조회 (Breeder)
        let breeder = await this.breederModel.findOne({
            'socialAuth.provider': profile.provider,
            'socialAuth.providerId': profile.providerId,
        });

        if (breeder) {
            // 기존 사용자 로그인
            return {
                needsAdditionalInfo: false,
                user: {
                    userId: (breeder._id as any).toString(),
                    email: breeder.emailAddress,
                    name: breeder.name,
                    role: 'breeder',
                    profileImage: breeder.profileImageUrl,
                },
            };
        }

        // 신규 사용자 - 추가 정보 필요
        // 임시 사용자 ID 생성 (세션 또는 JWT로 관리)
        const tempUserId = `temp_${profile.provider}_${profile.providerId}_${Date.now()}`;

        return {
            needsAdditionalInfo: true,
            tempUserId,
        };
    }

    /**
     * tempId로 소셜 회원가입 완료 처리
     */
    async completeSocialRegistrationWithTempId(dto: any): Promise<AuthResponseDto> {
        this.logger.logStart(
            'completeSocialRegistrationWithTempId',
            'tempId 기반 소셜 회원가입 처리',
            dto,
            'AuthService',
        );

        // tempId 파싱: "temp_kakao_4479198661_1759826027884" 형식
        const tempIdParts = dto.tempId.split('_');
        if (tempIdParts.length !== 4 || tempIdParts[0] !== 'temp') {
            throw new BadRequestException('유효하지 않은 임시 ID 형식입니다.');
        }

        const provider = tempIdParts[1]; // kakao, google, naver
        const providerId = tempIdParts[2]; // 소셜 제공자의 사용자 ID

        this.logger.logSuccess(
            'completeSocialRegistrationWithTempId',
            'tempId 파싱 완료',
            { provider, providerId, nickname: dto.nickname, role: dto.role },
            'AuthService',
        );

        // 소셜 제공자로부터 기존 사용자 정보 조회 (이미 가입했는지 확인)
        let adopter = await this.adopterModel.findOne({
            'socialAuthInfo.authProvider': provider,
            'socialAuthInfo.providerUserId': providerId,
        });

        let breeder = await this.breederModel.findOne({
            'socialAuth.provider': provider,
            'socialAuth.providerId': providerId,
        });

        if (adopter) {
            throw new ConflictException('이미 입양자로 가입된 소셜 계정입니다.');
        }

        if (breeder) {
            throw new ConflictException('이미 브리더로 가입된 소셜 계정입니다.');
        }

        // 소셜 제공자의 이메일은 tempId에서 복원할 수 없으므로 DTO에서 받아야 함
        // 하지만 보안을 위해 프론트에서 URL 파라미터로 받은 email을 다시 보내도록 함
        // 여기서는 DTO에 email이 없으므로 에러 처리
        if (!dto.email) {
            throw new BadRequestException('이메일 정보가 필요합니다.');
        }

        if (!dto.name) {
            throw new BadRequestException('이름 정보가 필요합니다.');
        }

        // 기존 메서드 호출
        return this.completeSocialRegistration(
            {
                provider,
                providerId,
                email: dto.email,
                name: dto.name,
                profileImage: dto.profileImage || '',
            },
            {
                role: dto.role,
                nickname: dto.nickname,
                phone: dto.phone,
                petType: dto.petType,
                plan: dto.plan,
                breederName: dto.breederName,
                introduction: dto.introduction,
                district: dto.district,
                breeds: dto.breeds,
                level: dto.level,
                marketingAgreed: dto.marketingAgreed,
            },
        );
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
            const existingNickname = await this.adopterModel.findOne({
                nickname: additionalInfo.nickname,
            });

            if (existingNickname) {
                throw new ConflictException('Nickname already exists');
            }

            // 입양자 생성
            const adopter = new this.adopterModel({
                emailAddress: profile.email,
                nickname: additionalInfo.nickname,
                phoneNumber: this.normalizePhoneNumber(additionalInfo.phone),
                profileImageUrl: profile.profileImage,
                socialAuthInfo: {
                    authProvider: profile.provider,
                    providerUserId: profile.providerId,
                    providerEmail: profile.email,
                },
                accountStatus: UserStatus.ACTIVE,
                userRole: 'adopter',
                notificationSettings: {
                    emailNotifications: true,
                    smsNotifications: false,
                    marketingNotifications: additionalInfo.marketingAgreed || false,
                },
                favoriteBreederList: [],
                adoptionApplicationList: [],
                writtenReviewList: [],
                submittedReportList: [],
            });

            const savedAdopter = await adopter.save();

            // 토큰 생성
            const tokens = this.generateTokens(
                (savedAdopter._id as any).toString(),
                savedAdopter.emailAddress,
                'adopter',
            );

            // Refresh 토큰 저장
            const hashedRefreshToken = await this.hashRefreshToken(tokens.refreshToken);
            savedAdopter.refreshToken = hashedRefreshToken;
            savedAdopter.lastActivityAt = new Date();
            await savedAdopter.save();

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
                    profileImageUrl: savedAdopter.profileImageUrl,
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

            const breeder = new this.breederModel({
                // User 스키마 필드 (상속)
                emailAddress: profile.email,
                nickname: additionalInfo.breederName, // 브리더명을 nickname으로 사용
                phoneNumber: this.normalizePhoneNumber(additionalInfo.phone),
                profileImageUrl: profile.profileImage,
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
                    priceRange: {
                        min: 0,
                        max: 0,
                    },
                    representativePhotos: [],
                },
                applicationForm: [],
                stats: {
                    totalReviews: 0,
                    averageRating: 0,
                    totalAdoptions: 0,
                    responseRate: 0,
                    averageResponseTime: 0,
                    lastUpdated: new Date(),
                },
            });

            const savedBreeder = await breeder.save();

            // 토큰 생성
            const tokens = this.generateTokens(
                (savedBreeder._id as any).toString(),
                savedBreeder.emailAddress,
                'breeder',
            );

            // Refresh 토큰 저장
            const hashedRefreshToken = await this.hashRefreshToken(tokens.refreshToken);
            savedBreeder.refreshToken = hashedRefreshToken;
            savedBreeder.lastLoginAt = new Date();
            await savedBreeder.save();

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
                    profileImageUrl: savedBreeder.profileImageUrl,
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
            await this.adopterModel.updateOne(
                { _id: user.userId },
                {
                    refreshToken: hashedRefreshToken,
                    lastActivityAt: new Date(),
                },
            );
        } else if (user.role === 'breeder') {
            await this.breederModel.updateOne(
                { _id: user.userId },
                {
                    refreshToken: hashedRefreshToken,
                    lastLoginAt: new Date(),
                },
            );
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

        const breeder = await this.breederModel.findById(userId);

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
        breeder.verification.documents = documentArray;
        breeder.verification.level = breederLevel;
        breeder.verification.status = VerificationStatus.REVIEWING;
        breeder.verification.submittedAt = new Date();

        await breeder.save();

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
            verificationStatus: breeder.verification.status,
            uploadedDocuments,
            isDocumentsComplete: true,
            submittedAt: breeder.verification.submittedAt,
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
        profileImageUrl?: string;
    }> {
        this.logger.logStart('checkSocialUser', '소셜 사용자 존재 여부 확인', {
            provider,
            providerId,
            email,
        });

        // 입양자 검색
        const adopter = await this.adopterModel
            .findOne({
                'socialAuthInfo.authProvider': provider,
                'socialAuthInfo.providerUserId': providerId,
            })
            .lean()
            .exec();

        if (adopter) {
            this.logger.logSuccess('checkSocialUser', '입양자 계정 발견', {
                userId: adopter._id,
            });

            return {
                exists: true,
                userRole: 'adopter',
                userId: (adopter._id as any).toString(),
                email: adopter.emailAddress,
                nickname: adopter.nickname,
                profileImageUrl: adopter.profileImageUrl,
            };
        }

        // 브리더 검색
        const breeder = await this.breederModel
            .findOne({
                'socialAuth.provider': provider,
                'socialAuth.providerId': providerId,
            })
            .lean()
            .exec();

        if (breeder) {
            this.logger.logSuccess('checkSocialUser', '브리더 계정 발견', {
                userId: breeder._id,
            });

            return {
                exists: true,
                userRole: 'breeder',
                userId: (breeder._id as any).toString(),
                email: breeder.emailAddress,
                nickname: breeder.name,
                profileImageUrl: breeder.profileImageUrl,
            };
        }

        this.logger.logSuccess('checkSocialUser', '미가입 사용자', {
            provider,
            providerId,
        });

        return {
            exists: false,
        };
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
        breederLocation: string;
        animal: string;
        breeds: string[];
        plan: string;
        level: string;
        termAgreed: boolean;
        privacyAgreed: boolean;
        marketingAgreed?: boolean;
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
        if (!dto.termAgreed || !dto.privacyAgreed) {
            throw new BadRequestException('필수 약관에 동의해야 합니다.');
        }

        // 이메일 중복 체크
        const existingBreeder = await this.breederModel.findOne({
            emailAddress: dto.email,
        });

        if (existingBreeder) {
            throw new ConflictException('이미 가입된 이메일입니다.');
        }

        // 입양자로도 가입되어 있는지 확인
        const existingAdopter = await this.adopterModel.findOne({
            emailAddress: dto.email,
        });

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

        // 브리더 위치 파싱 ("서울특별시 강남구" -> city: "서울특별시", district: "강남구")
        let city = '';
        let district = '';

        if (dto.breederLocation) {
            const locationParts = dto.breederLocation.split(' ');
            if (locationParts.length >= 2) {
                city = locationParts[0];
                district = locationParts.slice(1).join(' ');
            } else {
                city = dto.breederLocation;
                district = '';
            }
        }

        // 업로드된 서류 URL 배열을 documents 배열로 변환
        const verificationDocuments =
            dto.documentUrls?.map((url, index) => ({
                url: url,  // 스키마에 맞게 'url' 필드 사용
                type: dto.documentTypes?.[index] || this.extractDocumentType(url),  // documentTypes 우선 사용, 없으면 URL에서 추출
                uploadedAt: new Date(),
            })) || [];

        if (verificationDocuments.length > 0) {
            this.logger.logSuccess(
                'registerBreeder',
                '인증 서류 URL 처리 완료',
                {
                    documentCount: verificationDocuments.length,
                    documentTypes: verificationDocuments.map((doc) => doc.type),
                },
            );
        }

        // 브리더 생성
        const breeder = new this.breederModel({
            // User 스키마 필드 (상속)
            emailAddress: dto.email,
            nickname: dto.breederName, // 브리더명을 nickname으로 사용
            phoneNumber: this.normalizePhoneNumber(dto.phoneNumber),
            profileImageUrl: dto.profileImage || undefined,
            socialAuthInfo: socialAuthInfo,
            userRole: 'breeder',
            accountStatus: UserStatus.ACTIVE,
            termsAgreed: dto.termAgreed,
            privacyAgreed: dto.privacyAgreed,
            marketingAgreed: dto.marketingAgreed || false,
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

        const savedBreeder = await breeder.save();

        this.logger.logSuccess('registerBreeder', '브리더 생성 완료', {
            breederId: savedBreeder._id,
            email: savedBreeder.emailAddress,
            name: savedBreeder.name,
        });

        // 토큰 생성
        const tokens = this.generateTokens(
            (savedBreeder._id as any).toString(),
            savedBreeder.emailAddress,
            'breeder',
        );

        // Refresh 토큰 저장
        const hashedRefreshToken = await this.hashRefreshToken(tokens.refreshToken);
        savedBreeder.refreshToken = hashedRefreshToken;
        await savedBreeder.save();

        this.logger.logSuccess('registerBreeder', '브리더 회원가입 완료', {
            breederId: savedBreeder._id,
            accessToken: tokens.accessToken.substring(0, 20) + '...',
        });

        return {
            breederId: (savedBreeder._id as any).toString(),
            email: savedBreeder.emailAddress,
            breederName: savedBreeder.name,
            breederLocation: dto.breederLocation,
            animal: savedBreeder.petType,
            breeds: savedBreeder.breeds,
            plan: savedBreeder.verification.plan,
            level: savedBreeder.verification.level,
            verificationStatus: savedBreeder.verification.status,
            createdAt: savedBreeder.createdAt?.toISOString() || new Date().toISOString(),
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };
    }
}
