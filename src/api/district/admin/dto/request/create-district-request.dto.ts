import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, ArrayNotEmpty } from 'class-validator';

export class CreateDistrictRequestDto {
    @ApiProperty({
        description: '도/특별시/광역시',
        example: '경기도',
    })
    @IsString()
    city: string;

    @ApiProperty({
        description: '시/군 목록',
        type: [String],
        example: ['수원시', '성남시', '고양시'],
    })
    @IsArray()
    @ArrayNotEmpty({ message: '최소 1개 이상의 시/군이 필요합니다.' })
    @IsString({ each: true })
    districts: string[];
}
