import { ApiProperty } from '@nestjs/swagger';

/**
 * 브리더 문서 업로드 응답 DTO
 * 문서 업로드 성공 후 검증 상태를 반환
 */
export class BreederDocumentUploadResponseDto {
    /**
     * 브리더 ID
     */
    @ApiProperty({
        description: '브리더 ID',
        example: '507f1f77bcf86cd799439011',
    })
    breederId: string;

    /**
     * 검증 상태
     */
    @ApiProperty({
        description: '검증 상태',
        enum: ['pending', 'approved', 'rejected'],
        example: 'pending',
    })
    verificationStatus: string;

    /**
     * 업로드된 문서 목록
     */
    @ApiProperty({
        description: '업로드된 문서 목록',
        example: {
            idCard: 'https://storage.googleapis.com/pawpong/documents/id-card.jpg',
            animalProductionLicense: 'https://storage.googleapis.com/pawpong/documents/license.pdf',
            adoptionContractSample: 'https://storage.googleapis.com/pawpong/documents/contract.pdf',
            recentAssociationDocument: 'https://storage.googleapis.com/pawpong/documents/association.pdf',
            breederCertification: 'https://storage.googleapis.com/pawpong/documents/certification.pdf',
        },
    })
    uploadedDocuments: {
        idCard: string;
        animalProductionLicense: string;
        adoptionContractSample?: string;
        recentAssociationDocument?: string;
        breederCertification?: string;
        ticaCfaDocument?: string;
    };

    /**
     * 필수 문서 완료 여부
     */
    @ApiProperty({
        description: '필수 문서 모두 업로드 완료 여부',
        example: true,
    })
    isDocumentsComplete: boolean;

    /**
     * 검증 신청 일시
     */
    @ApiProperty({
        description: '검증 신청 일시',
        format: 'date-time',
        example: '2025-01-15T10:30:00.000Z',
    })
    submittedAt: Date;

    /**
     * 예상 처리 시간
     */
    @ApiProperty({
        description: '예상 처리 시간 (영업일 기준)',
        example: '3-5일',
    })
    estimatedProcessingTime: string;
}
