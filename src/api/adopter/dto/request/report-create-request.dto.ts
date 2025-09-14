import { IsString, IsNotEmpty, IsEnum, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 신고 생성 요청 DTO
 * 입양자가 브리더를 신고할 때 사용됩니다.
 */
export class ReportCreateRequestDto {
    /**
     * 신고 타입 (breeder, adopter, content)
     * @example "breeder"
     */
    @ApiProperty({
        description: '신고 타입',
        example: 'breeder',
        enum: ['breeder', 'adopter', 'content'],
    })
    @IsEnum(['breeder', 'adopter', 'content'])
    type: string;

    /**
     * 신고할 브리더 ID
     * @example "507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '신고할 브리더 ID',
        example: '507f1f77bcf86cd799439011',
    })
    @IsString()
    @IsNotEmpty()
    breederId: string;

    /**
     * 신고 사유
     * @example "inappropriate_content"
     */
    @ApiProperty({
        description: '신고 사유',
        example: 'inappropriate_content',
        enum: ['no_contract', 'false_info', 'inappropriate_content', 'poor_conditions', 'fraud', 'other'],
    })
    @IsEnum(['no_contract', 'false_info', 'inappropriate_content', 'poor_conditions', 'fraud', 'other'])
    reason: string;

    /**
     * 신고 상세 내용
     * @example "브리더가 허위 정보를 제공했습니다. 반려동물의 건강 상태가 설명과 다릅니다."
     */
    @ApiProperty({
        description: '신고 상세 내용',
        example: '브리더가 허위 정보를 제공했습니다. 반려동물의 건강 상태가 설명과 다릅니다.',
    })
    @IsString()
    @IsNotEmpty()
    description: string;

    /**
     * 증거 자료 URL 배열 (선택사항)
     * @example ["https://example.com/evidence1.jpg", "https://example.com/evidence2.jpg"]
     */
    @ApiProperty({
        description: '증거 자료 URL 배열',
        example: ['https://example.com/evidence1.jpg', 'https://example.com/evidence2.jpg'],
        type: [String],
        required: false,
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    evidence?: string[];

    /**
     * 추가 연락처 (선택사항)
     * 신고 처리 과정에서 연락받을 수 있는 추가 연락처
     * @example "010-1234-5678"
     */
    @ApiProperty({
        description: '추가 연락처',
        example: '010-1234-5678',
        required: false,
    })
    @IsOptional()
    @IsString()
    contactInfo?: string;
}
