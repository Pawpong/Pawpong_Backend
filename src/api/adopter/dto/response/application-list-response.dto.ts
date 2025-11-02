import { ApiProperty } from '@nestjs/swagger';

import { PaginationResponseDto } from '../../../../common/dto/pagination/pagination-response.dto';
import { ApplicationListItemResponseDto } from './application-list-item-response.dto';

/**
 * 입양 신청 목록 응답 DTO
 *
 * 입양자가 자신이 보낸 입양 신청 목록을 페이지네이션으로 조회할 때 사용됩니다.
 */
export class ApplicationListResponseDto extends PaginationResponseDto<ApplicationListItemResponseDto> {
    /**
     * 입양 신청 목록 (items 필드를 override하여 명확한 타입 지정)
     */
    @ApiProperty({
        description: '입양 신청 목록',
        type: [ApplicationListItemResponseDto],
    })
    declare items: ApplicationListItemResponseDto[];
}