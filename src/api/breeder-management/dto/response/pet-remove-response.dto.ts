import { ApiProperty } from '@nestjs/swagger';

/**
 * 반려동물 삭제 응답 DTO
 * 브리더가 등록된 반려동물을 삭제했을 때 반환되는 데이터 구조입니다.
 */
export class PetRemoveResponseDto {
    /**
     * 삭제된 반려동물 고유 ID
     * @example "507f1f77bcf86cd799439088"
     */
    @ApiProperty({
        description: '삭제된 반려동물 고유 ID',
        example: '507f1f77bcf86cd799439088',
    })
    petId: string;

    /**
     * 삭제된 반려동물 이름
     * @example "골든베이비"
     */
    @ApiProperty({
        description: '삭제된 반려동물 이름',
        example: '골든베이비',
    })
    petName: string;

    /**
     * 반려동물 삭제 완료 메시지
     * @example "반려동물이 성공적으로 삭제되었습니다."
     */
    @ApiProperty({
        description: '반려동물 삭제 완료 메시지',
        example: '반려동물이 성공적으로 삭제되었습니다.',
    })
    deletionMessage: string;

    /**
     * 삭제 일시
     * @example "2024-01-15T16:45:00.000Z"
     */
    @ApiProperty({
        description: '삭제 일시',
        example: '2024-01-15T16:45:00.000Z',
        format: 'date-time',
    })
    deletedAt: string;
}
