import { Injectable, Logger } from '@nestjs/common';
import { AvailablePetRepository } from './repository/available-pet.repository';
import { StorageService } from '../../common/storage/storage.service';
import { AvailablePetResponseDto } from './dto/response/available-pet-response.dto';
import { AvailablePetDocument } from '../../schema/available-pet.schema';

/**
 * Home Service
 * 홈 화면 관련 비즈니스 로직
 */
@Injectable()
export class HomeService {
    private readonly logger = new Logger(HomeService.name);

    constructor(
        private readonly availablePetRepository: AvailablePetRepository,
        private readonly storageService: StorageService,
    ) {}

    /**
     * 분양중인 아이들 조회 (최신 등록순)
     * @param limit 조회할 개수 (default: 10)
     * @returns AvailablePetResponseDto 배열
     */
    async getAvailablePets(limit: number = 10): Promise<AvailablePetResponseDto[]> {
        this.logger.log(`[getAvailablePets] 분양중인 아이들 조회 시작: limit=${limit}`);

        // 1. DB에서 입양 가능한 반려동물 조회
        const pets = await this.availablePetRepository.findAvailablePets(limit);

        this.logger.log(`[getAvailablePets] ${pets.length}개의 반려동물 조회 완료`);

        // 2. DTO로 변환 (Signed URL 동적 생성)
        const petDtos = pets.map((pet) => this.mapPetToDto(pet));

        this.logger.log(`[getAvailablePets] DTO 변환 완료`);

        return petDtos;
    }

    /**
     * AvailablePet Document를 AvailablePetResponseDto로 변환
     * @param pet AvailablePet Document
     * @returns AvailablePetResponseDto
     */
    private mapPetToDto(pet: AvailablePetDocument): AvailablePetResponseDto {
        // 대표 사진 (photos 배열의 첫 번째) - 동적으로 Signed URL 생성 (1시간 유효)
        const photoFileName = pet.photos && pet.photos.length > 0 ? pet.photos[0] : '';
        const photoUrl = photoFileName ? this.storageService.generateSignedUrl(photoFileName, 60) : '';

        return {
            petId: pet._id.toString(),
            name: pet.name,
            breed: pet.breed,
            gender: pet.gender,
            birthDate: pet.birthDate.toISOString().split('T')[0], // "2024-12-01" 형식
            photoUrl, // Signed URL (대표 사진)
            breeder: {
                breederId: (pet.breederId as any)._id?.toString() || pet.breederId.toString(),
                breederName: (pet.breederId as any).name || '알 수 없음',
            },
            status: pet.status,
            createdAt: (pet as any).createdAt?.toISOString() || new Date().toISOString(),
        };
    }
}
