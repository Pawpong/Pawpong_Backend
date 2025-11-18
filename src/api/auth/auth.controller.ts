import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
    Get,
    Req,
    Res,
    Query,
    UseInterceptors,
    UploadedFiles,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { ApiConsumes } from '@nestjs/swagger';
import type { Response } from 'express';

import { CurrentUser } from '../../common/decorator/current-user.decorator';
import { ApiController, ApiEndpoint } from '../../common/decorator/swagger.decorator';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guard/optional-jwt-auth.guard';

import { AuthService } from './auth.service';
import { SmsService } from './sms.service';

import { RefreshTokenRequestDto } from './dto/request/refresh-token-request.dto';
import { CheckNicknameRequestDto } from './dto/request/check-nickname-request.dto';
import { RegisterAdopterRequestDto } from './dto/request/register-adopter-request.dto';
import { RegisterBreederRequestDto } from './dto/request/register-breeder-request.dto';
import { SocialCompleteRequestDto } from './dto/request/social-complete-request.dto';
import { UploadBreederDocumentsRequestDto } from './dto/request/upload-breeder-documents-request.dto';
import { SendVerificationCodeRequestDto, VerifyCodeRequestDto } from './dto/request/phone-verification-request.dto';
import { ApiResponseDto } from '../../common/dto/response/api-response.dto';
import { TokenResponseDto } from './dto/response/token-response.dto';
import { LogoutResponseDto } from './dto/response/logout-response.dto';
import { UploadResponseDto } from '../upload/dto/response/upload-response.dto';
import { RegisterAdopterResponseDto } from './dto/response/register-adopter-response.dto';
import { RegisterBreederResponseDto } from './dto/response/register-breeder-response.dto';
import { PhoneVerificationResponseDto } from './dto/response/phone-verification-response.dto';
import { VerificationDocumentsResponseDto } from './dto/response/verification-documents-response.dto';
import { SocialCheckUserResponseDto } from './dto/response/social-check-user-response.dto';

@ApiController('인증')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly smsService: SmsService,
        private readonly configService: ConfigService,
    ) {}

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiEndpoint({
        summary: '토큰 재발급',
        description: 'Refresh 토큰을 사용하여 새로운 토큰을 발급받습니다.',
        responseType: TokenResponseDto,
        isPublic: true,
    })
    async refreshToken(@Body() refreshTokenDto: RefreshTokenRequestDto): Promise<ApiResponseDto<TokenResponseDto>> {
        const result = await this.authService.refreshToken(refreshTokenDto);
        return ApiResponseDto.success(result, '토큰이 재발급되었습니다.');
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiEndpoint({
        summary: '로그아웃',
        description: 'Refresh 토큰을 무효화하여 로그아웃 처리합니다.',
        responseType: LogoutResponseDto,
        isPublic: false,
    })
    async logout(@CurrentUser() user: any): Promise<ApiResponseDto<LogoutResponseDto>> {
        await this.authService.logout(user.userId, user.role);
        const response: LogoutResponseDto = {
            success: true,
            loggedOutAt: new Date().toISOString(),
            message: '로그아웃되었습니다.',
        };
        return ApiResponseDto.success(response, '로그아웃되었습니다.');
    }

    @Post('phone/send-code')
    @HttpCode(HttpStatus.OK)
    @ApiEndpoint({
        summary: '전화번호 인증코드 발송',
        description: '전화번호로 6자리 인증코드를 발송합니다.',
        responseType: PhoneVerificationResponseDto,
        isPublic: true,
    })
    async sendVerificationCode(
        @Body() sendCodeDto: SendVerificationCodeRequestDto,
    ): Promise<ApiResponseDto<PhoneVerificationResponseDto>> {
        const result = await this.smsService.sendVerificationCode(sendCodeDto.phone);
        return ApiResponseDto.success(new PhoneVerificationResponseDto(result.success, result.message));
    }

    @Post('phone/verify-code')
    @HttpCode(HttpStatus.OK)
    @ApiEndpoint({
        summary: '전화번호 인증코드 확인',
        description: '발송된 인증코드를 검증합니다.',
        responseType: PhoneVerificationResponseDto,
        isPublic: true,
    })
    async verifyCode(
        @Body() verifyCodeDto: VerifyCodeRequestDto,
    ): Promise<ApiResponseDto<PhoneVerificationResponseDto>> {
        const result = await this.smsService.verifyCode(verifyCodeDto.phone, verifyCodeDto.code);
        return ApiResponseDto.success(new PhoneVerificationResponseDto(result.success, result.message));
    }

    // ===== 소셜 로그인 =====

    @Get('google')
    @UseGuards(AuthGuard('google'))
    @ApiEndpoint({
        summary: '구글 로그인',
        description: '구글 OAuth 로그인을 시작합니다.',
        isPublic: true,
    })
    async googleLogin() {
        // Guard가 Google OAuth로 리다이렉트
    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleCallback(@Req() req, @Res() res: Response) {
        const result = await this.authService.handleSocialLogin(req.user);
        const frontendUrl = this.configService.get<string>('FRONTEND_URL');

        if (result.needsAdditionalInfo) {
            // 신규 사용자 - /signup으로 리다이렉트
            const redirectUrl = `${frontendUrl}/signup?tempId=${result.tempUserId}&provider=google&email=${req.user.email}&name=${req.user.name}&profileImage=${req.user.profileImage || ''}`;
            return res.redirect(redirectUrl);
        } else {
            // 기존 사용자 - 로그인 처리 (토큰 발급)
            const tokens = await this.authService.generateSocialLoginTokens(result.user);

            // HttpOnly 쿠키에 토큰 저장
            const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

            res.cookie('accessToken', tokens.accessToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: 'lax',
                path: '/',
                maxAge: 24 * 60 * 60 * 1000, // 24시간
            });

            res.cookie('refreshToken', tokens.refreshToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: 'lax',
                path: '/',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
            });

            res.cookie('userRole', result.user.role, {
                httpOnly: false,
                secure: isProduction,
                sameSite: 'lax',
                path: '/',
                maxAge: 24 * 60 * 60 * 1000, // 24시간
            });

            // 토큰 없이 프론트엔드로 리다이렉트
            const redirectUrl = `${frontendUrl}/explore`;
            return res.redirect(redirectUrl);
        }
    }

    @Get('naver')
    @UseGuards(AuthGuard('naver'))
    @ApiEndpoint({
        summary: '네이버 로그인',
        description: '네이버 OAuth 로그인을 시작합니다.',
        isPublic: true,
    })
    async naverLogin() {
        // Guard가 Naver OAuth로 리다이렉트
    }

    @Get('naver/callback')
    @UseGuards(AuthGuard('naver'))
    async naverCallback(@Req() req, @Res() res: Response) {
        const result = await this.authService.handleSocialLogin(req.user);
        const frontendUrl = this.configService.get<string>('FRONTEND_URL');

        if (result.needsAdditionalInfo) {
            // 신규 사용자 - /signup으로 리다이렉트
            const redirectUrl = `${frontendUrl}/signup?tempId=${result.tempUserId}&provider=naver&email=${req.user.email}&name=${req.user.name}&profileImage=${req.user.profileImage || ''}`;
            return res.redirect(redirectUrl);
        } else {
            // 기존 사용자 - 로그인 처리 (토큰 발급)
            const tokens = await this.authService.generateSocialLoginTokens(result.user);

            // HttpOnly 쿠키에 토큰 저장
            const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

            res.cookie('accessToken', tokens.accessToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: 'lax',
                path: '/',
                maxAge: 24 * 60 * 60 * 1000, // 24시간
            });

            res.cookie('refreshToken', tokens.refreshToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: 'lax',
                path: '/',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
            });

            res.cookie('userRole', result.user.role, {
                httpOnly: false,
                secure: isProduction,
                sameSite: 'lax',
                path: '/',
                maxAge: 24 * 60 * 60 * 1000, // 24시간
            });

            // 토큰 없이 프론트엔드로 리다이렉트
            const redirectUrl = `${frontendUrl}/explore`;
            return res.redirect(redirectUrl);
        }
    }

    @Get('kakao')
    @UseGuards(AuthGuard('kakao'))
    @ApiEndpoint({
        summary: '카카오 로그인',
        description: '카카오 OAuth 로그인을 시작합니다.',
        isPublic: true,
    })
    async kakaoLogin() {
        // Guard가 Kakao OAuth로 리다이렉트
    }

    @Get('kakao/callback')
    @UseGuards(AuthGuard('kakao'))
    async kakaoCallback(@Req() req, @Res() res: Response) {
        const result = await this.authService.handleSocialLogin(req.user);
        const frontendUrl = this.configService.get<string>('FRONTEND_URL');

        if (result.needsAdditionalInfo) {
            // 신규 사용자 - /signup으로 리다이렉트
            const needsEmail = req.user.needsEmail ? '&needsEmail=true' : '';
            const redirectUrl = `${frontendUrl}/signup?tempId=${result.tempUserId}&provider=kakao&email=${req.user.email}&name=${req.user.name}&profileImage=${req.user.profileImage || ''}${needsEmail}`;
            return res.redirect(redirectUrl);
        } else {
            // 기존 사용자 - 로그인 처리 (토큰 발급)
            const tokens = await this.authService.generateSocialLoginTokens(result.user);

            // HttpOnly 쿠키에 토큰 저장
            const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

            res.cookie('accessToken', tokens.accessToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: 'lax',
                path: '/',
                maxAge: 24 * 60 * 60 * 1000, // 24시간
            });

            res.cookie('refreshToken', tokens.refreshToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: 'lax',
                path: '/',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
            });

            res.cookie('userRole', result.user.role, {
                httpOnly: false,
                secure: isProduction,
                sameSite: 'lax',
                path: '/',
                maxAge: 24 * 60 * 60 * 1000, // 24시간
            });

            // 토큰 없이 프론트엔드로 리다이렉트
            const redirectUrl = `${frontendUrl}/explore`;
            return res.redirect(redirectUrl);
        }
    }

    @Post('social/complete')
    @HttpCode(HttpStatus.OK)
    @ApiEndpoint({
        summary: '소셜 로그인 회원가입 완료',
        description: `소셜 로그인 후 역할(role)에 따라 입양자 또는 브리더 회원가입을 완료합니다.

**프론트엔드 회원가입 플로우:**
1. 소셜 로그인 (Google/Naver/Kakao) → tempId 획득
2. 역할 선택 (adopter/breeder)
3. 필수 정보 입력
4. 이 엔드포인트로 회원가입 완료

**공통 필수 필드:**
- tempId: 소셜 로그인 후 받은 임시 ID
- email: 이메일 주소
- name: 이름
- role: 역할 (adopter 또는 breeder)

**입양자 전용 필드:**
- nickname: 닉네임 (필수)
- phone: 전화번호 (선택)
- marketingAgreed: 마케팅 수신 동의 (선택)

**브리더 전용 필드:**
- phone: 전화번호 (필수)
- petType: 브리딩 동물 종류 (cat/dog)
- plan: 플랜 유형 (basic/pro)
- breederName: 브리더명
- introduction: 소개글 (선택)
- city: 시/도
- district: 시/군/구 (선택)
- breeds: 품종 목록
- level: 브리더 레벨 (elite/new)
- marketingAgreed: 마케팅 수신 동의 (선택)

**응답 데이터:**
- accessToken: JWT Access 토큰
- refreshToken: JWT Refresh 토큰
- userInfo: 사용자 정보`,
        responseType: RegisterAdopterResponseDto,
        isPublic: true,
    })
    async completeSocialRegistration(
        @Body() dto: SocialCompleteRequestDto,
    ): Promise<ApiResponseDto<RegisterAdopterResponseDto | RegisterBreederResponseDto>> {
        if (dto.role === 'adopter') {
            // 입양자 회원가입 필수 필드 검증
            if (!dto.nickname) {
                throw new BadRequestException('입양자 회원가입 시 닉네임은 필수입니다.');
            }

            const adopterDto: RegisterAdopterRequestDto = {
                tempId: dto.tempId,
                email: dto.email,
                nickname: dto.nickname,
                phone: dto.phone,
                marketingAgreed: dto.marketingAgreed,
            };
            const result = await this.authService.registerAdopter(adopterDto);
            return ApiResponseDto.success(result, '입양자 회원가입이 완료되었습니다.');
        } else if (dto.role === 'breeder') {
            // 브리더 회원가입 필수 필드 검증
            if (!dto.phone) {
                throw new BadRequestException('브리더 회원가입 시 전화번호는 필수입니다.');
            }
            if (!dto.breederName) {
                throw new BadRequestException('브리더 회원가입 시 브리더명은 필수입니다.');
            }
            if (!dto.city) {
                throw new BadRequestException('브리더 회원가입 시 시/도는 필수입니다.');
            }
            if (!dto.petType) {
                throw new BadRequestException('브리더 회원가입 시 브리딩 동물 종류는 필수입니다.');
            }
            if (!dto.breeds || dto.breeds.length === 0) {
                throw new BadRequestException('브리더 회원가입 시 품종 목록은 필수입니다.');
            }
            if (!dto.plan) {
                throw new BadRequestException('브리더 회원가입 시 플랜은 필수입니다.');
            }
            if (!dto.level) {
                throw new BadRequestException('브리더 회원가입 시 레벨은 필수입니다.');
            }

            const breederDto: RegisterBreederRequestDto = {
                tempId: dto.tempId,
                provider: dto.provider, // ✅ 소셜 로그인 제공자 추가
                email: dto.email,
                phoneNumber: dto.phone,
                breederName: dto.breederName,
                breederLocation: {
                    city: dto.city,
                    district: dto.district,
                },
                animal: dto.petType,
                breeds: dto.breeds,
                plan: dto.plan,
                level: dto.level,
                agreements: {
                    termsOfService: true, // 소셜 로그인 시 기본 동의로 처리
                    privacyPolicy: true,
                    marketingConsent: dto.marketingAgreed ?? false,
                },
            };
            const result = await this.authService.registerBreeder(breederDto);
            return ApiResponseDto.success(result, '브리더 회원가입이 완료되었습니다.');
        } else {
            throw new BadRequestException('유효하지 않은 역할입니다.');
        }
    }

    @Post('check-email')
    @HttpCode(HttpStatus.OK)
    @ApiEndpoint({
        summary: '이메일 중복 체크',
        description: '입력한 이메일이 이미 가입되어 있는지 확인합니다.',
        responseType: Boolean,
        isPublic: true,
    })
    async checkEmailDuplicate(@Body('email') email: string): Promise<ApiResponseDto<{ isDuplicate: boolean }>> {
        const isDuplicate = await this.authService.checkEmailDuplicate(email);
        return ApiResponseDto.success(
            { isDuplicate },
            isDuplicate ? '이미 가입된 이메일입니다.' : '사용 가능한 이메일입니다.',
        );
    }

    @Post('check-nickname')
    @HttpCode(HttpStatus.OK)
    @ApiEndpoint({
        summary: '닉네임 중복 체크',
        description: '입력한 닉네임이 이미 사용 중인지 확인합니다.',
        responseType: Boolean,
        isPublic: true,
    })
    async checkNicknameDuplicate(
        @Body() checkNicknameDto: CheckNicknameRequestDto,
    ): Promise<ApiResponseDto<{ isDuplicate: boolean }>> {
        const isDuplicate = await this.authService.checkNicknameDuplicate(checkNicknameDto.nickname);
        return ApiResponseDto.success(
            { isDuplicate },
            isDuplicate ? '이미 사용 중인 닉네임입니다.' : '사용 가능한 닉네임입니다.',
        );
    }

    @Post('social/check-user')
    @HttpCode(HttpStatus.OK)
    @ApiEndpoint({
        summary: '소셜 로그인 사용자 존재 여부 확인',
        description:
            '소셜 로그인 제공자와 사용자 ID로 기존 가입 여부를 확인합니다. 존재하면 로그인, 없으면 회원가입 플로우로 진행합니다.',
        responseType: SocialCheckUserResponseDto,
        isPublic: true,
    })
    async checkSocialUser(
        @Body('provider') provider: string,
        @Body('providerId') providerId: string,
        @Body('email') email?: string,
    ): Promise<ApiResponseDto<SocialCheckUserResponseDto>> {
        const result = await this.authService.checkSocialUser(provider, providerId, email);
        return ApiResponseDto.success(result, result.exists ? '가입된 사용자입니다.' : '미가입 사용자입니다.');
    }

    @Post('register/adopter')
    @HttpCode(HttpStatus.OK)
    @ApiEndpoint({
        summary: '입양자 회원가입',
        description: `입양자 회원가입을 처리합니다. 소셜 로그인을 통한 회원가입을 지원합니다.

**프론트엔드 회원가입 플로우:**
1. 소셜 로그인 (Google/Naver/Kakao) → tempId 획득
2. (선택) 프로필 이미지 업로드 (/api/auth/upload-breeder-profile) → cdnUrl 획득
3. UserInfoSection: nickname, phoneNumber 입력
4. 이 엔드포인트로 회원가입 완료

**필수 필드:**
- tempId: 소셜 로그인 후 받은 임시 ID (형식: "temp_provider_userId_timestamp")
- nickname: 닉네임 (중복 체크 필수)
- phoneNumber: 전화번호 (SMS 인증 완료 필요)

**선택 필드:**
- profileImage: 프로필 이미지 CDN URL

**응답 데이터:**
- adopterId: 생성된 입양자 고유 ID
- accessToken: JWT Access 토큰 (1시간)
- refreshToken: JWT Refresh 토큰 (7일)

**주의사항:**
- email과 name은 소셜 로그인 정보에서 자동으로 가져옵니다.
- tempId는 한 번만 사용 가능합니다 (사용 후 만료).
- 이미 가입된 소셜 계정으로는 재가입할 수 없습니다.`,
        responseType: RegisterAdopterResponseDto,
        isPublic: true,
    })
    async registerAdopter(
        @Body() dto: RegisterAdopterRequestDto,
    ): Promise<ApiResponseDto<RegisterAdopterResponseDto>> {
        const result = await this.authService.registerAdopter(dto);
        return ApiResponseDto.success(result, '입양자 회원가입이 완료되었습니다.');
    }

    @Post('register/breeder')
    @HttpCode(HttpStatus.OK)
    @ApiEndpoint({
        summary: '브리더 회원가입',
        description: `브리더 회원가입을 처리합니다. 일반 가입과 소셜 로그인 모두 지원합니다.

**프론트엔드 회원가입 플로우:**
1. UserTypeSection: userType 선택 (breeder)
2. AnimalSection: animal 선택 (cat/dog)
3. PlanSection: plan 선택 (basic/pro)
4. UserInfoSection: email, phoneNumber, agreements 입력
5. BreederInfoSection: breederName, breederLocation, breeds, photo 입력
6. DocumentSection: level 선택 (MVP에서는 서류 제출 skip 가능)
7. SignupComplete: 완료

**주의사항:**
- 버킷(파일 업로드) 연결은 제외되어 있습니다.
- 서류 제출은 나중에 별도로 진행할 수 있습니다.
- 소셜 로그인 사용자는 tempId와 provider를 함께 전송합니다.`,
        responseType: RegisterBreederResponseDto,
        isPublic: true,
    })
    async registerBreeder(@Body() dto: RegisterBreederRequestDto): Promise<ApiResponseDto<RegisterBreederResponseDto>> {
        const result = await this.authService.registerBreeder(dto);
        return ApiResponseDto.success(result, '브리더 회원가입이 완료되었습니다.');
    }

    @Post('upload-breeder-profile')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiConsumes('multipart/form-data')
    @HttpCode(HttpStatus.OK)
    @ApiEndpoint({
        summary: '프로필 이미지 업로드',
        description: `브리더 또는 입양자의 프로필 이미지를 Google Cloud Storage에 업로드합니다.

**회원가입 플로우:**
1. 이 엔드포인트로 프로필 이미지 업로드
2. 응답의 **filename** 필드를 회원가입 API의 profileImage 필드에 포함
3. url 필드는 미리보기용 Signed URL (1시간 유효)

**⚠️ 중요: 응답 필드 사용법**
- url: Signed URL (미리보기용, 1시간 유효) - ❌ DB 저장 금지
- filename: 파일 경로 (DB 저장용) - ✅ 회원가입 시 profileImage에 사용
- size: 파일 크기

**잘못된 사용 (X):**
profileImage에 url 필드 값을 넣는 경우 (예: "https://cdn.pawpong.kr/profiles/uuid.png?Expires=...")

**올바른 사용 (O):**
profileImage에 filename 필드 값을 넣는 경우 (예: "profiles/uuid.png")

**로그인 후 사용:**
- 로그인 상태에서 업로드하면 자동으로 DB에 저장됩니다.

**제한사항:**
- 최대 5MB
- 허용 형식: jpg, jpeg, png, gif, webp`,
        responseType: UploadResponseDto,
        isPublic: true,
    })
    @UseInterceptors(FileInterceptor('file'))
    async uploadProfile(
        @UploadedFile() file: Express.Multer.File,
        @Query('tempId') tempId?: string,
        @CurrentUser() user?: any,
    ): Promise<ApiResponseDto<UploadResponseDto>> {
        if (!file) {
            throw new BadRequestException('파일이 업로드되지 않았습니다.');
        }

        const result = await this.authService.uploadProfileImage(file, user, tempId);

        const response = new UploadResponseDto(result.cdnUrl, result.fileName, result.size);

        const message = user
            ? '프로필 이미지가 업로드되고 저장되었습니다.'
            : tempId
            ? '프로필 이미지가 업로드되고 임시 저장되었습니다. 회원가입 시 자동으로 적용됩니다.'
            : '프로필 이미지가 업로드되었습니다. 회원가입 시 응답의 filename 필드를 profileImage에 사용하세요.';

        return ApiResponseDto.success(response, message);
    }

    @Post('upload-breeder-documents')
    @ApiConsumes('multipart/form-data')
    @HttpCode(HttpStatus.OK)
    @ApiEndpoint({
        summary: '브리더 인증 서류 업로드',
        description: `브리더 입점 인증 서류를 업로드합니다. 회원가입 전에 미리 업로드할 수 있습니다.

**회원가입 플로우:**
1. 이 엔드포인트로 서류 업로드
2. 응답의 각 항목에서 **filename** 필드를 documentUrls 배열에 포함
3. url 필드는 미리보기용 Signed URL (1시간 유효)

**⚠️ 중요: 응답 필드 사용법**
- url: Signed URL (미리보기용, 1시간 유효) - ❌ DB 저장 금지
- filename: 파일 경로 (DB 저장용) - ✅ 회원가입 시 documentUrls에 사용
- type: 서류 타입
- size: 파일 크기

**잘못된 사용 (X):**
documentUrls에 url 필드 값을 넣는 경우

**올바른 사용 (O):**
documentUrls에 filename 필드 값을 넣는 경우

**New 레벨 (필수 2개):**
- idCard: 신분증 사본
- animalProductionLicense: 동물생산업 등록증

**Elite 레벨 (필수 5개 + 선택 1개):**
- idCard: 신분증 사본 - 필수
- animalProductionLicense: 동물생산업 등록증 - 필수
- adoptionContractSample: 표준 입양계약서 샘플 - 필수
- recentAssociationDocument: 최근 발급한 협회 서류 - 필수
- breederCertification: 고양이 브리더 인증 서류 - 필수
- ticaCfaDocument: TICA 또는 CFA 서류 - 선택

**요청 형식:**
- files: 파일 배열 (New: 2개, Elite: 5~6개)
- types: 서류 타입 JSON 배열 (예: ["idCard","animalProductionLicense"])
- level: 브리더 레벨 ("new" 또는 "elite")

**제한사항:**
- 각 파일 최대 10MB
- 허용 형식: pdf, jpg, jpeg, png, webp, heic, gif 등
- 필수 서류가 모두 포함되어야 함`,
        responseType: VerificationDocumentsResponseDto,
        isPublic: true,
    })
    @UseInterceptors(
        FilesInterceptor('files', 10, {
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB
                files: 10,
            },
        }),
    )
    async uploadBreederDocuments(
        @UploadedFiles() files: Express.Multer.File[],
        @Body() dto: UploadBreederDocumentsRequestDto,
        @Query('tempId') tempId?: string,
    ): Promise<ApiResponseDto<VerificationDocumentsResponseDto>> {
        if (!files || files.length === 0) {
            throw new BadRequestException('파일이 업로드되지 않았습니다.');
        }

        const result = await this.authService.uploadBreederDocuments(files, dto.types, dto.level, tempId);

        const message = tempId
            ? `${dto.level} 레벨 브리더 인증 서류 ${result.count}개가 업로드되고 임시 저장되었습니다. 회원가입 시 자동으로 적용됩니다.`
            : `${dto.level} 레벨 브리더 인증 서류 ${result.count}개가 업로드되었습니다.`;

        return ApiResponseDto.success(result.response, message);
    }

}
