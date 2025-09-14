import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
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
import { SocialProvider, UserStatus, VerificationStatus, BreederPlan } from '../../common/enum/user.enum';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(Adopter.name) private adopterModel: Model<AdopterDocument>,
        @InjectModel(Breeder.name) private breederModel: Model<BreederDocument>,
        private jwtService: JwtService,
    ) {}

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

        const payload = {
            sub: (savedAdopter._id as any).toString(),
            email: savedAdopter.email_address,
            role: 'adopter',
        };

        return {
            accessToken: this.jwtService.sign(payload),
            expiresIn: 86400, // 24 hours in seconds
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

        const payload = {
            sub: (savedBreeder._id as any).toString(),
            email: savedBreeder.email,
            role: 'breeder',
        };

        return {
            accessToken: this.jwtService.sign(payload),
            expiresIn: 86400,
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

        const payload = {
            sub: (user._id as any).toString(),
            email,
            role,
        };

        return {
            accessToken: this.jwtService.sign(payload),
            expiresIn: 86400,
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
}
