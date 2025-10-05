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
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { StorageService } from '../../common/storage/storage.service';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly storageService: StorageService) {}

  @Post('single')
  @ApiOperation({ summary: '단일 파일 업로드' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        folder: {
          type: 'string',
          description: '업로드할 폴더 경로 (예: profiles, pets)',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('파일이 없습니다.');
    }

    const result = await this.storageService.uploadFile(file, folder);

    return {
      success: true,
      message: '파일 업로드 성공',
      data: result,
    };
  }

  @Post('multiple')
  @ApiOperation({ summary: '다중 파일 업로드 (최대 10개)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        folder: {
          type: 'string',
          description: '업로드할 폴더 경로',
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('folder') folder?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('파일이 없습니다.');
    }

    const results = await this.storageService.uploadMultipleFiles(
      files,
      folder,
    );

    return {
      success: true,
      message: `${files.length}개 파일 업로드 성공`,
      data: results,
    };
  }

  @Delete()
  @ApiOperation({ summary: '파일 삭제' })
  async deleteFile(@Body('fileName') fileName: string) {
    if (!fileName) {
      throw new BadRequestException('파일명이 없습니다.');
    }

    await this.storageService.deleteFile(fileName);

    return {
      success: true,
      message: '파일 삭제 성공',
    };
  }
}
