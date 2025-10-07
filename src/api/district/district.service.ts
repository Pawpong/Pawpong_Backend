import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { District } from '../../schema/district.schema';
import { KOREA_DISTRICTS } from '../../common/data/districts.data';
import { GetDistrictsResponseDto } from './dto/response/get-districts-response.dto';

@Injectable()
export class DistrictService implements OnModuleInit {
    constructor(
        @InjectModel(District.name) private readonly districtModel: Model<District>,
    ) {}

    /**
     * 모듈 초기화 시 시드 데이터 삽입
     */
    async onModuleInit() {
        await this.seedDistricts();
    }

    /**
     * 시드 데이터 삽입
     */
    private async seedDistricts() {
        try {
            const count = await this.districtModel.countDocuments();

            if (count === 0) {
                console.log('[DistrictService] 시/군/구 데이터 삽입 시작');
                await this.districtModel.insertMany(KOREA_DISTRICTS);
                console.log(`[DistrictService] ${KOREA_DISTRICTS.length}개 시/도 데이터 삽입 완료`);
            }
        } catch (error) {
            console.error('[DistrictService] 시/군/구 데이터 삽입 실패:', error);
        }
    }

    /**
     * 모든 시/도 목록 조회
     */
    async getAllCities(): Promise<string[]> {
        const districts = await this.districtModel.find().select('city -_id').exec();
        const cities = districts.map(d => d.city);
        return cities;
    }

    /**
     * 특정 시/도의 시/군/구 목록 조회
     */
    async getDistricts(city: string): Promise<GetDistrictsResponseDto> {
        const result = await this.districtModel.findOne({ city }).exec();

        if (!result) {
            throw new NotFoundException(`${city}에 대한 데이터를 찾을 수 없습니다.`);
        }

        const response = new GetDistrictsResponseDto(result.city, result.districts);
        return response;
    }
}
