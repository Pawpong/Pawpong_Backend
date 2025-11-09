import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Admin, AdminDocument } from '../../../schema/admin.schema';

/**
 * Auth 도메인용 Admin Repository
 *
 * 역할:
 * - Auth 도메인에서 필요한 Admin 데이터베이스 쿼리 처리
 * - 관리자 로그인 관련 쿼리만 포함
 * - Service 계층과 데이터베이스 계층 분리
 *
 * 설계 원칙:
 * - 단일 책임: Auth 도메인 쿼리만 담당
 * - 도메인 독립성: Auth 도메인에서만 사용
 * - 재사용성: 공통 쿼리 메서드화
 */
@Injectable()
export class AuthAdminRepository {
    constructor(@InjectModel(Admin.name) private adminModel: Model<AdminDocument>) {}

    /**
     * ID로 관리자 조회
     */
    async findById(id: string): Promise<AdminDocument | null> {
        return this.adminModel.findById(id).exec() as Promise<AdminDocument | null>;
    }

    /**
     * 이메일로 관리자 조회
     */
    async findByEmail(email: string): Promise<AdminDocument | null> {
        return this.adminModel.findOne({ email }).exec() as Promise<AdminDocument | null>;
    }

    /**
     * 활성화된 관리자만 이메일로 조회
     */
    async findActiveByEmail(email: string): Promise<AdminDocument | null> {
        return this.adminModel.findOne({ email, status: 'active' }).exec() as Promise<AdminDocument | null>;
    }

    /**
     * 관리자 마지막 로그인 시간 업데이트
     */
    async updateLastLogin(adminId: string): Promise<void> {
        await this.adminModel.findByIdAndUpdate(adminId, { lastLoginAt: new Date() }).exec();
    }

    /**
     * 새로운 관리자 생성 (테스트용)
     */
    async create(adminData: Partial<Admin>): Promise<AdminDocument> {
        const admin = new this.adminModel(adminData);
        return admin.save();
    }
}
