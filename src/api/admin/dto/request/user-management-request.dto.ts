import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { UserStatus } from '../../../../common/enum/user.enum';

/**
 * 사용자 관리 요청 DTO
 * 관리자가 사용자의 계정 상태를 변경할 때 사용됩니다.
 */
export class UserManagementRequestDto {
    /**
     * 계정 상태 (활성/정지/비활성화)
     * @example "suspended"
     */
    @ApiProperty({
        description: '계정 상태',
        example: 'suspended',
        enum: UserStatus,
    })
    @IsEnum(UserStatus)
    accountStatus: UserStatus;

    /**
     * 상태 변경 사유
     * @example "부적절한 게시물 작성"
     */
    @ApiProperty({
        description: '상태 변경 사유',
        example: '부적절한 게시물 작성',
        required: false,
    })
    @IsString()
    @IsOptional()
    actionReason?: string;
}
