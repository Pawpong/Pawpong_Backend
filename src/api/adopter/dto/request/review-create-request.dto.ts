import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 입양자 후기 작성 요청 DTO
 *
 * 변경사항:
 * - applicationId 필수 (상담 완료된 신청에 대해서만 작성 가능)
 * - adopterId는 JWT 토큰에서 자동 추출
 * - 필수 필드: applicationId, reviewType, content
 */
export class ReviewCreateRequestDto {
    /**
     * 후기를 작성할 입양 신청 ID
     * 상담 완료(consultation_completed) 상태인 신청만 가능
     * @example "507f1f77bcf86cd799439012"
     */
    @ApiProperty({
        description: '후기를 작성할 입양 신청 ID (상담 완료 상태여야 함)',
        example: '507f1f77bcf86cd799439012',
    })
    @IsString()
    @IsNotEmpty()
    applicationId: string;

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
