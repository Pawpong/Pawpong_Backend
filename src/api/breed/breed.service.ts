import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Breed } from '../../schema/breed.schema';
import { KOREA_BREEDS } from '../../common/data/breeds.data';
import { GetBreedsResponseDto, BreedCategoryDto } from './dto/response/get-breeds-response.dto';

@Injectable()
export class BreedService implements OnModuleInit {
    constructor(
        @InjectModel(Breed.name) private readonly breedModel: Model<Breed>,
    ) {}

    /**
     * 모듈 초기화 시 시드 데이터 삽입
     */
    async onModuleInit() {
        await this.seedBreeds();
    }

    /**
     * 시드 데이터 삽입
     */
    private async seedBreeds() {
        try {
            const count = await this.breedModel.countDocuments();

            if (count === 0) {
                console.log('[BreedService] 품종 데이터 삽입 시작');
                await this.breedModel.insertMany(KOREA_BREEDS);
                console.log(`[BreedService] ${KOREA_BREEDS.length}개 품종 카테고리 데이터 삽입 완료`);
            }
        } catch (error) {
            console.error('[BreedService] 품종 데이터 삽입 실패:', error);
        }
    }

    /**
     * 특정 동물의 품종 목록 조회
     */
    async getBreeds(petType: string): Promise<GetBreedsResponseDto> {
        const results = await this.breedModel.find({ petType }).exec();

        const categories: BreedCategoryDto[] = results.map(r => ({
            category: r.category,
            categoryDescription: r.categoryDescription,
            breeds: r.breeds,
        }));

        const response = new GetBreedsResponseDto(petType, categories);
        return response;
    }
}
