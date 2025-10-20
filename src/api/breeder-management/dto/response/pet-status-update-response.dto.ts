import { ApiProperty } from '@nestjs/swagger';

/**
 * 반려동물 상태 변경 응답 DTO
 * 분양 반려동물의 상태가 성공적으로 변경되었을 때 반환되는 데이터 구조입니다.
 */
export class PetStatusUpdateResponseDto {
    /**
     * 반려동물 ID
     * @example "507f1f77bcf86cd799439022"
     */
    @ApiProperty({
        description: '반려동물 ID',
        example: '507f1f77bcf86cd799439022',
    })
    petId: string;

    /**
     * 반려동물 이름
     * @example "해피"
     */
    @ApiProperty({
        description: '반려동물 이름',
        example: '해피',
    })
    petName: string;

    /**
     * 이전 상태
     * @example "available"
     */
    @ApiProperty({
        description: '이전 상태',
        example: 'available',
        enum: ['available', 'reserved', 'adopted', 'unavailable'],
    })
    previousStatus: string;

    /**
     * 새로운 상태
     * @example "reserved"
     */
    @ApiProperty({
        description: '새로운 상태',
        example: 'reserved',
        enum: ['available', 'reserved', 'adopted', 'unavailable'],
    })
    newStatus: string;

    /**
     * 상태 변경 일시
     * @example "2024-01-15T10:30:00.000Z"
     */
    @ApiProperty({
        description: '상태 변경 일시',
        example: '2024-01-15T10:30:00.000Z',
        format: 'date-time',
    })
    updatedAt: string;

    /**
     * 상태 변경 완료 메시지
     * @example "반려동물 상태가 예약됨으로 변경되었습니다."
     */
    @ApiProperty({
        description: '상태 변경 완료 메시지',
        example: '반려동물 상태가 예약됨으로 변경되었습니다.',
    })
    message: string;
}
