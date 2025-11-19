import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Breed } from '../../../schema/breed.schema';

import { GetBreedsResponseDto, BreedCategoryDto } from '../dto/response/get-breeds-response.dto';

@Injectable()
export class BreedService {
    constructor(@InjectModel(Breed.name) private readonly breedModel: Model<Breed>) {}

    /**
     * 특정 동물의 품종 목록 조회
     */
    async getBreeds(petType: string): Promise<GetBreedsResponseDto> {
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
