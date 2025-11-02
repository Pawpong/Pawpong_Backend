import { ApiProperty } from '@nestjs/swagger';

/**
 * 브리더 인증 상태 응답 DTO
 */
export class VerificationStatusResponseDto {
    @ApiProperty({
        description: '인증 상태',
        example: 'approved',
        enum: ['pending', 'reviewing', 'approved', 'rejected'],
    })
    status: string;

    @ApiProperty({
        description: '구독 플랜',
        example: 'premium',
        enum: ['basic', 'premium', 'enterprise'],
        required: false,
    })
    plan?: string;

    @ApiProperty({
        description: '브리더 레벨',
        example: 'advanced',
        enum: ['new', 'intermediate', 'advanced', 'expert'],
        required: false,
    })
    level?: string;

    @ApiProperty({
        description: '제출 일시',
        example: '2024-01-15T10:30:00.000Z',
        required: false,
    })
    submittedAt?: Date;

    @ApiProperty({
        description: '검토 일시',
        example: '2024-01-16T14:20:00.000Z',
        required: false,
    })
    reviewedAt?: Date;

    @ApiProperty({
        description: '인증 문서 정보',
        type: 'array',
        items: {
            type: 'object',
            properties: {
                type: { type: 'string', example: 'business_license' },
                url: { type: 'string', example: 'https://storage.googleapis.com/...' },
                uploadedAt: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
            },
        },
        required: false,
    })
    documents?: Array<{
        type: string;
        url: string;
        uploadedAt: Date;
    }>;

    @ApiProperty({
        description: '거절 사유',
        example: '제출된 서류가 불명확합니다.',
        required: false,
    })
    rejectionReason?: string;

    @ApiProperty({
        description: '이메일로 제출 여부',
        example: false,
        required: false,
    })
    submittedByEmail?: boolean;
}
