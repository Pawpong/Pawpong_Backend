import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { VerificationStatus } from '../../../../../common/enum/user.enum';

/**
 * 브리더 인증 처리 요청 DTO
 * 관리자가 브리더의 인증 상태를 변경할 때 사용됩니다.
 */
export class BreederVerificationRequestDto {
    /**
     * 인증 상태 (승인/거부/보류)
     * @example "approved"
     */
    @ApiProperty({
        description: '인증 상태',
        example: 'approved',
        enum: VerificationStatus,
    })
    @IsEnum(VerificationStatus)
    verificationStatus: VerificationStatus;

    /**
     * 거부 사유 (거부 시 필수)
     * @example "제출된 서류가 불완전합니다."
     */
    @ApiProperty({
        description: '거부 사유',
        example: '제출된 서류가 불완전합니다.',
        required: false,
    })
    @IsString()
    @IsOptional()
    rejectionReason?: string;
}
