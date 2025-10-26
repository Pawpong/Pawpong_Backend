import { ApiProperty } from '@nestjs/swagger';

export class DistrictResponseDto {
    @ApiProperty({
        description: '지역 ID',
        example: '507f1f77bcf86cd799439011',
    })
    id: string;

    @ApiProperty({
        description: '도/특별시/광역시',
        example: '경기도',
    })
    city: string;

    @ApiProperty({
        description: '시/군 목록',
        type: [String],
        example: ['수원시', '성남시', '고양시'],
    })
    districts: string[];

    @ApiProperty({
        description: '생성일',
        example: '2024-01-01T00:00:00.000Z',
    })
    createdAt: Date;

    @ApiProperty({
        description: '수정일',
        example: '2024-01-01T00:00:00.000Z',
    })
    updatedAt: Date;
}
