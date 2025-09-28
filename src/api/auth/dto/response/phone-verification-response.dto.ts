import { ApiProperty } from '@nestjs/swagger';

export class PhoneVerificationResponseDto {
    @ApiProperty({
        example: true,
        description: '처리 성공 여부',
    })
    success: boolean;

    @ApiProperty({
        example: '인증번호가 발송되었습니다.',
        description: '처리 결과 메시지',
    })
    message: string;

    constructor(success: boolean, message: string) {
        this.success = success;
        this.message = message;
    }
}