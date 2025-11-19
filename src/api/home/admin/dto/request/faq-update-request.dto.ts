import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * FAQ 수정 요청 DTO
 */
export class FaqUpdateRequestDto {
    /**
     * 질문
     * @example "포퐁은 어떤 서비스인가요?"
     */
    @ApiPropertyOptional({
        description: '질문',
        example: '포퐁은 어떤 서비스인가요?',
    })
    @IsOptional()
    @IsString()
    question?: string;

    /**
     * 답변
     * @example "포퐁은 신뢰할 수 있는 브리더와 입양자를 연결하는 플랫폼입니다."
     */
    @ApiPropertyOptional({
        description: '답변',
        example: '포퐁은 신뢰할 수 있는 브리더와 입양자를 연결하는 플랫폼입니다.',
    })
    @IsOptional()
    @IsString()
    answer?: string;

    /**
     * 카테고리
     * @example "service"
     */
    @ApiPropertyOptional({
        description: 'FAQ 카테고리',
        enum: ['service', 'adoption', 'breeder', 'payment', 'etc'],
        example: 'service',
    })
    @IsOptional()
    @IsEnum(['service', 'adoption', 'breeder', 'payment', 'etc'])
    category?: string;

    /**
     * 사용자 타입
     * @example "adopter"
     */
    @ApiPropertyOptional({
        description: '대상 사용자 타입',
        enum: ['adopter', 'breeder', 'both'],
        example: 'adopter',
    })
    @IsOptional()
    @IsEnum(['adopter', 'breeder', 'both'])
    userType?: string;

    /**
     * 정렬 순서
     * @example 1
     */
    @ApiPropertyOptional({
        description: '정렬 순서',
        example: 1,
        minimum: 0,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    order?: number;

    /**
     * 활성화 여부
     * @example true
     */
    @ApiPropertyOptional({
        description: '활성화 여부',
        example: true,
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isActive?: boolean;
}
