import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, ArrayMinSize, ArrayMaxSize } from 'class-validator';

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
 * 인증 서류 업로드 요청 DTO
 */
export class UploadVerificationDocumentsDto {
    @ApiProperty({
        description: '업로드할 서류 파일들',
        type: 'array',
        items: {
            type: 'string',
            format: 'binary',
        },
        example: ['file1.pdf', 'file2.pdf'],
    })
    files: Express.Multer.File[];

    @ApiProperty({
        description: '각 파일에 대응하는 서류 타입 배열 (files 배열과 순서가 일치해야 함)',
        enum: VerificationDocumentType,
        isArray: true,
        example: ['id_card', 'animal_production_license'],
    })
    @IsArray()
    @ArrayMinSize(1, { message: '최소 1개 이상의 서류 타입을 입력해야 합니다.' })
    @ArrayMaxSize(5, { message: '최대 5개까지 업로드 가능합니다.' })
    @IsEnum(VerificationDocumentType, { each: true, message: '유효하지 않은 서류 타입입니다.' })
    types: VerificationDocumentType[];
}
