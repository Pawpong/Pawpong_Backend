import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ToggleStandardQuestionStatusDto {
    @ApiProperty({ description: '활성화 여부', example: true })
    @IsBoolean()
    isActive: boolean;
}
