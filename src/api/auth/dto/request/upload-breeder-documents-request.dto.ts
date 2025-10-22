import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * 브리더 문서 업로드 요청 DTO
 * Multipart/form-data로 파일과 함께 전송
 */
export class UploadBreederDocumentsRequestDto {
    /**
     * 브리더 레벨
     * @example "new"
     */
    @ApiProperty({
        description: '브리더 레벨 (new 또는 elite)',
        example: 'new',
        enum: ['new', 'elite'],
    })
    @IsEnum(['new', 'elite'], { message: '레벨은 "new" 또는 "elite"만 가능합니다.' })
    @IsNotEmpty({ message: '레벨은 필수입니다.' })
    level: 'new' | 'elite';

    /**
     * 서류 타입 배열 (JSON 문자열 또는 배열)
     * @example ["idCard","animalProductionLicense"]
     */
    @ApiProperty({
        description: '서류 타입 배열 (JSON 문자열 또는 배열로 전송)',
        example: '["idCard","animalProductionLicense"]',
        type: 'string',
    })
    @Transform(({ value }) => {
        // 문자열인 경우 JSON 파싱
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                if (!Array.isArray(parsed)) {
                    throw new Error('types는 배열이어야 합니다.');
                }
                return parsed;
            } catch (error) {
                throw new Error(
                    'types 형식이 올바르지 않습니다. JSON 배열 형식으로 입력해주세요. 예: ["idCard","animalProductionLicense"]',
                );
            }
        }
        // 이미 배열인 경우 그대로 반환
        return value;
    })
    @IsArray({ message: 'types는 배열이어야 합니다.' })
    @ArrayMinSize(1, { message: '최소 1개 이상의 서류 타입이 필요합니다.' })
    @ArrayMaxSize(10, { message: '최대 10개까지 업로드 가능합니다.' })
    types: string[];
}
