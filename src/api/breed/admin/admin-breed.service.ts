import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Breed } from '../../../schema/breed.schema';

import { CreateBreedRequestDto } from './dto/request/create-breed-request.dto';
import { UpdateBreedRequestDto } from './dto/request/update-breed-request.dto';
import { BreedResponseDto } from '../dto/response/breed-response.dto';

@Injectable()
export class AdminBreedService {
    constructor(@InjectModel(Breed.name) private readonly breedModel: Model<Breed>) {}

    /**
     * 품종 카테고리 생성
     */
    async createBreed(dto: CreateBreedRequestDto): Promise<BreedResponseDto> {
        // 동일한 petType과 category를 가진 데이터가 이미 존재하는지 확인
        const existing = await this.breedModel.findOne({
            petType: dto.petType,
            category: dto.category,
        });

        if (existing) {
            throw new ConflictException(`이미 ${dto.petType}의 ${dto.category} 카테고리가 존재합니다.`);
        }

        const breed = new this.breedModel(dto);
        const saved = await breed.save();

        return this.toResponseDto(saved);
    }

    /**
     * 모든 품종 카테고리 조회
     */
    async getAllBreeds(): Promise<BreedResponseDto[]> {
        const breeds = await this.breedModel.find().sort({ petType: 1, category: 1 }).exec();
        return breeds.map((breed) => this.toResponseDto(breed));
    }

    /**
     * 특정 품종 카테고리 조회
     */
    async getBreedById(id: string): Promise<BreedResponseDto> {
        const breed = await this.breedModel.findById(id).exec();

        if (!breed) {
            throw new BadRequestException(`ID ${id}에 해당하는 품종 카테고리를 찾을 수 없습니다.`);
        }

        return this.toResponseDto(breed);
    }

    /**
     * 품종 카테고리 수정
     */
    async updateBreed(id: string, dto: UpdateBreedRequestDto): Promise<BreedResponseDto> {
        const breed = await this.breedModel.findById(id).exec();

        if (!breed) {
            throw new BadRequestException(`ID ${id}에 해당하는 품종 카테고리를 찾을 수 없습니다.`);
        }

        // category가 변경되는 경우 중복 체크
        if (dto.category && dto.category !== breed.category) {
            const existing = await this.breedModel.findOne({
                petType: breed.petType,
                category: dto.category,
                _id: { $ne: id },
            });

            if (existing) {
                throw new ConflictException(`이미 ${breed.petType}의 ${dto.category} 카테고리가 존재합니다.`);
            }
        }

        // findByIdAndUpdate로 부분 업데이트 (스키마 검증 우회)
        const updated = await this.breedModel
            .findByIdAndUpdate(id, { $set: dto }, { new: true, runValidators: false })
            .exec();

        return this.toResponseDto(updated);
    }

    /**
     * 품종 카테고리 삭제
     */
    async deleteBreed(id: string): Promise<void> {
        const result = await this.breedModel.findByIdAndDelete(id).exec();

        if (!result) {
            throw new BadRequestException(`ID ${id}에 해당하는 품종 카테고리를 찾을 수 없습니다.`);
        }
    }

    /**
     * Entity를 Response DTO로 변환
     */
    private toResponseDto(breed: any): BreedResponseDto {
        return {
            id: breed._id.toString(),
            petType: breed.petType,
            category: breed.category,
            categoryDescription: breed.categoryDescription,
            breeds: breed.breeds,
            createdAt: breed.createdAt,
            updatedAt: breed.updatedAt,
        };
    }
}
