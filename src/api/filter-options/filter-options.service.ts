import { Injectable } from '@nestjs/common';
import {
    AllFilterOptionsResponseDto,
    BreederLevelOptionDto,
    SortOptionDto,
    DogSizeOptionDto,
    CatFurLengthOptionDto,
    AdoptionStatusOptionDto,
} from './dto/response/filter-options-response.dto';

/**
 * 필터 옵션 서비스
 * 브리더 검색에 사용되는 필터 옵션 데이터를 제공합니다.
 */
@Injectable()
export class FilterOptionsService {
    /**
     * 전체 필터 옵션 조회
     */
    async getAllFilterOptions(): Promise<AllFilterOptionsResponseDto> {
        return {
            breederLevels: await this.getBreederLevels(),
            sortOptions: await this.getSortOptions(),
            dogSizes: await this.getDogSizes(),
            catFurLengths: await this.getCatFurLengths(),
            adoptionStatus: await this.getAdoptionStatus(),
        };
    }

    /**
     * 브리더 레벨 옵션 조회
     */
    async getBreederLevels(): Promise<BreederLevelOptionDto[]> {
        return [
            {
                value: 'elite',
                label: '엘리트',
                description: '인증된 전문 브리더',
            },
            {
                value: 'new',
                label: '뉴',
                description: '신규 브리더',
            },
        ];
    }

    /**
     * 정렬 옵션 조회
     */
    async getSortOptions(): Promise<SortOptionDto[]> {
        return [
            {
                value: 'latest',
                label: '최신순',
                description: '최근 등록된 브리더순',
            },
            {
                value: 'favorite',
                label: '찜 많은순',
                description: '찜이 많은 브리더순',
            },
            {
                value: 'review',
                label: '후기 많은순',
                description: '후기가 많은 브리더순',
            },
            {
                value: 'price_asc',
                label: '가격 낮은순',
                description: '분양가가 낮은 브리더순',
            },
            {
                value: 'price_desc',
                label: '가격 높은순',
                description: '분양가가 높은 브리더순',
            },
        ];
    }

    /**
     * 강아지 크기 옵션 조회
     */
    async getDogSizes(): Promise<DogSizeOptionDto[]> {
        return [
            {
                value: 'small',
                label: '소형견',
                description: '10kg 미만',
            },
            {
                value: 'medium',
                label: '중형견',
                description: '10kg ~ 25kg',
            },
            {
                value: 'large',
                label: '대형견',
                description: '25kg 이상',
            },
        ];
    }

    /**
     * 고양이 털 길이 옵션 조회
     */
    async getCatFurLengths(): Promise<CatFurLengthOptionDto[]> {
        return [
            {
                value: 'short',
                label: '단모',
                description: '짧은 털',
            },
            {
                value: 'long',
                label: '장모',
                description: '긴 털',
            },
        ];
    }

    /**
     * 입양 가능 여부 옵션 조회
     */
    async getAdoptionStatus(): Promise<AdoptionStatusOptionDto[]> {
        return [
            {
                value: true,
                label: '입양 가능',
                description: '현재 입양 가능한 반려동물이 있는 브리더',
            },
        ];
    }
}
