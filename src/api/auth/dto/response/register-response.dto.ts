import { ApiProperty } from '@nestjs/swagger';

/**
 * 새 사용자 정보 DTO
 */
export class NewUserInfoDto {
    /**
     * 사용자 고유 ID
     * @example "507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '사용자 고유 ID',
        example: '507f1f77bcf86cd799439011'
    })
    userId: string;

    /**
     * 사용자 이메일 주소
     * @example "newuser@example.com"
     */
    @ApiProperty({
        description: '사용자 이메일 주소',
        example: 'newuser@example.com'
    })
    emailAddress: string;

    /**
     * 사용자 이름
     * @example "신규사용자"
     */
    @ApiProperty({
        description: '사용자 이름',
        example: '신규사용자'
    })
    fullName: string;

    /**
     * 사용자 역할 (adopter, breeder)
     * @example "adopter"
     */
    @ApiProperty({
        description: '사용자 역할',
        example: 'adopter',
        enum: ['adopter', 'breeder']
    })
    userRole: string;

    /**
     * 계정 상태
     * 브리더의 경우 pending (인증 대기), 입양자의 경우 active
     * @example "pending"
     */
    @ApiProperty({
        description: '계정 상태',
        example: 'pending',
        enum: ['active', 'pending']
    })
    accountStatus: string;

    /**
     * 계정 생성 일시
     * @example "2024-01-15T10:30:00.000Z"
     */
    @ApiProperty({
        description: '계정 생성 일시',
        example: '2024-01-15T10:30:00.000Z',
        format: 'date-time'
    })
    createdAt: string;
}

/**
 * 회원가입 성공 응답 DTO
 * 성공적인 회원가입 시 반환되는 데이터 구조입니다.
 */
export class RegisterResponseDto {
    /**
     * JWT 액세스 토큰
     * 회원가입 후 자동 로그인 처리를 위한 토큰입니다.
     * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     */
    @ApiProperty({
        description: 'JWT 액세스 토큰',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    })
    accessToken: string;

    /**
     * 생성된 사용자 정보
     */
    @ApiProperty({
        description: '생성된 사용자 정보',
        type: NewUserInfoDto
    })
    userInfo: NewUserInfoDto;

    /**
     * 회원가입 완료 메시지
     * @example "회원가입이 완료되었습니다. 브리더 인증을 진행해주세요."
     */
    @ApiProperty({
        description: '회원가입 완료 메시지',
        example: '회원가입이 완료되었습니다. 브리더 인증을 진행해주세요.'
    })
    welcomeMessage: string;
}