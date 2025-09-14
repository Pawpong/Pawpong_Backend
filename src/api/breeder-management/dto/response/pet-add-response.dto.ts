import { ApiProperty } from '@nestjs/swagger';

/**
 * 반려동물 추가 응답 DTO
 * 브리더가 반려동물을 성공적으로 등록했을 때 반환되는 데이터 구조입니다.
 */
export class PetAddResponseDto {
    /**
     * 등록된 반려동물 고유 ID
     * @example "507f1f77bcf86cd799439088"
     */
    @ApiProperty({
        description: '등록된 반려동물 고유 ID',
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
     * 반려동물 종류
     * @example "dog"
     */
    @ApiProperty({
        description: '반려동물 종류',
        example: 'dog',
        enum: ['dog', 'cat'],
    })
    petType: string;

    /**
     * 반려동물 등록 완료 메시지
     * @example "반려동물이 성공적으로 등록되었습니다."
     */
    @ApiProperty({
        description: '반려동물 등록 완료 메시지',
        example: '반려동물이 성공적으로 등록되었습니다.',
    })
    registrationMessage: string;

    /**
     * 등록 일시
     * @example "2024-01-15T10:30:00.000Z"
     */
    @ApiProperty({
        description: '등록 일시',
        example: '2024-01-15T10:30:00.000Z',
        format: 'date-time',
    })
    registeredAt: string;
}
