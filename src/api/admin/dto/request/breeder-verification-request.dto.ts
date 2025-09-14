import { IsString, IsEnum, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { VerificationStatus } from '../../../../common/enum/user.enum';

/**
 * 관리자 브리더 인증 처리 요청 DTO
 * 관리자가 브리더의 인증 신청을 승인/거절할 때 사용됩니다.
 */
export class BreederVerificationRequestDto {
    /**
     * 인증 상태 (approved: 승인, rejected: 거절)
     * @example "approved"
     */
    @ApiProperty({
        description: '인증 상태',
        example: 'approved',
        enum: VerificationStatus,
    })
    @IsEnum(VerificationStatus)
    status: VerificationStatus;

    /**
     * 관리자 메시지 (필수)
     * 승인/거절 사유를 브리더에게 전달하는 메시지
     * @example "모든 서류가 확인되었습니다. 브리더 인증이 승인되었습니다."
     */
    @ApiProperty({
        description: '관리자 메시지',
        example: '모든 서류가 확인되었습니다. 브리더 인증이 승인되었습니다.',
    })
    @IsString()
    message: string;

    /**
     * 거절 시 필요한 추가 서류 목록 (선택사항)
     * @example ["business_license", "facility_photos", "health_certificates"]
     */
    @ApiProperty({
        description: '거절 시 필요한 추가 서류 목록',
        example: ['business_license', 'facility_photos', 'health_certificates'],
        type: [String],
        required: false,
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    requiredDocuments?: string[];

    /**
     * 거절 사유 (선택사항)
     * @example "사업자등록증이 명확하지 않습니다"
     */
    @ApiProperty({
        description: '거절 사유',
        example: '사업자등록증이 명확하지 않습니다',
        required: false,
    })
    @IsOptional()
    @IsString()
    rejectionReason?: string;
}
