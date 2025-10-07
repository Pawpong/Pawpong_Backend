import { ApiProperty } from '@nestjs/swagger';

export class GetDistrictsResponseDto {
    @ApiProperty({
        description: '시/도 이름',
        example: '서울특별시',
    })
    city: string;

    @ApiProperty({
        description: '시/군/구 목록',
        type: [String],
        example: ['강남구', '강동구', '강북구'],
    })
    districts: string[];

    constructor(city: string, districts: string[]) {
        this.city = city;
        this.districts = districts;
    }
}
