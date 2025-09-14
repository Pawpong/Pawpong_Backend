import { ApiProperty } from '@nestjs/swagger';

/**
 * 반려동물 수정 응답 DTO
 * 브리더가 등록된 반려동물 정보를 수정했을 때 반환되는 데이터 구조입니다.
 */
export class PetUpdateResponseDto {
    /**
     * 수정된 반려동물 고유 ID
     * @example "507f1f77bcf86cd799439088"
     */
    @ApiProperty({
        description: '수정된 반려동물 고유 ID',
        example: '507f1f77bcf86cd799439088',
    })
    petId: string;

    /**
     * 반려동물 이름
     * @example "골든베이비"
     */
    @ApiProperty({
        description: '반려동물 이름',
        example: '골든베이비',
    })
    petName: string;

    /**
     * 반려동물 정보 수정 완료 메시지
     * @example "반려동물 정보가 성공적으로 수정되었습니다."
     */
    @ApiProperty({
        description: '반려동물 정보 수정 완료 메시지',
        example: '반려동물 정보가 성공적으로 수정되었습니다.',
    })
    updateMessage: string;

    /**
     * 수정된 필드 수
     * @example 2
     */
    @ApiProperty({
        description: '수정된 필드 수',
        example: 2,
    })
    updatedFieldCount: number;

    /**
     * 마지막 수정 일시
     * @example "2024-01-15T14:30:00.000Z"
     */
    @ApiProperty({
        description: '마지막 수정 일시',
        example: '2024-01-15T14:30:00.000Z',
        format: 'date-time',
    })
    lastUpdatedAt: string;
}
