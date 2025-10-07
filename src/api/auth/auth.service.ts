import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { Adopter, AdopterDocument } from '../../schema/adopter.schema';
import { Breeder, BreederDocument } from '../../schema/breeder.schema';
import { RegisterAdopterRequestDto } from './dto/request/register-adopter-request.dto';
import { RegisterBreederRequestDto } from './dto/request/register-breeder-request.dto';
import { LoginRequestDto } from './dto/request/login-request.dto';
import { AuthResponseDto } from './dto/response/auth-response.dto';
import { RefreshTokenRequestDto } from './dto/request/refresh-token-request.dto';
import { TokenResponseDto } from './dto/response/token-response.dto';
import { SocialProvider, UserStatus, VerificationStatus, BreederPlan } from '../../common/enum/user.enum';
import { CustomLoggerService } from '../../common/logger/custom-logger.service';
import { StorageService } from 'src/common/storage/storage.service';

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

    async registerAdopter(
        registerAdopterDto: RegisterAdopterRequestDto,
        profileImageFile?: Express.Multer.File,
    ): Promise<AuthResponseDto> {
        const existingAdopter = await this.adopterModel.findOne({
            emailAddress: registerAdopterDto.email,
        });

        if (existingAdopter) {
            throw new ConflictException('Email already exists');
        }

        // 닉네임 중복 체크
        const existingNickname = await this.adopterModel.findOne({
            nickname: registerAdopterDto.nickname,
        });

        if (existingNickname) {
            throw new ConflictException('Nickname already exists');
        }

        const hashedPassword = await bcrypt.hash(registerAdopterDto.password, 10);

        // 프로필 이미지 파일 업로드
        let profileImageFileName: string | undefined;
        if (profileImageFile) {
            const uploadResult = await this.storageService.uploadFile(profileImageFile, 'profiles');
            profileImageFileName = uploadResult.fileName;
        }

        const adopter = new this.adopterModel({
            emailAddress: registerAdopterDto.email,
            passwordHash: hashedPassword,
            nickname: registerAdopterDto.nickname,
            phoneNumber: registerAdopterDto.phone,
            profileImage: profileImageFileName,
            socialAuthInfo: {
                authProvider: SocialProvider.LOCAL,
            },
            accountStatus: UserStatus.ACTIVE,
            userRole: 'adopter',
            notificationSettings: {
                emailNotifications: true,
                smsNotifications: false,
                marketingNotifications: registerAdopterDto.agreeMarketing || false,
            },
            favoriteBreederList: [],
            adoptionApplicationList: [],
            writtenReviewList: [],
            submittedReportList: [],
        });

        const savedAdopter = await adopter.save();

        // 토큰 생성
        const tokens = this.generateTokens((savedAdopter._id as any).toString(), savedAdopter.emailAddress, 'adopter');

        // Refresh 토큰 해시 후 저장
        const hashedRefreshToken = await this.hashRefreshToken(tokens.refreshToken);
        savedAdopter.refreshToken = hashedRefreshToken;
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
            message: '입양자 회원가입이 완료되었습니다.',
        };
    }

    async registerBreeder(
        registerBreederDto: RegisterBreederRequestDto,
        profileImageFile?: Express.Multer.File,
    ): Promise<AuthResponseDto> {
        // 필수 약관 동의 체크
        if (!registerBreederDto.agreeTerms) {
            throw new BadRequestException('서비스 이용약관 동의는 필수입니다.');
        }

        if (!registerBreederDto.agreePrivacy) {
            throw new BadRequestException('개인정보 처리방침 동의는 필수입니다.');
        }

        // 이메일 중복 확인
        const existingBreeder = await this.breederModel.findOne({
            email: registerBreederDto.email,
        });

        if (existingBreeder) {
            throw new ConflictException('이미 가입된 이메일입니다.');
        }

        // 전화번호 중복 확인
        const existingPhone = await this.breederModel.findOne({
            phone: registerBreederDto.phone,
        });

        if (existingPhone) {
            throw new ConflictException('이미 등록된 전화번호입니다.');
        }

        // Plan 매핑
        let plan = BreederPlan.BASIC;
        if (registerBreederDto.plan === 'pro') plan = BreederPlan.PRO;

        // 비밀번호 해시
        const hashedPassword = await bcrypt.hash(registerBreederDto.password, 10);

        // 프로필 이미지 파일 업로드
        let profileImageFileName: string | undefined;
        if (profileImageFile) {
            const uploadResult = await this.storageService.uploadFile(profileImageFile, 'profiles');
            profileImageFileName = uploadResult.fileName;
        }

        const breeder = new this.breederModel({
            email: registerBreederDto.email,
            password: hashedPassword,
            name: registerBreederDto.breederName,
            phone: registerBreederDto.phone,
            profileImage: profileImageFileName,
            petType: registerBreederDto.petType,
            breeds: registerBreederDto.breeds,
            socialAuth: {
                provider: SocialProvider.LOCAL,
                providerId: null,
            },
            status: UserStatus.ACTIVE,
            verification: {
                status: VerificationStatus.PENDING,
                plan: plan,
                level: registerBreederDto.breederLevel,
                documents: [],
            },
            marketingAgreed: registerBreederDto.agreeMarketing,
            termsAgreed: registerBreederDto.agreeTerms,
            privacyAgreed: registerBreederDto.agreePrivacy,
            profile: {
                description: registerBreederDto.introduction || '안녕하세요',
                location: {
                    city: registerBreederDto.city,
                    district: registerBreederDto.district,
                },
                representativePhotos: [],
                specialization: [registerBreederDto.petType],
                experienceYears: 0,
            },
        });

        const savedBreeder = await breeder.save();

        // 토큰 생성
        const tokens = this.generateTokens((savedBreeder._id as any).toString(), savedBreeder.email, 'breeder');

        // Refresh 토큰 해시 후 저장
        const hashedRefreshToken = await this.hashRefreshToken(tokens.refreshToken);
        savedBreeder.refreshToken = hashedRefreshToken;
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
            message: '브리더 회원가입이 완료되었습니다.',
        };
    }

    async login(loginDto: LoginRequestDto): Promise<AuthResponseDto> {
        // Check adopter first
        let user = await this.adopterModel.findOne({ emailAddress: loginDto.email });
        let role = 'adopter';

        if (!user) {
            // Check breeder
            user = await this.breederModel.findOne({ email: loginDto.email });
            role = 'breeder';
        }

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Handle password verification with type casting
        let passwordHash: string;
        let userStatus: string;
        let email: string;
        let nickname: string;
        let profileImage: string | undefined;

        if (role === 'adopter') {
            const adopter = user as any;
            passwordHash = adopter.passwordHash;
            userStatus = adopter.accountStatus;
            email = adopter.emailAddress;
            nickname = adopter.nickname;
            profileImage = adopter.profileImageUrl;

            if (!passwordHash) {
                throw new UnauthorizedException('Invalid credentials');
            }

            const isPasswordValid = await bcrypt.compare(loginDto.password, passwordHash);
            if (!isPasswordValid) {
                throw new UnauthorizedException('Invalid credentials');
            }

            if (userStatus !== UserStatus.ACTIVE) {
                throw new UnauthorizedException('Account is suspended');
            }

            adopter.lastActivityAt = new Date();
            await adopter.save();
        } else {
            const breeder = user as any;
            passwordHash = breeder.password;
            userStatus = breeder.status;
            email = breeder.email;
            nickname = breeder.name;
            profileImage = breeder.profileImage;

            if (!passwordHash) {
                throw new UnauthorizedException('Invalid credentials');
            }

            const isPasswordValid = await bcrypt.compare(loginDto.password, passwordHash);
            if (!isPasswordValid) {
                throw new UnauthorizedException('Invalid credentials');
            }

            if (userStatus !== UserStatus.ACTIVE) {
                throw new UnauthorizedException('Account is suspended');
            }

            breeder.lastLoginAt = new Date();
            await breeder.save();
        }

        // 토큰 생성
        const tokens = this.generateTokens((user._id as any).toString(), email, role);

        // Refresh 토큰 해시 후 저장
        const hashedRefreshToken = await this.hashRefreshToken(tokens.refreshToken);
        if (role === 'adopter') {
            (user as any).refreshToken = hashedRefreshToken;
        } else {
            (user as any).refreshToken = hashedRefreshToken;
        }
        await user.save();

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            accessTokenExpiresIn: tokens.accessTokenExpiresIn,
            refreshTokenExpiresIn: tokens.refreshTokenExpiresIn,
            userInfo: {
                userId: (user._id as any).toString(),
                emailAddress: email,
                nickname: nickname,
                userRole: role,
                accountStatus: userStatus,
                profileImageUrl: profileImage,
            },
            message: '로그인이 완료되었습니다.',
        };
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
        const adopter = await this.adopterModel.findOne({ emailAddress: email });
        const breeder = await this.breederModel.findOne({ email: email });
        return !!(adopter || breeder);
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
                phoneNumber: additionalInfo.phone,
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
                phone: additionalInfo.phone,
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
                    plan: additionalInfo.plan === 'premium' ? BreederPlan.PREMIUM : BreederPlan.BASIC,
                    level: additionalInfo.level || 'new',
                    documents: [],
                },
                parentPets: [],
                availablePets: [],
                receivedApplications: [],
                reviews: [],
                reports: [],
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
                    lastActivityAt: new Date()
                }
            );
        } else if (user.role === 'breeder') {
            await this.breederModel.updateOne(
                { _id: user.userId },
                {
                    refreshToken: hashedRefreshToken,
                    lastLoginAt: new Date()
                }
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
     * 브리더 서류 제출 (2단계 회원가입)
     */
    async submitBreederDocuments(userId: string, dto: any): Promise<any> {
        const breeder = await this.breederModel.findById(userId);

        if (!breeder) {
            throw new BadRequestException('브리더를 찾을 수 없습니다.');
        }

        // 브리더 레벨에 따른 필수 서류 검증
        const requiredDocTypes = dto.breederLevel === 'elite'
            ? ['id_card', 'business_license', 'contract_sample', 'pedigree', 'breeder_certification']
            : ['id_card', 'business_license'];

        const submittedTypes = dto.documents.map((doc: any) => doc.type);
        const missingDocs = requiredDocTypes.filter(type => !submittedTypes.includes(type));

        if (missingDocs.length > 0) {
            throw new BadRequestException(
                `필수 서류가 누락되었습니다: ${missingDocs.join(', ')}`
            );
        }

        // 서류 정보를 verification.documents에 저장
        breeder.verification.documents = dto.documents.map((doc: any) => ({
            type: doc.type,
            url: doc.filename,
            uploadedAt: new Date(),
        }));

        breeder.verification.level = dto.breederLevel;
        breeder.verification.status = VerificationStatus.REVIEWING;
        breeder.verification.submittedAt = new Date();

        await breeder.save();

        return {
            message: '서류가 성공적으로 제출되었습니다. 관리자 검토 후 승인됩니다.',
            verificationStatus: breeder.verification.status,
        };
    }
}
