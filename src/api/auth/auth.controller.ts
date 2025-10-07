import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Req, Res, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
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
import { ApiResponseDto } from '../../common/dto/response/api-response.dto';
import { AuthResponseDto } from './dto/response/auth-response.dto';
import { TokenResponseDto } from './dto/response/token-response.dto';
import { PhoneVerificationResponseDto } from './dto/response/phone-verification-response.dto';

@ApiController('인증')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly smsService: SmsService,
        private readonly configService: ConfigService,
    ) {}

    @Post('register/adopter')
    @UseInterceptors(FileInterceptor('profileImage'))
    @ApiEndpoint({
        summary: '입양자 회원가입',
        description: '새로운 입양자 계정을 생성합니다. 프로필 이미지는 선택사항입니다. data 필드에 JSON 문자열로 전송하세요.',
        responseType: AuthResponseDto,
        isPublic: true,
    })
    async registerAdopter(
        @Body('data') dataString: string,
        @UploadedFile() profileImage?: Express.Multer.File,
    ): Promise<ApiResponseDto<AuthResponseDto>> {
        const registerAdopterDto: RegisterAdopterRequestDto = JSON.parse(dataString);
        const result = await this.authService.registerAdopter(registerAdopterDto, profileImage);
        return ApiResponseDto.success(result, '입양자 회원가입이 완료되었습니다.');
    }

    @Post('register/breeder')
    @UseInterceptors(FileInterceptor('profileImage'))
    @ApiEndpoint({
        summary: '브리더 일반 회원가입 (이메일/비밀번호)',
        description: '이메일과 비밀번호로 브리더 회원가입을 진행합니다. 프로필 이미지는 선택사항입니다. data 필드에 JSON 문자열로 전송하세요.',
        responseType: AuthResponseDto,
        isPublic: true,
    })
    async registerBreeder(
        @Body('data') dataString: string,
        @UploadedFile() profileImage?: Express.Multer.File,
    ): Promise<ApiResponseDto<AuthResponseDto>> {
        const registerBreederDto: RegisterBreederRequestDto = JSON.parse(dataString);
        const result = await this.authService.registerBreeder(registerBreederDto, profileImage);
        return ApiResponseDto.success(result, '브리더 회원가입이 완료되었습니다.');
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiEndpoint({
        summary: '사용자 로그인',
        description: '이메일과 비밀번호로 로그인합니다.',
        responseType: AuthResponseDto,
        isPublic: true,
    })
    async login(@Body() loginDto: LoginRequestDto): Promise<ApiResponseDto<AuthResponseDto>> {
        const result = await this.authService.login(loginDto);
        return ApiResponseDto.success(result, '로그인이 완료되었습니다.');
    }

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
}
