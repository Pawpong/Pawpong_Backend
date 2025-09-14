import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PetStatus } from '../../../../common/enum/user.enum';

/**
 * 반려동물 상태 업데이트 요청 DTO
 * 브리더가 등록한 반려동물의 상태를 변경할 때 사용됩니다.
 */
export class PetStatusUpdateRequestDto {
    /**
     * 반려동물 상태
     * @example "available"
     */
    @ApiProperty({
        description: '반려동물 상태',
        example: 'available',
        enum: PetStatus,
    })
    @IsEnum(PetStatus)
    petStatus: PetStatus;
}
