import { ApiProperty } from '@nestjs/swagger';

export class TokenResponseDto {
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

    /**
     * 액세스 토큰 만료 시간 (초)
     * @example 3600
     */
    @ApiProperty({
        description: '액세스 토큰 만료 시간 (초)',
        example: 3600,
    })
    accessTokenExpiresIn: number;

    /**
     * 리프레시 토큰 만료 시간 (초)
     * @example 604800
     */
    @ApiProperty({
        description: '리프레시 토큰 만료 시간 (초)',
        example: 604800,
    })
    refreshTokenExpiresIn: number;
}