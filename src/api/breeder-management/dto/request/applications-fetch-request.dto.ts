import { IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { PaginationRequestDto } from '../../../../common/dto/pagination/pagination-request.dto';

/**
 * 받은 입양 신청 목록 조회 요청 DTO
 * 브리더가 받은 입양 신청들을 페이지네이션과 필터링으로 조회할 때 사용됩니다.
 * PaginationRequestDto를 상속받아 공통 페이지네이션 기능을 활용합니다.
 */
export class ApplicationsGetRequestDto extends PaginationRequestDto {
    /**
     * 입양 신청 상태 필터
     * @example "consultation_pending"
     */
    @ApiProperty({
        description: '입양 신청 상태 필터',
        example: 'consultation_pending',
        enum: ['consultation_pending', 'consultation_completed', 'adoption_approved', 'adoption_rejected'],
        required: false,
    })
    @IsOptional()
    @IsEnum(['consultation_pending', 'consultation_completed', 'adoption_approved', 'adoption_rejected'])
    status?: string;

    /**
     * 반려동물 종류 필터
     * @example "dog"
     */
    @ApiProperty({
        description: '반려동물 종류 필터',
        example: 'dog',
        enum: ['dog', 'cat'],
        required: false,
    })
    @IsOptional()
    @IsEnum(['dog', 'cat'])
    petType?: string;

    /**
     * 신청 기간 필터 (일 수)
     * @example 30
     */
    @ApiProperty({
        description: '최근 N일 이내 신청만 조회',
        example: 30,
        required: false,
    })
    @IsOptional()
    recentDays?: number;
}
