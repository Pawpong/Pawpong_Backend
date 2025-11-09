import { ApiProperty } from '@nestjs/swagger';

/**
 * 사용자 상태 변경 응답 DTO
 * 사용자 계정 상태 변경 결과를 반환합니다.
 */
export class UserStatusUpdateResponseDto {
    /**
     * 사용자 ID
     * @example "507f1f77bcf86cd799439099"
     */
    @ApiProperty({
        description: '사용자 ID',
        example: '507f1f77bcf86cd799439099',
    })
    userId: string;

    /**
     * 사용자 역할
     * @example "adopter"
     */
    @ApiProperty({
        description: '사용자 역할',
        example: 'adopter',
        enum: ['adopter', 'breeder'],
    })
    role: string;

    /**
     * 이전 상태
     * @example "active"
     */
    @ApiProperty({
        description: '이전 상태',
        example: 'active',
        enum: ['active', 'inactive', 'suspended', 'banned'],
    })
    previousStatus: string;

    /**
     * 새로운 상태
     * @example "suspended"
     */
    @ApiProperty({
        description: '새로운 상태',
        example: 'suspended',
        enum: ['active', 'inactive', 'suspended', 'banned'],
    })
    newStatus: string;

    /**
     * 변경 사유
     * @example "규정 위반으로 인한 정지"
     */
    @ApiProperty({
        description: '변경 사유',
        example: '규정 위반으로 인한 정지',
        required: false,
    })
    reason?: string;

    /**
     * 변경 일시
     * @example "2024-01-15T10:30:00.000Z"
     */
    @ApiProperty({
        description: '변경 일시',
        example: '2024-01-15T10:30:00.000Z',
        format: 'date-time',
    })
    updatedAt: string;

    /**
     * 정지 해제 예정일 (정지인 경우)
     * @example "2024-01-22T10:30:00.000Z"
     */
    @ApiProperty({
        description: '정지 해제 예정일 (정지인 경우)',
        example: '2024-01-22T10:30:00.000Z',
        format: 'date-time',
        required: false,
    })
    suspensionUntil?: string;

    /**
     * 처리 완료 메시지
     * @example "사용자 계정이 정지되었습니다."
     */
    @ApiProperty({
        description: '처리 완료 메시지',
        example: '사용자 계정이 정지되었습니다.',
    })
    message: string;
}
