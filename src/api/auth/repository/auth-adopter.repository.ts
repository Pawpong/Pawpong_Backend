import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Adopter, AdopterDocument } from '../../../schema/adopter.schema';

/**
 * Auth 도메인용 Adopter Repository
 *
 * 역할:
 * - Auth 도메인에서 필요한 Adopter 데이터베이스 쿼리 처리
 * - 회원가입, 로그인, 소셜 인증 관련 쿼리만 포함
 * - Service 계층과 데이터베이스 계층 분리
 *
 * 설계 원칙:
 * - 단일 책임: Auth 도메인 쿼리만 담당
 * - 도메인 독립성: Auth 도메인에서만 사용
 * - 재사용성: 공통 쿼리 메서드화
 */
@Injectable()
export class AuthAdopterRepository {
    constructor(@InjectModel(Adopter.name) private adopterModel: Model<AdopterDocument>) {}

    /**
     * ID로 입양자 조회
     */
    async findById(id: string): Promise<AdopterDocument | null> {
        return this.adopterModel.findById(id).exec();
    }

    /**
     * 이메일로 입양자 조회
     */
    async findByEmail(email: string): Promise<AdopterDocument | null> {
        return this.adopterModel.findOne({ emailAddress: email }).lean().exec();
    }

    /**
     * 닉네임으로 입양자 조회
     */
    async findByNickname(nickname: string): Promise<AdopterDocument | null> {
        return this.adopterModel.findOne({ nickname }).exec();
    }

    /**
     * 소셜 인증 정보로 입양자 조회
     */
    async findBySocialAuth(provider: string, providerId: string): Promise<AdopterDocument | null> {
        return this.adopterModel
            .findOne({
                'socialAuthInfo.authProvider': provider,
                'socialAuthInfo.providerUserId': providerId,
            })
            .lean()
            .exec();
    }

    /**
     * 입양자 생성
     */
    async create(adopterData: Partial<Adopter>): Promise<AdopterDocument> {
        const adopter = new this.adopterModel(adopterData);
        return adopter.save();
    }

    /**
     * 입양자 정보 업데이트
     */
    async update(id: string, updateData: Partial<Adopter>): Promise<AdopterDocument | null> {
        return this.adopterModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    }

    /**
     * Refresh 토큰 업데이트
     */
    async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
        await this.adopterModel.findByIdAndUpdate(id, { refreshToken }).exec();
    }

    /**
     * 마지막 활동 시간 업데이트
     */
    async updateLastActivity(id: string): Promise<void> {
        await this.adopterModel.findByIdAndUpdate(id, { lastActivityAt: new Date() }).exec();
    }

    /**
     * 프로필 이미지 파일명 업데이트
     * User 스키마의 profileImageFileName 필드에 파일명만 저장
     * 조회 시 StorageService가 Signed URL을 동적으로 생성
     */
    async updateProfileImage(id: string, fileName: string): Promise<void> {
        await this.adopterModel.findByIdAndUpdate(id, { profileImageFileName: fileName }).exec();
    }
}
