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
                    email: breeder.email,
                    name: breeder.name,
                    role: 'breeder',
                    profileImage: breeder.profileImage,
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
                city: dto.city,
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
            city?: string;
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
            if (!additionalInfo.breederName || !additionalInfo.city || !additionalInfo.district) {
                throw new BadRequestException('브리더는 브리더명, 지역이 필요합니다.');
            }

            if (!additionalInfo.breeds || additionalInfo.breeds.length === 0) {
                throw new BadRequestException('최소 1개의 품종이 필요합니다.');
            }

            const breeder = new this.breederModel({
                email: profile.email,
                name: additionalInfo.breederName,
                phone: this.normalizePhoneNumber(additionalInfo.phone),
                profileImage: profile.profileImage,
                introduction: additionalInfo.introduction || '',
                specialization: [additionalInfo.petType || 'dog'],
                location: {
                    city: additionalInfo.city,
                    district: additionalInfo.district,
                },
                priceRange: {
                    min: 0,
                    max: 0,
                },
                representativePhotos: [],
                socialAuth: {
                    provider: profile.provider,
                    providerId: profile.providerId,
                    email: profile.email,
                },
                status: UserStatus.ACTIVE,
                marketingAgreed: additionalInfo.marketingAgreed || false,
                verification: {
                    status: VerificationStatus.PENDING,
                    plan: additionalInfo.plan === 'pro' ? BreederPlan.PRO : BreederPlan.BASIC,
                    level: additionalInfo.level || 'new',
                    documents: [],
                },
            });

            const savedBreeder = await breeder.save();

            // 토큰 생성
            const tokens = this.generateTokens((savedBreeder._id as any).toString(), savedBreeder.email, 'breeder');

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
                    emailAddress: savedBreeder.email,
                    nickname: savedBreeder.name,
                    userRole: 'breeder',
                    accountStatus: savedBreeder.status,
                    profileImageUrl: savedBreeder.profileImage,
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
     * 브리더 서류 제출
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
                email: breeder.email,
                nickname: breeder.name,
                profileImageUrl: breeder.profileImage,
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
}
