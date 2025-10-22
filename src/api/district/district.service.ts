import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { District } from '../../schema/district.schema';
import { KOREA_DISTRICTS } from '../../common/data/districts.data';
import { GetDistrictsResponseDto } from './dto/response/get-districts-response.dto';

@Injectable()
export class DistrictService {
    private isSeeded = false;

    constructor(@InjectModel(District.name) private readonly districtModel: Model<District>) {}

    /**
     * 필요시에만 시드 데이터 삽입 (Lazy Loading)
     */
    private async ensureSeeded() {
        if (this.isSeeded) return;

        try {
            const count = await this.districtModel.countDocuments().maxTimeMS(3000);
            if (count === 0) {
                console.log('[DistrictService] 시/군/구 데이터 삽입 시작');
                await this.districtModel.insertMany(KOREA_DISTRICTS);
                console.log(`[DistrictService] ${KOREA_DISTRICTS.length}개 시/도 데이터 삽입 완료`);
            }
            this.isSeeded = true;
        } catch (error) {
            console.error('[DistrictService] 시드 데이터 확인 실패:', error);
            // 에러가 발생해도 서비스는 계속 작동
        }
    }

    /**
     * 모든 시/도 목록 조회
     */
    async getAllCities(): Promise<string[]> {
        await this.ensureSeeded();
        const districts = await this.districtModel.find().select('city -_id').exec();
        const cities = districts.map((d) => d.city);
        return cities;
    }

    /**
     * 특정 시/도의 시/군/구 목록 조회
     */
    async getDistricts(city: string): Promise<GetDistrictsResponseDto> {
        await this.ensureSeeded();
        const result = await this.districtModel.findOne({ city }).exec();

        if (!result) {
            throw new NotFoundException(`${city}에 대한 데이터를 찾을 수 없습니다.`);
        }

        const response = new GetDistrictsResponseDto(result.city, result.districts);
        return response;
    }
}
