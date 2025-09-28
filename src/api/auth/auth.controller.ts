import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';

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
    ) {}

    @Post('register/adopter')
    @ApiEndpoint({
        summary: '입양자 회원가입',
        description: '새로운 입양자 계정을 생성합니다.',
        responseType: AuthResponseDto,
        isPublic: true,
    })
    async registerAdopter(
        @Body() registerAdopterDto: RegisterAdopterRequestDto,
    ): Promise<ApiResponseDto<AuthResponseDto>> {
        const result = await this.authService.registerAdopter(registerAdopterDto);
        return ApiResponseDto.success(result, '입양자 회원가입이 완료되었습니다.');
    }

    @Post('register/breeder')
    @ApiEndpoint({
        summary: '브리더 회원가입',
        description: '새로운 브리더 계정을 생성합니다.',
        responseType: AuthResponseDto,
        isPublic: true,
    })
    async registerBreeder(
        @Body() registerBreederDto: RegisterBreederRequestDto,
    ): Promise<ApiResponseDto<AuthResponseDto>> {
        const result = await this.authService.registerBreeder(registerBreederDto);
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
}
