import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
    @ApiProperty({
        description: '업로드된 파일 URL',
        example: 'http://localhost:8080/uploads/profiles/profile-1234567890-123456789.jpg',
    })
    url: string;

    @ApiProperty({
        description: '파일명',
        example: 'profile-1234567890-123456789.jpg',
    })
    filename: string;

    @ApiProperty({
        description: '파일 크기 (bytes)',
        example: 102400,
    })
    size: number;

    constructor(url: string, filename: string, size: number) {
        this.url = url;
        this.filename = filename;
        this.size = size;
    }
}
