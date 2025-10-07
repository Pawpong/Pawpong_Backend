import {
    Controller,
    Post,
    Delete,
    UseInterceptors,
    UploadedFile,
    UploadedFiles,
    Body,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes } from '@nestjs/swagger';
import { StorageService } from '../../common/storage/storage.service';
import { ApiController, ApiEndpoint } from '../../common/decorator/swagger.decorator';
import { ApiResponseDto } from '../../common/dto/response/api-response.dto';
import { UploadResponseDto } from './dto/response/upload-response.dto';

@ApiController('upload')
@Controller('upload')
export class UploadController {
    constructor(private readonly storageService: StorageService) {}

    @Post('profile')
    @ApiConsumes('multipart/form-data')
    @ApiEndpoint({
        summary: '프로필 이미지 업로드',
        description: '브리더 또는 입양자의 프로필 이미지를 Google Cloud Storage에 업로드합니다. (최대 5MB)',
        responseType: UploadResponseDto,
        isPublic: true,
    })
    @UseInterceptors(FileInterceptor('file'))
    async uploadProfile(
        @UploadedFile() file: Express.Multer.File,
    ): Promise<ApiResponseDto<UploadResponseDto>> {
        if (!file) {
            throw new BadRequestException('파일이 업로드되지 않았습니다.');
        }

        // 파일 크기 검증 (5MB)
        if (file.size > 5 * 1024 * 1024) {
            throw new BadRequestException('파일 크기는 5MB를 초과할 수 없습니다.');
        }

        // 파일 타입 검증
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('이미지 파일만 업로드 가능합니다. (jpg, jpeg, png, gif, webp)');
        }

        const result = await this.storageService.uploadFile(file, 'profiles');

        const response = new UploadResponseDto(
            result.cdnUrl,
            result.fileName,
            file.size,
        );

        return ApiResponseDto.success(response, '프로필 이미지가 업로드되었습니다.');
    }

    @Post('single')
    @ApiConsumes('multipart/form-data')
    @ApiEndpoint({
        summary: '단일 파일 업로드',
        description: '단일 파일을 Google Cloud Storage에 업로드합니다.',
        responseType: UploadResponseDto,
        isPublic: true,
    })
    @UseInterceptors(FileInterceptor('file'))
    async uploadSingle(
        @UploadedFile() file: Express.Multer.File,
        @Body('folder') folder?: string,
    ): Promise<ApiResponseDto<UploadResponseDto>> {
        if (!file) {
            throw new BadRequestException('파일이 없습니다.');
        }

        const result = await this.storageService.uploadFile(file, folder);

        const response = new UploadResponseDto(
            result.cdnUrl,
            result.fileName,
            file.size,
        );

        return ApiResponseDto.success(response, '파일 업로드 성공');
    }

    @Post('multiple')
    @ApiConsumes('multipart/form-data')
    @ApiEndpoint({
        summary: '다중 파일 업로드',
        description: '다중 파일을 Google Cloud Storage에 업로드합니다. (최대 10개)',
        isPublic: true,
    })
    @UseInterceptors(FilesInterceptor('files', 10))
    async uploadMultiple(
        @UploadedFiles() files: Express.Multer.File[],
        @Body('folder') folder?: string,
    ): Promise<ApiResponseDto<UploadResponseDto[]>> {
        if (!files || files.length === 0) {
            throw new BadRequestException('파일이 없습니다.');
        }

        const results = await this.storageService.uploadMultipleFiles(files, folder);

        const responses = results.map(
            (result, index) =>
                new UploadResponseDto(
                    result.cdnUrl,
                    result.fileName,
                    files[index].size,
                ),
        );

        return ApiResponseDto.success(
            responses,
            `${files.length}개 파일 업로드 성공`,
        );
    }

    @Delete()
    @ApiEndpoint({
        summary: '파일 삭제',
        description: 'Google Cloud Storage에서 파일을 삭제합니다.',
        isPublic: true,
    })
    async deleteFile(
        @Body('fileName') fileName: string,
    ): Promise<ApiResponseDto<null>> {
        if (!fileName) {
            throw new BadRequestException('파일명이 없습니다.');
        }

        await this.storageService.deleteFile(fileName);

        return ApiResponseDto.success(null, '파일 삭제 성공');
    }
}
