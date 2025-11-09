import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';

import { UserStatus, AdminAction, AdminTargetType } from '../../../common/enum/user.enum';

import { Admin, AdminDocument } from '../../../schema/admin.schema';
import { Breeder, BreederDocument } from '../../../schema/breeder.schema';
import { Adopter, AdopterDocument } from '../../../schema/adopter.schema';

import { UserSearchRequestDto } from './dto/request/user-search-request.dto';
import { UserManagementRequestDto } from './dto/request/user-management-request.dto';
import { UserManagementResponseDto } from './dto/response/user-management-response.dto';

/**
 * 사용자 관리 Admin 서비스
 *
 * 사용자 관리 관련 관리자 기능을 제공합니다:
 * - 관리자 프로필 관리
 * - 통합 사용자 관리 (입양자 + 브리더)
 * - 사용자 상태 변경
 */
@Injectable()
export class UserAdminService {
    constructor(
        @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
        @InjectModel(Breeder.name) private breederModel: Model<BreederDocument>,
        @InjectModel(Adopter.name) private adopterModel: Model<AdopterDocument>,
    ) {}

    /**
     * 관리자 활동 로그 기록
     * @private
     */
    private async logAdminActivity(
        adminId: string,
        action: AdminAction,
        targetType: AdminTargetType,
        targetId: string,
        targetName?: string,
        description?: string,
    ): Promise<void> {
        const admin = await this.adminModel.findById(adminId);
        if (admin) {
            const logEntry = {
                logId: randomUUID(),
                action,
                targetType,
                targetId,
                targetName,
                description: description || `${action} performed on ${targetType} ${targetName || targetId}`,
                performedAt: new Date(),
            };
            admin.activityLogs.push(logEntry);
            await admin.save();
        }
    }

    /**
     * 관리자 프로필 조회
     *
     * @param adminId 관리자 고유 ID
     * @returns 관리자 프로필 정보
     */
    async getAdminProfile(adminId: string): Promise<any> {
        const admin = await this.adminModel.findById(adminId).select('-password').lean();
        if (!admin) {
            throw new BadRequestException('관리자를 찾을 수 없습니다.');
        }

        return {
            id: (admin._id as any).toString(),
            name: admin.name,
            email: admin.email,
            status: admin.status,
            adminLevel: admin.adminLevel,
            permissions: admin.permissions,
            activityLogs: admin.activityLogs?.slice(-10) || [], // Last 10 activities
            createdAt: (admin as any).createdAt,
        };
    }

    /**
     * 통합 사용자 목록 조회
     *
     * 입양자와 브리더를 통합하여 조회합니다.
     *
     * @param adminId 관리자 고유 ID
     * @param filter 검색 필터 (role, status, keyword, pagination)
     * @returns 사용자 목록
     */
    async getUsers(adminId: string, filter: UserSearchRequestDto): Promise<any> {
        const admin = await this.adminModel.findById(adminId);
        if (!admin || !admin.permissions.canManageUsers) {
            throw new ForbiddenException('Access denied');
        }

        const { userRole, accountStatus, searchKeyword, pageNumber = 1, itemsPerPage = 10 } = filter;
        const skip = (pageNumber - 1) * itemsPerPage;

        let users: any[] = [];
        let total = 0;

        if (!userRole || userRole === 'adopter') {
            const adopterQuery: any = {};
            if (accountStatus) adopterQuery.account_status = accountStatus;
            if (searchKeyword) {
                adopterQuery.$or = [
                    { full_name: new RegExp(searchKeyword, 'i') },
                    { email_address: new RegExp(searchKeyword, 'i') },
                ];
            }

            const [adopterResults, adopterTotal] = await Promise.all([
                this.adopterModel
                    .find(adopterQuery)
                    .select('full_name email_address account_status last_activity_at created_at')
                    .sort({ createdAt: -1 })
                    .skip(userRole === 'adopter' ? skip : 0)
                    .limit(userRole === 'adopter' ? itemsPerPage : itemsPerPage / 2)
                    .lean(),
                this.adopterModel.countDocuments(adopterQuery),
            ]);

            users.push(...adopterResults.map((user) => ({ ...user, role: 'adopter' })));
            total += adopterTotal;
        }

        if (!userRole || userRole === 'breeder') {
            const breederQuery: any = {};
            if (accountStatus) breederQuery.status = accountStatus;
            if (searchKeyword) {
                breederQuery.$or = [
                    { name: new RegExp(searchKeyword, 'i') },
                    { email: new RegExp(searchKeyword, 'i') },
                ];
            }

            const [breederResults, breederTotal] = await Promise.all([
                this.breederModel
                    .find(breederQuery)
                    .select('name email status lastLoginAt createdAt stats')
                    .sort({ createdAt: -1 })
                    .skip(userRole === 'breeder' ? skip : 0)
                    .limit(userRole === 'breeder' ? itemsPerPage : itemsPerPage / 2)
                    .lean(),
                this.breederModel.countDocuments(breederQuery),
            ]);

            users.push(...breederResults.map((user) => ({ ...user, role: 'breeder' })));
            total += breederTotal;
        }

        return {
            users: users.map(
                (user): UserManagementResponseDto => ({
                    userId: (user._id as any).toString(),
                    userName: user.full_name || user.name,
                    emailAddress: user.email_address || user.email,
                    userRole: user.role,
                    accountStatus: user.account_status || user.status,
                    lastLoginAt: user.last_activity_at || user.lastLoginAt,
                    createdAt: user.created_at || user.createdAt,
                    statisticsInfo: user.stats,
                }),
            ),
            total,
            page: pageNumber,
            totalPages: Math.ceil(total / itemsPerPage),
            hasNext: pageNumber < Math.ceil(total / itemsPerPage),
            hasPrev: pageNumber > 1,
        };
    }

    /**
     * 사용자 상태 변경
     *
     * 입양자 또는 브리더의 계정 상태를 변경합니다 (활성화/정지).
     *
     * @param adminId 관리자 고유 ID
     * @param userId 대상 사용자 ID
     * @param role 사용자 역할 (adopter | breeder)
     * @param userData 상태 변경 데이터
     * @returns 변경 결과
     */
    async updateUserStatus(
        adminId: string,
        userId: string,
        role: 'adopter' | 'breeder',
        userData: UserManagementRequestDto,
    ): Promise<any> {
        const admin = await this.adminModel.findById(adminId);
        if (!admin || !admin.permissions.canManageUsers) {
            throw new ForbiddenException('Access denied');
        }

        let user: any;
        if (role === 'adopter') {
            user = await this.adopterModel.findById(userId);
        } else {
            user = await this.breederModel.findById(userId);
        }

        if (!user) {
            throw new BadRequestException(`${role === 'adopter' ? '입양자를' : '브리더를'} 찾을 수 없습니다.`);
        }

        if (role === 'adopter') {
            user.account_status = userData.accountStatus;
        } else {
            user.status = userData.accountStatus;
        }
        await user.save();

        const action =
            userData.accountStatus === UserStatus.SUSPENDED ? AdminAction.SUSPEND_USER : AdminAction.ACTIVATE_USER;

        await this.logAdminActivity(
            adminId,
            action,
            role === 'adopter' ? AdminTargetType.ADOPTER : AdminTargetType.BREEDER,
            userId,
            user.full_name || user.name,
            userData.actionReason || `User status changed to ${userData.accountStatus}`,
        );

        return { message: `${role} status updated to ${userData.accountStatus}` };
    }
}
