import { ApiProperty } from '@nestjs/swagger';
import { UploadResponseDto } from './upload-response.dto';

/**
 * 다중 파일 업로드 응답 DTO
 * 여러 개의 파일이 성공적으로 업로드되었을 때 반환되는 데이터 구조입니다.
 */
export class MultipleUploadResponseDto {
    /**
     * 업로드된 파일 정보 배열
     */
    @ApiProperty({
        description: '업로드된 파일 정보 배열',
        type: [UploadResponseDto],
    })
    files: UploadResponseDto[];

    /**
     * 업로드된 파일 총 개수
     * @example 5
     */
    @ApiProperty({
        description: '업로드된 파일 총 개수',
        example: 5,
    })
    totalCount: number;

    /**
     * 총 파일 크기 (bytes)
     * @example 15728640
     */
    @ApiProperty({
        description: '총 파일 크기 (bytes)',
        example: 15728640,
    })
    totalSize: number;

    /**
     * 업로드 완료 메시지
     * @example "5개의 파일이 성공적으로 업로드되었습니다."
     */
    @ApiProperty({
        description: '업로드 완료 메시지',
        example: '5개의 파일이 성공적으로 업로드되었습니다.',
    })
    message: string;
}
