import { ApiProperty } from '@nestjs/swagger';

/**
 * 인증 서류 타입
 */
export enum VerificationDocumentType {
    ID_CARD = 'id_card',
    ANIMAL_PRODUCTION_LICENSE = 'animal_production_license',
    ADOPTION_CONTRACT_SAMPLE = 'adoption_contract_sample',
    BREEDER_CERTIFICATION = 'breeder_certification',
}

/**
 * 업로드된 인증 서류 정보
 */
export class UploadedVerificationDocument {
    @ApiProperty({
        description: '서류 타입',
        enum: VerificationDocumentType,
        example: 'id_card',
    })
    type: string;

    @ApiProperty({
        description: '업로드된 파일 URL',
        example: 'https://cdn.example.com/documents/verification/breeder123/id_card_uuid.pdf',
    })
    url: string;

    @ApiProperty({
        description: '파일명',
        example: 'id_card_uuid.pdf',
    })
    filename: string;

    @ApiProperty({
        description: '파일 크기 (bytes)',
        example: 204800,
    })
    size: number;

    @ApiProperty({
        description: '업로드 시간',
        example: '2024-10-14T12:00:00.000Z',
    })
    uploadedAt: Date;
}

/**
 * 인증 서류 업로드 응답 DTO
 */
export class VerificationDocumentsResponseDto {
    @ApiProperty({
        description: '업로드된 서류 목록',
        type: [UploadedVerificationDocument],
    })
    uploadedDocuments: UploadedVerificationDocument[];

    @ApiProperty({
        description: '전체 업로드된 서류 목록 (기존 + 새로 업로드된 서류)',
        type: [UploadedVerificationDocument],
    })
    allDocuments: UploadedVerificationDocument[];

    constructor(uploadedDocuments: UploadedVerificationDocument[], allDocuments: UploadedVerificationDocument[]) {
        this.uploadedDocuments = uploadedDocuments;
        this.allDocuments = allDocuments;
    }
}
