import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
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

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(Adopter.name) private adopterModel: Model<AdopterDocument>,
        @InjectModel(Breeder.name) private breederModel: Model<BreederDocument>,
        private jwtService: JwtService,
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

    async registerAdopter(registerAdopterDto: RegisterAdopterRequestDto): Promise<AuthResponseDto> {
        const existingAdopter = await this.adopterModel.findOne({
            email_address: registerAdopterDto.email,
        });

        if (existingAdopter) {
            throw new ConflictException('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(registerAdopterDto.password, 10);

        const adopter = new this.adopterModel({
            email_address: registerAdopterDto.email,
            password_hash: hashedPassword,
            full_name: registerAdopterDto.name,
            phone_number: registerAdopterDto.phone,
            social_auth_info: {
                auth_provider: SocialProvider.LOCAL,
            },
            account_status: UserStatus.ACTIVE,
            user_role: 'adopter',
            favorite_breeder_list: [],
            adoption_application_list: [],
            written_review_list: [],
            submitted_report_list: [],
        });

        const savedAdopter = await adopter.save();

        // 토큰 생성
        const tokens = this.generateTokens(
            (savedAdopter._id as any).toString(),
            savedAdopter.email_address,
            'adopter',
        );

        // Refresh 토큰 해시 후 저장
        const hashedRefreshToken = await this.hashRefreshToken(tokens.refreshToken);
        savedAdopter.refresh_token = hashedRefreshToken;
        await savedAdopter.save();

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            accessTokenExpiresIn: tokens.accessTokenExpiresIn,
            refreshTokenExpiresIn: tokens.refreshTokenExpiresIn,
            userInfo: {
                userId: (savedAdopter._id as any).toString(),
                emailAddress: savedAdopter.email_address,
                fullName: savedAdopter.full_name,
                userRole: 'adopter',
                accountStatus: savedAdopter.account_status,
                profileImageUrl: savedAdopter.profile_image_url,
            },
            message: '입양자 회원가입이 완료되었습니다.',
        };
    }

    async registerBreeder(registerBreederDto: RegisterBreederRequestDto): Promise<AuthResponseDto> {
        // Breeder schema uses camelCase, not snake_case
        const existingBreeder = await this.breederModel.findOne({
            email: registerBreederDto.email,
        });

        if (existingBreeder) {
            throw new ConflictException('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(registerBreederDto.password, 10);

        const breeder = new this.breederModel({
            email: registerBreederDto.email,
            password: hashedPassword,
            name: registerBreederDto.name,
            phone: registerBreederDto.phone,
            socialAuth: {
                provider: SocialProvider.LOCAL,
            },
            status: UserStatus.ACTIVE,
            verification: {
                status: VerificationStatus.PENDING,
                plan: BreederPlan.BASIC,
                documents: [],
            },
            parentPets: [],
            availablePets: [],
            applicationForm: [],
            receivedApplications: [],
            reviews: [],
            reports: [],
        });

        const savedBreeder = await breeder.save();

        // 토큰 생성
        const tokens = this.generateTokens(
            (savedBreeder._id as any).toString(),
            savedBreeder.email,
            'breeder',
        );

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
                fullName: savedBreeder.name,
                userRole: 'breeder',
                accountStatus: savedBreeder.status,
                profileImageUrl: savedBreeder.profileImage,
            },
            message: '브리더 회원가입이 완료되었습니다.',
        };
    }

    async login(loginDto: LoginRequestDto): Promise<AuthResponseDto> {
        // Check adopter first (adopter uses snake_case)
        let user = await this.adopterModel.findOne({ email_address: loginDto.email });
        let role = 'adopter';

        if (!user) {
            // Check breeder
            user = await this.breederModel.findOne({ email: loginDto.email });
            role = 'breeder';
        }

        if (!user) {
            // Check breeder (breeder uses camelCase)
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
        let fullName: string;
        let profileImage: string | undefined;

        if (role === 'adopter') {
            const adopter = user as any;
            passwordHash = adopter.password_hash;
            userStatus = adopter.account_status;
            email = adopter.email_address;
            fullName = adopter.full_name;
            profileImage = adopter.profile_image_url;

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

            adopter.last_activity_at = new Date();
            await adopter.save();
        } else {
            const breeder = user as any;
            passwordHash = breeder.password;
            userStatus = breeder.status;
            email = breeder.email;
            fullName = breeder.name;
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
            (user as any).refresh_token = hashedRefreshToken;
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
                fullName,
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
                hashedToken = user?.refresh_token;
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
            const tokens = this.generateTokens(
                payload.sub,
                payload.email,
                payload.role,
            );

            // 새 Refresh 토큰 해시 후 저장
            const newHashedRefreshToken = await this.hashRefreshToken(tokens.refreshToken);
            if (payload.role === 'adopter') {
                user.refresh_token = newHashedRefreshToken;
            } else {
                user.refreshToken = newHashedRefreshToken;
            }
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
                refresh_token: null 
            });
        } else if (role === 'breeder') {
            await this.breederModel.findByIdAndUpdate(userId, { 
                refreshToken: null 
            });
        }
    }
}
