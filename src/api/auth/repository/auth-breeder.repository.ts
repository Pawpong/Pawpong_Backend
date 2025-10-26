import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Breeder, BreederDocument } from '../../../schema/breeder.schema';

/**
 * Auth 도메인용 Breeder Repository
 *
 * 역할:
 * - Auth 도메인에서 필요한 Breeder 데이터베이스 쿼리 처리
 * - 회원가입, 로그인, 소셜 인증, 서류 제출 관련 쿼리만 포함
 * - Service 계층과 데이터베이스 계층 분리
 *
 * 설계 원칙:
 * - 단일 책임: Auth 도메인 쿼리만 담당
 * - 도메인 독립성: Auth 도메인에서만 사용
 * - 재사용성: 공통 쿼리 메서드화
 */
@Injectable()
export class AuthBreederRepository {
    constructor(@InjectModel(Breeder.name) private breederModel: Model<BreederDocument>) {}

    /**
     * ID로 브리더 조회
     */
    async findById(id: string): Promise<BreederDocument | null> {
        return this.breederModel.findById(id).exec();
    }

    /**
     * 이메일로 브리더 조회
     */
    async findByEmail(email: string): Promise<BreederDocument | null> {
        return this.breederModel.findOne({ emailAddress: email }).lean().exec();
    }

    /**
     * 소셜 인증 정보로 브리더 조회
     */
    async findBySocialAuth(provider: string, providerId: string): Promise<BreederDocument | null> {
        return this.breederModel
            .findOne({
                'socialAuth.provider': provider,
                'socialAuth.providerId': providerId,
            })
            .lean()
            .exec();
    }

    /**
     * 브리더 생성
     */
    async create(breederData: Partial<Breeder>): Promise<BreederDocument> {
        const breeder = new this.breederModel(breederData);
        return breeder.save();
    }

    /**
     * 브리더 정보 업데이트
     */
    async update(id: string, updateData: Partial<Breeder>): Promise<BreederDocument | null> {
        return this.breederModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    }

    /**
     * Refresh 토큰 업데이트
     */
    async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
        await this.breederModel.findByIdAndUpdate(id, { refreshToken }).exec();
    }

    /**
     * 마지막 로그인 시간 업데이트
     */
    async updateLastLogin(id: string): Promise<void> {
        await this.breederModel.findByIdAndUpdate(id, { lastLoginAt: new Date() }).exec();
    }

    /**
     * 프로필 이미지 URL 업데이트
     */
    async updateProfileImage(id: string, profileImageUrl: string): Promise<void> {
        await this.breederModel.findByIdAndUpdate(id, { profileImageUrl }).exec();
    }

    /**
     * 브리더 인증 서류 업데이트
     */
    async updateVerificationDocuments(
        id: string,
        documents: Array<{ type: string; url: string; uploadedAt: Date }>,
        level: string,
        status: string,
        submittedAt: Date,
    ): Promise<BreederDocument | null> {
        return this.breederModel
            .findByIdAndUpdate(
                id,
                {
                    'verification.documents': documents,
                    'verification.level': level,
                    'verification.status': status,
                    'verification.submittedAt': submittedAt,
                },
                { new: true },
            )
            .exec();
    }
}
