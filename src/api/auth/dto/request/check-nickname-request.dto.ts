import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class CheckNicknameRequestDto {
    @ApiProperty({
        description: '닉네임 (2-10자, 한글/영문/숫자)',
        example: '행복한입양자',
        minLength: 2,
        maxLength: 10,
    })
    @IsString()
    @MinLength(2, { message: '닉네임은 최소 2자 이상이어야 합니다.' })
    @MaxLength(10, { message: '닉네임은 최대 10자까지 가능합니다.' })
    @Matches(/^[a-zA-Z0-9가-힣]+$/, {
        message: '닉네임은 한글, 영문, 숫자만 사용 가능합니다.',
    })
    nickname: string;
}
