import { ApiProperty } from '@nestjs/swagger';

/**
 * 파일 삭제 응답 DTO
 * 파일이 성공적으로 삭제되었을 때 반환되는 데이터 구조입니다.
 */
export class FileDeleteResponseDto {
    /**
     * 삭제된 파일명
     * @example "profiles/breeder_123_1234567890.jpg"
     */
    @ApiProperty({
        description: '삭제된 파일명',
        example: 'profiles/breeder_123_1234567890.jpg',
    })
    deletedFileName: string;

    /**
     * 삭제 성공 여부
     * @example true
     */
    @ApiProperty({
        description: '삭제 성공 여부',
        example: true,
    })
    success: boolean;

    /**
     * 삭제 일시
     * @example "2024-01-15T10:30:00.000Z"
     */
    @ApiProperty({
        description: '삭제 일시',
        example: '2024-01-15T10:30:00.000Z',
        format: 'date-time',
    })
    deletedAt: string;

    /**
     * 삭제 완료 메시지
     * @example "파일이 성공적으로 삭제되었습니다."
     */
    @ApiProperty({
        description: '삭제 완료 메시지',
        example: '파일이 성공적으로 삭제되었습니다.',
    })
    message: string;
}
