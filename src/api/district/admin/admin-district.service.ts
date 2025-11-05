import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { District } from '../../../schema/district.schema';

import { CreateDistrictRequestDto } from './dto/request/create-district-request.dto';
import { UpdateDistrictRequestDto } from './dto/request/update-district-request.dto';
import { DistrictResponseDto } from '../dto/response/district-response.dto';

@Injectable()
export class AdminDistrictService {
    constructor(@InjectModel(District.name) private readonly districtModel: Model<District>) {}

    /**
     * 지역 생성
     */
    async createDistrict(dto: CreateDistrictRequestDto): Promise<DistrictResponseDto> {
        // 동일한 city를 가진 데이터가 이미 존재하는지 확인
        const existing = await this.districtModel.findOne({
            city: dto.city,
        });

        if (existing) {
            throw new ConflictException(`이미 ${dto.city} 데이터가 존재합니다.`);
        }

        const district = new this.districtModel(dto);
        const saved = await district.save();

        return this.toResponseDto(saved);
    }

    /**
     * 모든 지역 조회
     */
    async getAllDistricts(): Promise<DistrictResponseDto[]> {
        const districts = await this.districtModel.find().sort({ city: 1 }).exec();
        return districts.map((district) => this.toResponseDto(district));
    }

    /**
     * 특정 지역 조회
     */
    async getDistrictById(id: string): Promise<DistrictResponseDto> {
        const district = await this.districtModel.findById(id).exec();

        if (!district) {
            throw new BadRequestException(`ID ${id}에 해당하는 지역을 찾을 수 없습니다.`);
        }

        return this.toResponseDto(district);
    }

    /**
     * 지역 수정
     */
    async updateDistrict(id: string, dto: UpdateDistrictRequestDto): Promise<DistrictResponseDto> {
        const district = await this.districtModel.findById(id).exec();

        if (!district) {
            throw new BadRequestException(`ID ${id}에 해당하는 지역을 찾을 수 없습니다.`);
        }

        // city가 변경되는 경우 중복 체크
        if (dto.city && dto.city !== district.city) {
            const existing = await this.districtModel.findOne({
                city: dto.city,
                _id: { $ne: id },
            });

            if (existing) {
                throw new ConflictException(`이미 ${dto.city} 데이터가 존재합니다.`);
            }
        }

        // findByIdAndUpdate로 부분 업데이트 (스키마 검증 우회)
        const updated = await this.districtModel
            .findByIdAndUpdate(id, { $set: dto }, { new: true, runValidators: false })
            .exec();

        return this.toResponseDto(updated);
    }

    /**
     * 지역 삭제
     */
    async deleteDistrict(id: string): Promise<void> {
        const result = await this.districtModel.findByIdAndDelete(id).exec();

        if (!result) {
            throw new BadRequestException(`ID ${id}에 해당하는 지역을 찾을 수 없습니다.`);
        }
    }

    /**
     * Entity를 Response DTO로 변환
     */
    private toResponseDto(district: any): DistrictResponseDto {
        return {
            id: district._id.toString(),
            city: district.city,
            districts: district.districts,
            createdAt: district.createdAt,
            updatedAt: district.updatedAt,
        };
    }
}
