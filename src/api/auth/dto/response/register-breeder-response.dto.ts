import { ApiProperty } from '@nestjs/swagger';

/**
 * 브리더 회원가입 응답 DTO
 */
export class RegisterBreederResponseDto {
  /**
   * 생성된 브리더 고유 ID
   * @example "507f1f77bcf86cd799439011"
   */
  @ApiProperty({
    description: '생성된 브리더 고유 ID',
    example: '507f1f77bcf86cd799439011',
  })
  breederId: string;

  /**
   * 이메일 주소
   * @example "breeder@example.com"
   */
  @ApiProperty({
    description: '이메일 주소',
    example: 'breeder@example.com',
  })
  email: string;

  /**
   * 브리더명 (상호명)
   * @example "포포 캐터리"
   */
  @ApiProperty({
    description: '브리더명 (상호명)',
    example: '포포 캐터리',
  })
  breederName: string;

  /**
   * 브리더 활동 지역
   * @example "서울특별시 강남구"
   */
  @ApiProperty({
    description: '브리더 활동 지역',
    example: '서울특별시 강남구',
  })
  breederLocation: string;

  /**
   * 브리딩 동물 종류
   * @example "cat"
   */
  @ApiProperty({
    description: '브리딩 동물 종류',
    enum: ['cat', 'dog'],
    example: 'cat',
  })
  animal: string;

  /**
   * 브리딩 품종 목록
   * @example ["페르시안", "샴", "러시안블루"]
   */
  @ApiProperty({
    description: '브리딩 품종 목록',
    example: ['페르시안', '샴', '러시안블루'],
    type: [String],
  })
  breeds: string[];

  /**
   * 플랜 유형
   * @example "basic"
   */
  @ApiProperty({
    description: '플랜 유형',
    enum: ['basic', 'pro'],
    example: 'basic',
  })
  plan: string;

  /**
   * 브리더 레벨
   * @example "new"
   */
  @ApiProperty({
    description: '브리더 레벨',
    enum: ['elite', 'new'],
    example: 'new',
  })
  level: string;

  /**
   * 인증 상태
   * @example "pending"
   */
  @ApiProperty({
    description: '인증 상태',
    enum: ['pending', 'approved', 'rejected'],
    example: 'pending',
  })
  verificationStatus: string;

  /**
   * 생성일시
   * @example "2025-01-15T10:30:00.000Z"
   */
  @ApiProperty({
    description: '생성일시',
    example: '2025-01-15T10:30:00.000Z',
  })
  createdAt: string;

  /**
   * JWT 액세스 토큰
   * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   */
  @ApiProperty({
    description: 'JWT 액세스 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  /**
   * JWT 리프레시 토큰
   * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   */
  @ApiProperty({
    description: 'JWT 리프레시 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
}
