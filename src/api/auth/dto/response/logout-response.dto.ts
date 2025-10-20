import { ApiProperty } from '@nestjs/swagger';

/**
 * 로그아웃 응답 DTO
 * 로그아웃이 성공적으로 처리되었을 때 반환되는 데이터 구조입니다.
 */
export class LogoutResponseDto {
    /**
     * 로그아웃 성공 여부
     * @example true
     */
    @ApiProperty({
        description: '로그아웃 성공 여부',
        example: true,
    })
    success: boolean;

    /**
     * 로그아웃 처리 일시
     * @example "2024-01-15T10:30:00.000Z"
     */
    @ApiProperty({
        description: '로그아웃 처리 일시',
        example: '2024-01-15T10:30:00.000Z',
        format: 'date-time',
    })
    loggedOutAt: string;

    /**
     * 로그아웃 완료 메시지
     * @example "로그아웃되었습니다."
     */
    @ApiProperty({
        description: '로그아웃 완료 메시지',
        example: '로그아웃되었습니다.',
    })
    message: string;
}
