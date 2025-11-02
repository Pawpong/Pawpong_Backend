import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 입양자 후기 작성 요청 DTO (재설계)
 *
 * 변경사항:
 * - applicationId 제거 (권한 확인 불필요)
 * - adopterId는 JWT 토큰에서 자동 추출
 * - 필수 필드: breederId, reviewType, content
 */
export class ReviewCreateRequestDto {
    /**
     * 후기를 작성할 브리더 ID
     * @example "507f1f77bcf86cd799439012"
     */
    @ApiProperty({
        description: '후기를 작성할 브리더 ID',
        example: '507f1f77bcf86cd799439012',
    })
    @IsString()
    @IsNotEmpty()
    breederId: string;

    /**
     * 후기 유형
     * - consultation: 상담후기
     * - adoption: 입양완료후기
     * @example "adoption"
     */
    @ApiProperty({
        description: '후기 유형',
        example: 'adoption',
        enum: ['consultation', 'adoption'],
    })
    @IsString()
    @IsNotEmpty()
    reviewType: string;

    /**
     * 후기 내용
     * @example "정말 좋은 브리더입니다. 반려동물이 건강하고 성격도 좋아요."
     */
    @ApiProperty({
        description: '후기 내용',
        example: '정말 좋은 브리더입니다. 반려동물이 건강하고 성격도 좋아요.',
    })
    @IsString()
    @IsNotEmpty()
    content: string;
}
