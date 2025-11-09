import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { ApplicationStatus } from '../../../common/enum/user.enum';

import { AdoptionApplication, AdoptionApplicationDocument } from '../../../schema/adoption-application.schema';

/**
 * AdoptionApplication Repository
 * 입양 신청 컬렉션에 대한 데이터 접근 로직
 */
@Injectable()
export class AdoptionApplicationRepository {
    constructor(
        @InjectModel(AdoptionApplication.name) private adoptionApplicationModel: Model<AdoptionApplicationDocument>,
    ) {}

    /**
     * ID로 AdoptionApplication 조회
     * @param id AdoptionApplication ID
     * @returns AdoptionApplication 또는 null
     */
    async findById(id: string): Promise<AdoptionApplicationDocument | null> {
        return this.adoptionApplicationModel.findById(id).exec() as any;
    }

    /**
     * ID와 브리더 ID로 AdoptionApplication 조회 (권한 체크용)
     * @param id AdoptionApplication ID
     * @param breederId 브리더 ID
     * @returns AdoptionApplication 또는 null
     */
    async findByIdAndBreeder(id: string, breederId: string): Promise<AdoptionApplicationDocument | null> {
        return this.adoptionApplicationModel.findOne({ _id: id, breederId }).exec() as any;
    }

    /**
     * 브리더가 받은 입양 신청 목록 조회 (페이지네이션)
     * @param breederId 브리더 ID
     * @param page 페이지 번호
     * @param limit 페이지당 항목 수
     * @returns 입양 신청 목록과 전체 개수
     */
    async findByBreederId(
        breederId: string,
        page: number = 1,
        limit: number = 10,
    ): Promise<{ applications: AdoptionApplicationDocument[]; total: number }> {
        const skip = (page - 1) * limit;

        const [applications, total] = await Promise.all([
            this.adoptionApplicationModel
                .find({ breederId })
                .sort({ appliedAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean() as any,
            this.adoptionApplicationModel.countDocuments({ breederId }),
        ]);

        return { applications, total };
    }

    /**
     * 특정 상태의 입양 신청 수 조회
     * @param breederId 브리더 ID
     * @param status 입양 신청 상태
     * @returns 해당 상태의 입양 신청 수
     */
    async countByStatus(breederId: string, status: ApplicationStatus): Promise<number> {
        return this.adoptionApplicationModel.countDocuments({ breederId, status });
    }

    /**
     * 최근 입양 신청 목록 조회
     * @param breederId 브리더 ID
     * @param limit 조회할 개수
     * @returns 최근 입양 신청 목록
     */
    async findRecentByBreeder(breederId: string, limit: number = 5): Promise<AdoptionApplicationDocument[]> {
        return this.adoptionApplicationModel.find({ breederId }).sort({ appliedAt: -1 }).limit(limit).lean() as any;
    }

    /**
     * 반려동물별 입양 신청 수 집계
     * @param petIds 반려동물 ID 배열
     * @returns 반려동물별 입양 신청 수 맵
     */
    async countByPetIds(petIds: string[]): Promise<Map<string, number>> {
        const result = await this.adoptionApplicationModel.aggregate([
            { $match: { petId: { $in: petIds } } },
            { $group: { _id: '$petId', count: { $sum: 1 } } },
        ]);

        return new Map(result.map((item: any) => [item._id, item.count]));
    }

    /**
     * 입양 신청 상태 업데이트
     * @param id AdoptionApplication ID
     * @param status 새로운 상태
     * @returns 업데이트된 AdoptionApplication 또는 null
     */
    async updateStatus(id: string, status: ApplicationStatus): Promise<AdoptionApplicationDocument | null> {
        return this.adoptionApplicationModel.findByIdAndUpdate(id, { status }, { new: true }).exec() as any;
    }

    /**
     * 입양 신청 생성
     * @param data 생성할 데이터
     * @returns 생성된 AdoptionApplication
     */
    async create(data: Partial<AdoptionApplication>): Promise<AdoptionApplicationDocument> {
        const application = new this.adoptionApplicationModel(data);
        return application.save() as any;
    }

    /**
     * 입양 신청 업데이트
     * @param id AdoptionApplication ID
     * @param updateData 업데이트할 데이터
     * @returns 업데이트된 AdoptionApplication 또는 null
     */
    async update(id: string, updateData: Partial<AdoptionApplication>): Promise<AdoptionApplicationDocument | null> {
        return this.adoptionApplicationModel.findByIdAndUpdate(id, { $set: updateData }, { new: true }).exec() as any;
    }
}
