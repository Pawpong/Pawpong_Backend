import { ApiProperty } from '@nestjs/swagger';

/**
 * 부모견/부모묘 아이템 DTO
 *
 * GET /api/breeder/:id/parent-pets
 * 부모견/부모묘 목록의 개별 아이템 정보를 담는 DTO입니다.
 */
export class ParentPetItemDto {
    /**
     * 반려동물 고유 ID
     * @example "507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '반려동물 고유 ID',
        example: '507f1f77bcf86cd799439011',
    })
    petId: string;

    /**
     * 반려동물 이름
     * @example "초코"
     */
    @ApiProperty({
        description: '반려동물 이름',
        example: '초코',
    })
    name: string;

    /**
     * 품종
     * @example "골든 리트리버"
     */
    @ApiProperty({
        description: '품종',
        example: '골든 리트리버',
    })
    breed: string;

    /**
     * 성별
     * @example "male"
     */
    @ApiProperty({
        description: '성별 (male: 수컷, female: 암컷)',
        example: 'male',
    })
    gender: string;

    /**
     * 생년월일
     * @example "2020-01-15T00:00:00.000Z"
     */
    @ApiProperty({
        description: '생년월일 (ISO 8601 형식)',
        example: '2020-01-15T00:00:00.000Z',
    })
    birthDate: Date;

    /**
     * 사진 파일명
     * @example "parent-pet-photo-123.jpg"
     */
    @ApiProperty({
        description: '사진 파일명',
        example: 'parent-pet-photo-123.jpg',
    })
    photoUrl: string;

    /**
     * 건강 기록
     * @example ["2024-01-01: 건강검진 완료", "2024-06-01: 예방접종 완료"]
     */
    @ApiProperty({
        description: '건강 기록 배열',
        example: ['2024-01-01: 건강검진 완료', '2024-06-01: 예방접종 완료'],
        type: [String],
    })
    healthRecords: string[];

    /**
     * 설명
     * @example "온순하고 건강한 부모견입니다."
     */
    @ApiProperty({
        description: '설명',
        example: '온순하고 건강한 부모견입니다.',
    })
    description: string;
}

/**
 * 부모견/부모묘 목록 조회 응답 DTO
 *
 * GET /api/breeder/:id/parent-pets
 */
export class ParentPetListResponseDto {
    /**
     * 부모견/부모묘 목록
     */
    @ApiProperty({
        description: '부모견/부모묘 목록',
        type: [ParentPetItemDto],
    })
    items: ParentPetItemDto[];
}
