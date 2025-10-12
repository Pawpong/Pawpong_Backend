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
    UseInterceptors,
    UploadedFile,
    UploadedFiles,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

import { CurrentUser } from '../../common/decorator/current-user.decorator';
import { ApiController, ApiEndpoint } from '../../common/decorator/swagger.decorator';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';

import { AuthService } from './auth.service';
import { SmsService } from './sms.service';

import { LoginRequestDto } from './dto/request/login-request.dto';
import { RefreshTokenRequestDto } from './dto/request/refresh-token-request.dto';
import { RegisterAdopterRequestDto } from './dto/request/register-adopter-request.dto';
import { RegisterBreederRequestDto } from './dto/request/register-breeder-request.dto';
import { SendVerificationCodeRequestDto, VerifyCodeRequestDto } from './dto/request/phone-verification-request.dto';
import { CompleteSocialRegistrationDto } from './dto/request/social-login-request.dto';
import { CheckNicknameRequestDto } from './dto/request/check-nickname-request.dto';
import { BreederDocumentUploadRequestDto } from './dto/request/breeder-document-upload-request.dto';
import { ApiResponseDto } from '../../common/dto/response/api-response.dto';
import { AuthResponseDto } from './dto/response/auth-response.dto';
import { TokenResponseDto } from './dto/response/token-response.dto';
import { PhoneVerificationResponseDto } from './dto/response/phone-verification-response.dto';
import { BreederDocumentUploadResponseDto } from './dto/response/breeder-document-upload-response.dto';

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
        isPublic: false,
    })
    async logout(@CurrentUser() user: any): Promise<ApiResponseDto<any>> {
        await this.authService.logout(user.userId, user.role);
        return ApiResponseDto.success(null, '로그아웃되었습니다.');
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

            // 프론트엔드로 토큰 전달 (URL 파라미터)
            const redirectUrl = `${frontendUrl}/login/success?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`;
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

            // 프론트엔드로 토큰 전달 (URL 파라미터)
            const redirectUrl = `${frontendUrl}/login/success?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`;
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

            // 프론트엔드로 토큰 전달 (URL 파라미터)
            const redirectUrl = `${frontendUrl}/login/success?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`;
            return res.redirect(redirectUrl);
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
        responseType: Object,
        isPublic: true,
    })
    async checkSocialUser(
        @Body('provider') provider: string,
        @Body('providerId') providerId: string,
        @Body('email') email?: string,
    ): Promise<ApiResponseDto<any>> {
        const result = await this.authService.checkSocialUser(provider, providerId, email);
        return ApiResponseDto.success(result, result.exists ? '가입된 사용자입니다.' : '미가입 사용자입니다.');
    }

    @Post('social/complete')
    @HttpCode(HttpStatus.OK)
    @ApiEndpoint({
        summary: '소셜 회원가입 완료',
        description: '소셜 로그인 후 추가 정보를 입력하여 회원가입을 완료합니다.',
        responseType: AuthResponseDto,
        isPublic: true,
    })
    async completeSocialRegistration(
        @Body() dto: CompleteSocialRegistrationDto,
    ): Promise<ApiResponseDto<AuthResponseDto>> {
        const result = await this.authService.completeSocialRegistrationWithTempId(dto);
        return ApiResponseDto.success(result, '소셜 회원가입이 완료되었습니다.');
    }

    @Post('breeder/submit-documents')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiEndpoint({
        summary: '브리더 서류 제출',
        description: `브리더 레벨에 따라 필수 서류를 제출합니다.

**New 레벨 (필수 2개)**:
- 신분증 사본 (idCardUrl)
- 동물생산업 등록증 (animalProductionLicenseUrl)

**Elite 레벨 (필수 5개 + 선택 1개)**:
- 신분증 사본 (idCardUrl) - 필수
- 동물생산업 등록증 (animalProductionLicenseUrl) - 필수
- 표준 입양계약서 샘플 (adoptionContractSampleUrl) - 필수
- 최근 발급한 협회 서류 (recentAssociationDocumentUrl) - 필수
- 고양이 브리더 인증 서류 (breederCertificationUrl) - 필수
- TICA 또는 CFA 서류 (ticaCfaDocumentUrl) - 선택`,
        responseType: BreederDocumentUploadResponseDto,
        isPublic: false,
    })
    async submitDocuments(
        @CurrentUser() user: any,
        @Body() dto: BreederDocumentUploadRequestDto,
    ): Promise<ApiResponseDto<BreederDocumentUploadResponseDto>> {
        const result = await this.authService.submitBreederDocuments(user.userId, dto.breederLevel as 'elite' | 'new', {
            idCardUrl: dto.idCardUrl,
            animalProductionLicenseUrl: dto.animalProductionLicenseUrl,
            adoptionContractSampleUrl: dto.adoptionContractSampleUrl,
            recentAssociationDocumentUrl: dto.recentAssociationDocumentUrl,
            breederCertificationUrl: dto.breederCertificationUrl,
            ticaCfaDocumentUrl: dto.ticaCfaDocumentUrl,
        });
        return ApiResponseDto.success(result, '서류가 성공적으로 제출되었습니다.');
    }
}
