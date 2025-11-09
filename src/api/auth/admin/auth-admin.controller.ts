import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ApiEndpoint } from '../../../common/decorator/swagger.decorator';

import { AuthAdminService } from './auth-admin.service';

import { AdminLoginRequestDto } from '../dto/request/admin-login-request.dto';
import { AdminLoginResponseDto } from '../dto/response/admin-login-response.dto';
import { ApiResponseDto } from '../../../common/dto/response/api-response.dto';

/**
 * 관리자 인증 컨트롤러
 *
 * 관리자 로그인 등 관리자 전용 인증 API를 제공합니다.
 *
 * @tag Auth Admin - 관리자 인증
 */
@ApiTags('Auth Admin')
@Controller('auth/admin')
export class AuthAdminController {
    constructor(private readonly authAdminService: AuthAdminService) {}

    /**
     * 관리자 로그인
     *
     * 이메일과 비밀번호로 관리자 인증 후 JWT 토큰을 발급받습니다.
     * 관리자 전용 액세스 토큰과 리프레시 토큰을 반환합니다.
     *
     * @param dto - 관리자 로그인 요청 DTO (이메일, 비밀번호)
     * @returns 관리자 정보 및 JWT 토큰
     *
     * @throws UnauthorizedException - 이메일 또는 비밀번호가 올바르지 않을 때
     *
     * @example
     * POST /api/auth/admin/login
     * {
     *   "email": "admin@pawpong.com",
     *   "password": "admin1234"
     * }
     *
     * Response:
     * {
     *   "success": true,
     *   "code": 200,
     *   "data": {
     *     "adminId": "507f1f77bcf86cd799439011",
     *     "email": "admin@pawpong.com",
     *     "name": "홍길동",
     *     "adminLevel": "super_admin",
     *     "permissions": {
     *       "canManageUsers": true,
     *       "canManageBreeders": true,
     *       "canManageReports": true,
     *       "canViewStatistics": true,
     *       "canManageAdmins": true
     *     },
     *     "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     *     "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     *   },
     *   "message": "관리자 로그인이 완료되었습니다.",
     *   "timestamp": "2025-01-15T10:30:00.000Z"
     * }
     */
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiEndpoint({
        summary: '관리자 로그인',
        description: '이메일과 비밀번호로 관리자 인증 후 JWT 토큰을 발급받습니다.',
        responseType: AdminLoginResponseDto,
        isPublic: true,
    })
    async loginAdmin(@Body() dto: AdminLoginRequestDto): Promise<ApiResponseDto<AdminLoginResponseDto>> {
        const result = await this.authAdminService.loginAdmin(dto.email, dto.password);
        return ApiResponseDto.success(result, '관리자 로그인이 완료되었습니다.');
    }
}
