import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { PetStatus } from '../../../common/enum/user.enum';

import { AvailablePet, AvailablePetDocument } from '../../../schema/available-pet.schema';

/**
 * AvailablePetManagement Repository
 * 브리더 관리용 분양 가능 반려동물 컬렉션 데이터 접근 로직
 */
@Injectable()
export class AvailablePetManagementRepository {
    constructor(@InjectModel(AvailablePet.name) private availablePetModel: Model<AvailablePetDocument>) {}

    /**
     * ID로 AvailablePet 조회
     * @param id AvailablePet ID
     * @returns AvailablePet 또는 null
     */
    async findById(id: string): Promise<AvailablePetDocument | null> {
        return this.availablePetModel.findById(id).exec() as any;
    }

    /**
     * ID와 브리더 ID로 AvailablePet 조회 (권한 체크용)
     * @param id AvailablePet ID
     * @param breederId 브리더 ID
     * @returns AvailablePet 또는 null
     */
    async findByIdAndBreeder(id: string, breederId: string): Promise<AvailablePetDocument | null> {
        return this.availablePetModel.findOne({ _id: id, breederId }).exec() as any;
    }

    /**
     * 브리더 ID로 AvailablePet 목록 조회 (필터링 및 페이지네이션)
     * @param breederId 브리더 ID
     * @param options 조회 옵션 (status, includeInactive, page, limit)
     * @returns AvailablePet 목록과 전체 개수
     */
    async findByBreederIdWithFilters(
        breederId: string,
        options: {
            status?: string;
            includeInactive?: boolean;
            page?: number;
            limit?: number;
        } = {},
    ): Promise<{ pets: AvailablePetDocument[]; total: number }> {
        const { status, includeInactive = false, page = 1, limit = 20 } = options;

        // 필터 조건 구성
        const filter: any = { breederId };
        if (!includeInactive) {
            filter.isActive = true;
        }
        if (status) {
            filter.status = status;
        }

        const skip = (page - 1) * limit;

        const [pets, total] = await Promise.all([
            this.availablePetModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean() as any,
            this.availablePetModel.countDocuments(filter),
        ]);

        return { pets, total };
    }

    /**
     * 브리더의 특정 상태별 AvailablePet 수 조회
     * @param breederId 브리더 ID
     * @param status 반려동물 상태
     * @param isActive 활성화 여부
     * @returns AvailablePet 수
     */
    async countByStatus(breederId: string, status: PetStatus, isActive: boolean = true): Promise<number> {
        return this.availablePetModel.countDocuments({ breederId, status, isActive });
    }

    /**
     * 브리더의 비활성화된 AvailablePet 수 조회
     * @param breederId 브리더 ID
     * @returns 비활성화된 AvailablePet 수
     */
    async countInactive(breederId: string): Promise<number> {
        return this.availablePetModel.countDocuments({ breederId, isActive: false });
    }

    /**
     * 새로운 AvailablePet 생성
     * @param data 생성할 데이터
     * @returns 생성된 AvailablePet
     */
    async create(data: Partial<AvailablePet>): Promise<AvailablePetDocument> {
        const availablePet = new this.availablePetModel(data);
        return availablePet.save() as any;
    }

    /**
     * AvailablePet 업데이트
     * @param id AvailablePet ID
     * @param updateData 업데이트할 데이터
     * @returns 업데이트된 AvailablePet 또는 null
     */
    async update(id: string, updateData: Partial<AvailablePet>): Promise<AvailablePetDocument | null> {
        return this.availablePetModel.findByIdAndUpdate(id, { $set: updateData }, { new: true }).exec() as any;
    }

    /**
     * AvailablePet 상태 업데이트
     * @param id AvailablePet ID
     * @param status 새로운 상태
     * @returns 업데이트된 AvailablePet 또는 null
     */
    async updateStatus(id: string, status: PetStatus): Promise<AvailablePetDocument | null> {
        return this.availablePetModel.findByIdAndUpdate(id, { $set: { status } }, { new: true }).exec() as any;
    }

    /**
     * AvailablePet 삭제
     * @param id AvailablePet ID
     * @returns 삭제된 AvailablePet 또는 null
     */
    async delete(id: string): Promise<AvailablePetDocument | null> {
        return this.availablePetModel.findByIdAndDelete(id).exec() as any;
    }
}
