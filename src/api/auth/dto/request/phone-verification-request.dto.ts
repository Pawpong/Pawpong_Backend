import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendVerificationCodeRequestDto {
    @ApiProperty({
        example: '01012345678',
        description: '인증번호를 받을 전화번호',
        pattern: '^01[0-9]{8,9}$',
    })
    @IsString()
    @Matches(/^01[0-9]{8,9}$/, {
        message: '올바른 전화번호 형식이 아닙니다.',
    })
    phone: string;
}

export class VerifyCodeRequestDto {
    @ApiProperty({
        example: '01012345678',
        description: '인증할 전화번호',
        pattern: '^01[0-9]{8,9}$',
    })
    @IsString()
    @Matches(/^01[0-9]{8,9}$/, {
        message: '올바른 전화번호 형식이 아닙니다.',
    })
    phone: string;

    @ApiProperty({
        example: '123456',
        description: '6자리 인증코드',
        pattern: '^[0-9]{6}$',
    })
    @IsString()
    @Matches(/^[0-9]{6}$/, {
        message: '인증코드는 6자리 숫자여야 합니다.',
    })
    code: string;
}