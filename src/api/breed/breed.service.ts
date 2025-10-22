import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { KOREA_BREEDS } from '../../common/data/breeds.data';

import { Breed } from '../../schema/breed.schema';

import { GetBreedsResponseDto, BreedCategoryDto } from './dto/response/get-breeds-response.dto';

@Injectable()
export class BreedService {
    private isSeeded = false;

    constructor(@InjectModel(Breed.name) private readonly breedModel: Model<Breed>) {}

    /**
     * 필요시에만 시드 데이터 삽입 (Lazy Loading)
     */
    private async ensureSeeded() {
        if (this.isSeeded) return;

        try {
            const count = await this.breedModel.countDocuments().maxTimeMS(3000);
            if (count === 0) {
                console.log('[BreedService] 품종 데이터 삽입 시작');
                await this.breedModel.insertMany(KOREA_BREEDS);
                console.log(`[BreedService] ${KOREA_BREEDS.length}개 품종 카테고리 데이터 삽입 완료`);
            }
            this.isSeeded = true;
        } catch (error) {
            console.error('[BreedService] 시드 데이터 확인 실패:', error);
            // 에러가 발생해도 서비스는 계속 작동
        }
    }

    /**
     * 특정 동물의 품종 목록 조회
     */
    async getBreeds(petType: string): Promise<GetBreedsResponseDto> {
        await this.ensureSeeded();
        const results = await this.breedModel.find({ petType }).exec();

        const categories: BreedCategoryDto[] = results.map((r) => ({
            category: r.category,
            categoryDescription: r.categoryDescription,
            breeds: r.breeds,
        }));

        const response = new GetBreedsResponseDto(petType, categories);
        return response;
    }
}
