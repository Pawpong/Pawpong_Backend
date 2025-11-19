import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { District } from '../../../schema/district.schema';

import { GetDistrictsResponseDto } from '../dto/response/get-districts-response.dto';

@Injectable()
export class DistrictService {
    constructor(@InjectModel(District.name) private readonly districtModel: Model<District>) {}

    /**
     * 모든 지역 데이터 조회 (city와 districts 전체 반환)
     */
    async getAllDistricts(): Promise<GetDistrictsResponseDto[]> {
        const districts = await this.districtModel.find().exec();
        return districts.map((d) => ({
            city: d.city,
            districts: d.districts,
        }));
    }
}
