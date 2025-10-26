import { ApiProperty } from '@nestjs/swagger';

/**
 * 브리더 프로필 수정 응답 DTO
 * 브리더가 프로필을 성공적으로 수정했을 때 반환되는 데이터 구조입니다.
 */
export class BreederProfileUpdateResponseDto {
    /**
     * 브리더 고유 ID
     * @example "507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '브리더 고유 ID',
        example: '507f1f77bcf86cd799439011',
    })
    breederId: string;

    /**
     * 프로필 수정 완료 메시지
     * @example "프로필이 성공적으로 업데이트되었습니다."
     */
    @ApiProperty({
        description: '프로필 수정 완료 메시지',
        example: '프로필이 성공적으로 업데이트되었습니다.',
    })
    updateMessage: string;

    /**
     * 수정된 항목 수
     * @example 3
     */
    @ApiProperty({
        description: '수정된 항목 수',
        example: 3,
    })
    updatedFieldCount: number;

    /**
     * 마지막 업데이트 일시
     * @example "2024-01-15T14:30:00.000Z"
     */
    @ApiProperty({
        description: '마지막 업데이트 일시',
        example: '2024-01-15T14:30:00.000Z',
        format: 'date-time',
    })
    lastUpdatedAt: string;
}
