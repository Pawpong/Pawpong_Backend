import { ApiProperty } from '@nestjs/swagger';

/**
 * 단일 입양 신청 데이터 DTO
 */
export class ApplicationDataDto {
    /**
     * 신청 ID
     */
    @ApiProperty({ description: '신청 ID' })
    applicationId: string;

    /**
     * 입양자 ID
     */
    @ApiProperty({ description: '입양자 ID' })
    adopterId: string;

    /**
     * 입양자 이름
     */
    @ApiProperty({ description: '입양자 이름' })
    adopterName: string;

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
     * 신청 상태
     */
    @ApiProperty({
        description: '신청 상태',
        enum: ['pending', 'reviewed', 'approved', 'rejected', 'completed'],
    })
    status: string;

    /**
     * 신청 일시
     */
    @ApiProperty({ description: '신청 일시', format: 'date-time' })
    appliedAt: Date;

    /**
     * 마지막 업데이트 일시
     */
    @ApiProperty({ description: '마지막 업데이트 일시', format: 'date-time' })
    lastUpdatedAt: Date;
}

/**
 * 입양 신청 모니터링 응답 DTO
 * 전체 입양 신청 현황을 반환합니다.
 */
export class ApplicationMonitoringResponseDto {
    /**
     * 입양 신청 목록
     */
    @ApiProperty({
        description: '입양 신청 목록',
        type: [ApplicationDataDto],
    })
    applications: ApplicationDataDto[];

    /**
     * 전체 신청 수
     */
    @ApiProperty({
        description: '전체 신청 수',
        example: 150,
    })
    totalCount: number;

    /**
     * 대기 중인 신청 수
     */
    @ApiProperty({
        description: '대기 중인 신청 수',
        example: 30,
    })
    pendingCount: number;

    /**
     * 승인된 신청 수
     */
    @ApiProperty({
        description: '승인된 신청 수',
        example: 80,
    })
    approvedCount: number;

    /**
     * 거절된 신청 수
     */
    @ApiProperty({
        description: '거절된 신청 수',
        example: 20,
    })
    rejectedCount: number;

    /**
     * 완료된 신청 수
     */
    @ApiProperty({
        description: '완료된 신청 수',
        example: 20,
    })
    completedCount: number;
}
