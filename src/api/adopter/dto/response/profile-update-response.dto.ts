import { ApiProperty } from '@nestjs/swagger';

/**
 * 입양자 프로필 수정 응답 DTO
 * 프로필이 성공적으로 수정되었을 때 반환되는 데이터 구조입니다.
 */
export class AdopterProfileUpdateResponseDto {
    /**
     * 입양자 사용자 ID
     * @example "507f1f77bcf86cd799439099"
     */
    @ApiProperty({
        description: '입양자 사용자 ID',
        example: '507f1f77bcf86cd799439099',
    })
    userId: string;

    /**
     * 수정된 이름
     * @example "홍길동"
     */
    @ApiProperty({
        description: '수정된 이름',
        example: '홍길동',
        required: false,
    })
    name?: string;

    /**
     * 수정된 전화번호
     * @example "010-1234-5678"
     */
    @ApiProperty({
        description: '수정된 전화번호',
        example: '010-1234-5678',
        required: false,
    })
    phone?: string;

    /**
     * 수정된 프로필 이미지 URL
     * @example "https://storage.googleapis.com/pawpong/profiles/user123.jpg"
     */
    @ApiProperty({
        description: '수정된 프로필 이미지 URL',
        example: 'https://storage.googleapis.com/pawpong/profiles/user123.jpg',
        required: false,
    })
    profileImage?: string;

    /**
     * 프로필 수정 일시
     * @example "2024-01-15T10:30:00.000Z"
     */
    @ApiProperty({
        description: '프로필 수정 일시',
        example: '2024-01-15T10:30:00.000Z',
        format: 'date-time',
    })
    updatedAt: string;

    /**
     * 수정 완료 메시지
     * @example "프로필이 성공적으로 수정되었습니다."
     */
    @ApiProperty({
        description: '수정 완료 메시지',
        example: '프로필이 성공적으로 수정되었습니다.',
    })
    message: string;
}
