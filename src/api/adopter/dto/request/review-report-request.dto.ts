import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

/**
 * 후기 신고 요청 DTO
 */
export class ReviewReportRequestDto {
    @ApiProperty({
        description: '신고할 후기 ID',
        example: '507f1f77bcf86cd799439011',
    })
    @IsString()
    @IsNotEmpty()
    reviewId: string;

    @ApiProperty({
        description: '신고 사유',
        example: '부적절한 내용',
    })
    @IsString()
    @IsNotEmpty()
    reason: string;

    @ApiProperty({
        description: '신고 상세 설명',
        example: '욕설 및 비방이 포함되어 있습니다.',
    })
    @IsString()
    @IsNotEmpty()
    description: string;
}
