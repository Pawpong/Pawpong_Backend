import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 입양 신청 생성 요청 DTO
 * 입양자가 특정 브리더에게 입양 신청을 할 때 사용됩니다.
 */
export class ApplicationCreateRequestDto {
    /**
     * 신청할 브리더 ID
     * @example "507f1f77bcf86cd799439011"
     */
    @ApiProperty({
        description: '신청할 브리더 ID',
        example: '507f1f77bcf86cd799439011',
    })
    @IsString()
    @IsNotEmpty()
    breederId: string;

    /**
     * 신청할 반려동물 ID
     * @example "507f1f77bcf86cd799439022"
     */
    @ApiProperty({
        description: '신청할 반려동물 ID',
        example: '507f1f77bcf86cd799439022',
    })
    @IsString()
    @IsNotEmpty()
    petId: string;

    /**
     * 입양 신청 메시지
     * @example "안녕하세요. 이 아이를 입양하고 싶습니다."
     */
    @ApiProperty({
        description: '입양 신청 메시지',
        example: '안녕하세요. 이 아이를 입양하고 싶습니다.',
    })
    @IsString()
    @IsNotEmpty()
    message: string;

    /**
     * 입양자의 반려동물 경험 수준
     * @example "beginner"
     */
    @ApiProperty({
        description: '입양자의 반려동물 경험 수준',
        example: 'beginner',
        enum: ['beginner', 'intermediate', 'expert'],
    })
    @IsEnum(['beginner', 'intermediate', 'expert'])
    experienceLevel: string;

    /**
     * 거주 환경
     * @example "apartment"
     */
    @ApiProperty({
        description: '거주 환경',
        example: 'apartment',
        enum: ['apartment', 'house', 'farm'],
    })
    @IsEnum(['apartment', 'house', 'farm'])
    livingEnvironment: string;

    /**
     * 다른 반려동물 보유 여부
     * @example false
     */
    @ApiProperty({
        description: '다른 반려동물 보유 여부',
        example: false,
    })
    @IsBoolean()
    hasOtherPets: boolean;

    /**
     * 가족 구성원 수 (선택사항)
     * @example "3명"
     */
    @ApiProperty({
        description: '가족 구성원 수',
        example: '3명',
        required: false,
    })
    @IsOptional()
    @IsString()
    familySize?: string;

    /**
     * 특별한 요청사항 (선택사항)
     * @example "주말 방문 가능 시간을 알려주세요"
     */
    @ApiProperty({
        description: '특별한 요청사항',
        example: '주말 방문 가능 시간을 알려주세요',
        required: false,
    })
    @IsOptional()
    @IsString()
    specialRequests?: string;

    /**
     * 입양 신청 폼 데이터 (임시 호환성)
     * @example {}
     */
    @ApiProperty({
        description: '입양 신청 폼 데이터',
        example: {},
        required: false,
    })
    @IsOptional()
    applicationForm?: Record<string, any>;
}
