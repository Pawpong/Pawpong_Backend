import { ApiProperty } from '@nestjs/swagger';

import { PaginationResponseDto } from '../../../../common/dto/pagination/pagination-response.dto';
import { ReceivedApplicationResponseDto } from './received-application-response.dto';

/**
 * 받은 입양 신청 목록 응답 DTO
 * 공통 페이지네이션 모듈을 활용한 브리더가 받은 입양 신청 목록 API의 응답 데이터 구조입니다.
 */
export class ReceivedApplicationListResponseDto extends PaginationResponseDto<ReceivedApplicationResponseDto> {
    /**
     * 받은 입양 신청 목록 (items 필드를 override하여 명확한 타입 지정)
     */
    @ApiProperty({
        description: '받은 입양 신청 목록',
        type: [ReceivedApplicationResponseDto],
    })
    declare items: ReceivedApplicationResponseDto[];
}
