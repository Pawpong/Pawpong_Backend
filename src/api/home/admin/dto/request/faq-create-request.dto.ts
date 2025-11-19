import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * FAQ 생성 요청 DTO
 */
export class FaqCreateRequestDto {
    /**
     * 질문
     * @example "포퐁은 어떤 서비스인가요?"
     */
    @ApiProperty({
        description: '질문',
        example: '포퐁은 어떤 서비스인가요?',
    })
    @IsString()
    question: string;

    /**
     * 답변
     * @example "포퐁은 신뢰할 수 있는 브리더와 입양자를 연결하는 플랫폼입니다."
     */
    @ApiProperty({
        description: '답변',
        example: '포퐁은 신뢰할 수 있는 브리더와 입양자를 연결하는 플랫폼입니다.',
    })
    @IsString()
    answer: string;

    /**
     * 카테고리
     * @example "service"
     */
    @ApiProperty({
        description: 'FAQ 카테고리',
        enum: ['service', 'adoption', 'breeder', 'payment', 'etc'],
        example: 'service',
    })
    @IsEnum(['service', 'adoption', 'breeder', 'payment', 'etc'])
    category: string;

    /**
     * 사용자 타입
     * @example "adopter"
     */
    @ApiPropertyOptional({
        description: '대상 사용자 타입',
        enum: ['adopter', 'breeder', 'both'],
        example: 'adopter',
        default: 'both',
    })
    @IsOptional()
    @IsEnum(['adopter', 'breeder', 'both'])
    userType?: string = 'both';

    /**
     * 정렬 순서
     * @example 1
     */
    @ApiPropertyOptional({
        description: '정렬 순서',
        example: 1,
        minimum: 0,
        default: 0,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    order?: number = 0;

    /**
     * 활성화 여부
     * @example true
     */
    @ApiPropertyOptional({
        description: '활성화 여부',
        example: true,
        default: true,
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isActive?: boolean = true;
}
