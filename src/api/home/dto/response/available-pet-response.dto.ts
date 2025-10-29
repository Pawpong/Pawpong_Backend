import { ApiProperty } from '@nestjs/swagger';

/**
 * 분양 가능 반려동물 응답 DTO
 */
export class AvailablePetResponseDto {
    @ApiProperty({
        description: '반려동물 ID',
        example: '507f1f77bcf86cd799439011',
    })
    petId: string;

    @ApiProperty({
        description: '이름',
        example: '초코',
    })
    name: string;

    @ApiProperty({
        description: '품종',
        example: '포메라니안',
    })
    breed: string;

    @ApiProperty({
        description: '성별',
        example: 'male',
        enum: ['male', 'female'],
    })
    gender: string;

    @ApiProperty({
        description: '생년월일',
        example: '2024-12-01',
    })
    birthDate: string;

    @ApiProperty({
        description: '사진 URL (Signed URL, 대표 사진)',
        example: 'https://cdn.pawpong.kr/pets/uuid.jpg?Expires=...',
    })
    photoUrl: string;

    @ApiProperty({
        description: '브리더 정보',
        type: 'object',
        properties: {
            breederId: { type: 'string', example: '507f1f77bcf86cd799439012' },
            breederName: { type: 'string', example: '행복 브리더' },
        },
    })
    breeder: {
        breederId: string;
        breederName: string;
    };

    @ApiProperty({
        description: '분양 상태',
        example: 'available',
        enum: ['available', 'reserved', 'adopted'],
    })
    status: string;

    @ApiProperty({
        description: '등록일',
        example: '2025-01-26T10:30:00.000Z',
    })
    createdAt: string;
}
