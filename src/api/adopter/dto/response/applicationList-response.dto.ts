import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponseDto } from '../../../../common/dto/pagination/pagination-response.dto';

/**
 * 입양 신청 데이터 DTO
 * 단일 입양 신청의 정보를 나타냅니다.
 */
export class ApplicationDataDto {
    /**
     * 신청 고유 ID
     */
    @ApiProperty({ description: '신청 고유 ID' })
    applicationId: string;

    /**
     * 브리더 ID
     */
    @ApiProperty({ description: '브리더 ID' })
    breederId: string;

    /**
     * 브리더 이름
     */
    @ApiProperty({ description: '브리더 이름' })
    breederName: string;

    /**
     * 반려동물 ID
     */
    @ApiProperty({ description: '반려동물 ID' })
    petId: string;

    /**
     * 반려동물 이름
     */
    @ApiProperty({ description: '반려동물 이름' })
    petName: string;

    /**
     * 반려동물 품종
     */
    @ApiProperty({ description: '반려동물 품종' })
    petBreed: string;

    /**
     * 신청 상태
     */
    @ApiProperty({
        description: '신청 상태',
        enum: ['consultation_pending', 'consultation_completed', 'adoption_approved', 'adoption_rejected'],
    })
    applicationStatus: string;

    /**
     * 신청 일시
     */
    @ApiProperty({ description: '신청 일시', format: 'date-time' })
    appliedAt: Date;

    /**
     * 최종 업데이트 일시
     */
    @ApiProperty({ description: '최종 업데이트 일시', format: 'date-time' })
    updatedAt: Date;

    /**
     * 후기 작성 여부
     */
    @ApiProperty({ description: '후기 작성 여부' })
    isReviewWritten: boolean;
}

/**
 * 입양 신청 목록 조회 응답 DTO
 * 공통 페이지네이션 모듈을 활용한 입양자가 제출한 입양 신청 내역 응답입니다.
 */
export class ApplicationListResponseDto extends PaginationResponseDto<ApplicationDataDto> {
    /**
     * 입양 신청 목록 (item 필드를 override하여 명확한 타입 지정)
     */
    @ApiProperty({
        description: '입양 신청 목록',
        type: [ApplicationDataDto],
    })
    declare item: ApplicationDataDto[];

    /**
     * 상태별 신청 수
     */
    @ApiProperty({
        description: '상태별 신청 수',
        type: 'object',
        properties: {
            consultationPending: { type: 'number', description: '상담 대기 중' },
            consultationCompleted: { type: 'number', description: '상담 완료' },
            adoptionApproved: { type: 'number', description: '입양 승인' },
            adoptionRejected: { type: 'number', description: '입양 거절' },
        },
    })
    statusCounts: {
        consultationPending: number;
        consultationCompleted: number;
        adoptionApproved: number;
        adoptionRejected: number;
    };
}
