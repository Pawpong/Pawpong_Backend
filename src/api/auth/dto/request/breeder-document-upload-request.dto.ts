import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * 브리더 문서 업로드 요청 DTO
 * 브리더 레벨(Elite/New)에 따라 필요한 문서가 다름
 */
export class BreederDocumentUploadRequestDto {
    /**
     * 브리더 레벨 (elite 또는 new)
     */
    @ApiProperty({
        description: '브리더 레벨',
        enum: ['elite', 'new'],
        example: 'elite',
    })
    @IsEnum(['elite', 'new'])
    @IsNotEmpty()
    breederLevel: string;

    /**
     * 신분증 사본 URL (필수 - 모든 레벨)
     */
    @ApiProperty({
        description: '신분증 사본 URL',
        example: 'https://storage.googleapis.com/pawpong/documents/id-card.jpg',
    })
    @IsString()
    @IsNotEmpty()
    idCardUrl: string;

    /**
     * 동물생산업 등록증 URL (필수 - 모든 레벨)
     */
    @ApiProperty({
        description: '동물생산업 등록증 URL',
        example:
            'https://storage.googleapis.com/pawpong/documents/animal-production-license.pdf',
    })
    @IsString()
    @IsNotEmpty()
    animalProductionLicenseUrl: string;

    /**
     * 표준 입양계약서 샘플 URL (Elite 전용 필수)
     */
    @ApiProperty({
        description: '표준 입양계약서 샘플 URL (Elite 레벨 필수)',
        example:
            'https://storage.googleapis.com/pawpong/documents/adoption-contract-sample.pdf',
        required: false,
    })
    @IsString()
    @IsOptional()
    adoptionContractSampleUrl?: string;

    /**
     * 최근 발급한 협회 서류 URL (Elite 전용 필수)
     */
    @ApiProperty({
        description: '최근 발급한 협회 서류 URL (Elite 레벨 필수)',
        example:
            'https://storage.googleapis.com/pawpong/documents/association-document.pdf',
        required: false,
    })
    @IsString()
    @IsOptional()
    recentAssociationDocumentUrl?: string;

    /**
     * 고양이 브리더 인증 서류 URL (Elite 전용 필수)
     */
    @ApiProperty({
        description: '고양이 브리더 인증 서류 URL (Elite 레벨 필수)',
        example:
            'https://storage.googleapis.com/pawpong/documents/breeder-certification.pdf',
        required: false,
    })
    @IsString()
    @IsOptional()
    breederCertificationUrl?: string;

    /**
     * TICA 또는 CFA 서류 URL (Elite 전용 선택)
     * 특정 품종에 대한 추가 인증 서류
     */
    @ApiProperty({
        description: 'TICA 또는 CFA 서류 URL (Elite 레벨 선택사항)',
        example: 'https://storage.googleapis.com/pawpong/documents/tica-cfa.pdf',
        required: false,
    })
    @IsString()
    @IsOptional()
    ticaCfaDocumentUrl?: string;
}
