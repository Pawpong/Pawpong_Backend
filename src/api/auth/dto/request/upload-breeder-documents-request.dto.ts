import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

/**
 * 브리더 문서 업로드 요청 DTO
 * Multipart/form-data로 파일과 함께 전송
 */
export class UploadBreederDocumentsRequestDto {
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
     * 신분증 사본 파일
     */
    @ApiProperty({
        description: '신분증 사본 (필수 - 모든 레벨)',
        type: 'string',
        format: 'binary',
    })
    idCard: any;

    /**
     * 동물생산업 등록증 파일
     */
    @ApiProperty({
        description: '동물생산업 등록증 (필수 - 모든 레벨)',
        type: 'string',
        format: 'binary',
    })
    animalProductionLicense: any;

    /**
     * 표준 입양계약서 샘플 파일 (Elite만)
     */
    @ApiProperty({
        description: '표준 입양계약서 샘플 (Elite 레벨 필수)',
        type: 'string',
        format: 'binary',
        required: false,
    })
    adoptionContractSample?: any;

    /**
     * 최근 발급한 협회 서류 파일 (Elite만)
     */
    @ApiProperty({
        description: '최근 발급한 협회 서류 (Elite 레벨 필수)',
        type: 'string',
        format: 'binary',
        required: false,
    })
    recentAssociationDocument?: any;

    /**
     * 고양이 브리더 인증 서류 파일 (Elite만)
     */
    @ApiProperty({
        description: '고양이 브리더 인증 서류 (Elite 레벨 필수)',
        type: 'string',
        format: 'binary',
        required: false,
    })
    breederCertification?: any;

    /**
     * TICA 또는 CFA 서류 파일 (Elite 선택)
     */
    @ApiProperty({
        description: 'TICA 또는 CFA 서류 (Elite 레벨 선택사항)',
        type: 'string',
        format: 'binary',
        required: false,
    })
    ticaCfaDocument?: any;
}
