import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponseDto } from '../../../../common/dto/pagination/pagination-response.dto';
import { BreederProfileResponseDto } from './breeder-profile-response.dto';

/**
 * 브리더 검색 결과 응답 DTO
 * 공통 페이지네이션 모듈을 활용한 브리더 검색 API의 응답 데이터 구조입니다.
 */
export class BreederSearchResponseDto extends PaginationResponseDto<BreederProfileResponseDto> {
    /**
     * 검색된 브리더 목록 (items 필드를 override하여 명확한 타입 지정)
     */
    @ApiProperty({
        description: '검색된 브리더 목록',
        type: [BreederProfileResponseDto],
    })
    declare items: BreederProfileResponseDto[];
}
