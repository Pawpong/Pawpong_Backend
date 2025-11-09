import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { District } from '../../../schema/district.schema';
import { KOREA_DISTRICTS } from '../../../common/data/districts.data';
import { GetDistrictsResponseDto } from '../dto/response/get-districts-response.dto';

@Injectable()
export class DistrictService implements OnModuleInit {
    private isSeeded = false;

    constructor(@InjectModel(District.name) private readonly districtModel: Model<District>) {}

    /**
     * 모듈 초기화 시 자동으로 시드 데이터 삽입
     */
    async onModuleInit() {
        await this.ensureSeeded();
    }

    /**
     * 필요시에만 시드 데이터 삽입 (Lazy Loading)
     */
    private async ensureSeeded() {
        if (this.isSeeded) return;

        try {
            const count = await this.districtModel.countDocuments().maxTimeMS(3000);

            if (count === 0) {
                console.log('[DistrictService] 지역 데이터 삽입 시작');
                await this.districtModel.insertMany(KOREA_DISTRICTS);
                console.log(`[DistrictService] ${KOREA_DISTRICTS.length}개 지역 데이터 삽입 완료`);
            } else {
                console.log(`[DistrictService] 기존 ${count}개 지역 데이터 확인`);
            }

            this.isSeeded = true;
        } catch (error) {
            console.error('[DistrictService] 시드 데이터 확인 실패:', error);
            // 에러가 발생해도 서비스는 계속 작동
        }
    }

    /**
     * 모든 지역 데이터 조회 (city와 districts 전체 반환)
     */
    async getAllDistricts(): Promise<GetDistrictsResponseDto[]> {
        await this.ensureSeeded();
        const districts = await this.districtModel.find().exec();
        return districts.map((d) => ({
            city: d.city,
            districts: d.districts,
        }));
    }
}
