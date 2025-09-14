import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 즐겨찾기 추가 요청 DTO
 * 입양자가 브리더를 즐겨찾기에 추가할 때 사용됩니다.
 */
export class FavoriteAddRequestDto {
    /**
     * 즐겨찾기에 추가할 브리더 ID
     * @example "507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '즐겨찾기에 추가할 브리더 ID',
        example: '507f1f77bcf86cd799439011',
    })
    @IsString()
    @IsNotEmpty()
    breederId: string;
}
