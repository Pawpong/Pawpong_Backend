import { ApiProperty } from '@nestjs/swagger';

/**
 * 부모견/부모묘 응답 DTO
 */
export class ParentPetItemDto {
    @ApiProperty({
        description: '부모견/부모묘 ID',
        example: '507f1f77bcf86cd799439011',
    })
    petId: string;

    @ApiProperty({
        description: '이름',
        example: '엄마초코',
    })
    name: string;

    @ApiProperty({
        description: '품종',
        example: '포메라니안',
    })
    breed: string;

    @ApiProperty({
        description: '성별',
        example: 'female',
        enum: ['male', 'female'],
    })
    gender: string;

    @ApiProperty({
        description: '생년월일',
        example: '2020-05-15',
    })
    birthDate: string;

    @ApiProperty({
        description: '사진 URL (Signed URL, 1시간 유효)',
        example: 'https://storage.googleapis.com/pawpong/parents/uuid.jpg?...',
    })
    photoUrl: string;

    @ApiProperty({
        description: '건강 기록',
        example: ['정기 건강검진 완료 (2024-12-01)', '유전질환 없음'],
        type: [String],
        required: false,
    })
    healthRecords?: string[];

    @ApiProperty({
        description: '소개',
        example: '건강하고 온순한 성격의 엄마 포메라니안입니다',
        required: false,
    })
    description?: string;
}

/**
 * 부모견/부모묘 목록 응답 DTO
 */
export class ParentPetsResponseDto {
    @ApiProperty({
        description: '부모견/부모묘 목록',
        type: [ParentPetItemDto],
    })
    items: ParentPetItemDto[];
}
