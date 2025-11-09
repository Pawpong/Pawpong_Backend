import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { CustomLoggerService } from '../../../common/logger/custom-logger.service';
import { AuthAdminRepository } from '../repository/auth-admin.repository';
import { AdminLoginResponseDto } from '../dto/response/admin-login-response.dto';

/**
 * 관리자 인증 서비스
 *
 * 관리자 로그인, JWT 토큰 생성 등 관리자 인증 관련 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class AuthAdminService {
    constructor(
        private readonly authAdminRepository: AuthAdminRepository,
        private readonly jwtService: JwtService,
        private readonly logger: CustomLoggerService,
    ) {}

    /**
     * 관리자 로그인
     *
     * 이메일과 비밀번호로 관리자 인증 후 JWT 토큰을 발급합니다.
     *
     * @param email - 관리자 이메일
     * @param password - 관리자 비밀번호
     * @returns 관리자 정보 및 JWT 토큰
     *
     * @throws UnauthorizedException - 이메일 또는 비밀번호가 올바르지 않을 때
     *
     * @example
     * ```typescript
     * const result = await authAdminService.loginAdmin('admin@pawpong.com', 'password123');
     * console.log(result.accessToken); // JWT access token
     * ```
     */
    async loginAdmin(email: string, password: string): Promise<AdminLoginResponseDto> {
        this.logger.logStart('loginAdmin', '관리자 로그인 시작', { email });

        // 활성 상태인 관리자 조회
        const admin = await this.authAdminRepository.findActiveByEmail(email);

        if (!admin) {
            this.logger.logError('loginAdmin', '관리자 조회 실패', new Error('관리자를 찾을 수 없습니다'));
            throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
        }

        // 비밀번호 검증
        const isPasswordValid = await bcrypt.compare(password, admin.password);

        if (!isPasswordValid) {
            this.logger.logError('loginAdmin', '비밀번호 불일치', new Error('비밀번호가 올바르지 않습니다'));
            throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
        }

        // 마지막 로그인 시간 업데이트
        const adminId = (admin as any)._id.toString();
        await this.authAdminRepository.updateLastLogin(adminId);

        // JWT 토큰 생성
        const payload = {
            sub: adminId,
            email: admin.email,
            role: 'admin',
            adminLevel: admin.adminLevel,
        };

        const accessToken = this.jwtService.sign(payload, {
            expiresIn: '1h',
        });

        const refreshToken = this.jwtService.sign(payload, {
            expiresIn: '7d',
        });

        this.logger.logSuccess('loginAdmin', '관리자 로그인 성공', {
            adminId,
            email: admin.email,
            adminLevel: admin.adminLevel,
        });

        return {
            adminId,
            email: admin.email,
            name: admin.name,
            adminLevel: admin.adminLevel,
            permissions: admin.permissions,
            accessToken,
            refreshToken,
        };
    }
}
