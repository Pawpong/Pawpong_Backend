import { IsEnum, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * 서류 정보 DTO
 */
export class DocumentDto {
    @ApiProperty({
        description: '서류 타입',
        example: 'id_card',
        enum: ['id_card', 'business_license', 'contract_sample', 'pedigree', 'breeder_certification'],
    })
    @IsEnum(['id_card', 'business_license', 'contract_sample', 'pedigree', 'breeder_certification'])
    type: string;

    @ApiProperty({
        description: '서류 파일명 (버킷에 업로드된 파일명)',
        example: 'documents/abc123_id_card.pdf',
    })
    filename: string;
}

/**
 * 브리더 서류 제출 요청 DTO (2단계 회원가입)
 *
 * 엘리트 브리더 필수 서류:
 * - id_card: 신분증 사본
 * - business_license: 동물생산업 등록증
 * - contract_sample: 표준 입양계약서 샘플
 * - pedigree: 최근 발급된 혈통서 사본
 * - breeder_certification: 고양이 혹은 강아지 브리더 인증 서류
 *
 * 뉴 브리더 필수 서류:
 * - id_card: 신분증 사본
 * - business_license: 동물생산업 등록증
 */
export class SubmitDocumentsRequestDto {
    @ApiProperty({
        description: '브리더 레벨 (회원가입 시 선택한 레벨)',
        example: 'new',
        enum: ['new', 'elite'],
    })
    @IsEnum(['new', 'elite'])
    breederLevel: string;

    @ApiProperty({
        description: '제출 서류 목록',
        type: [DocumentDto],
        example: [
            { type: 'id_card', filename: 'documents/abc123_id_card.pdf' },
            { type: 'business_license', filename: 'documents/abc123_business_license.pdf' },
        ],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DocumentDto)
    documents: DocumentDto[];
}
