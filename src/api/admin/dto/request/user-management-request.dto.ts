import { IsString, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { UserStatus } from '../../../../common/enum/user.enum';

/**
 * 관리자 사용자 상태 관리 요청 DTO
 * 관리자가 사용자의 계정 상태를 변경할 때 사용됩니다.
 */
export class UserManagementRequestDto {
    /**
     * 변경할 사용자 상태
     * @example "suspended"
     */
    @ApiProperty({
        description: '변경할 사용자 상태',
        example: 'suspended',
        enum: UserStatus,
    })
    @IsEnum(UserStatus)
    status: UserStatus;

    /**
     * 상태 변경 사유 (필수)
     * @example "약관 위반으로 인한 계정 정지"
     */
    @ApiProperty({
        description: '상태 변경 사유',
        example: '약관 위반으로 인한 계정 정지',
    })
    @IsString()
    reason: string;

    /**
     * 정지 기간 (일 단위, suspended 상태일 때만 적용)
     * @example 7
     */
    @ApiProperty({
        description: '정지 기간 (일 단위)',
        example: 7,
        minimum: 1,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    suspensionDays?: number;

    /**
     * 관리자 추가 메모 (선택사항)
     * @example "재발 시 영구 정지 예정"
     */
    @ApiProperty({
        description: '관리자 추가 메모',
        example: '재발 시 영구 정지 예정',
        required: false,
    })
    @IsOptional()
    @IsString()
    adminNotes?: string;
}
