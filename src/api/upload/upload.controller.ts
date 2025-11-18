import {
    Controller,
    Post,
    Delete,
    UseInterceptors,
    UseGuards,
    UploadedFile,
    UploadedFiles,
    Body,
    Param,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { CurrentUser } from '../../common/decorator/user.decorator';
import { ApiController, ApiEndpoint } from '../../common/decorator/swagger.decorator';

import { StorageService } from '../../common/storage/storage.service';

import { Breeder, BreederDocument } from '../../schema/breeder.schema';
import { ParentPet, ParentPetDocument } from '../../schema/parent-pet.schema';
import { AvailablePet, AvailablePetDocument } from '../../schema/available-pet.schema';

import { ApiResponseDto } from '../../common/dto/response/api-response.dto';
import { UploadResponseDto } from './dto/response/upload-response.dto';

@ApiController('업로드')
@Controller('upload')
export class UploadController {
    constructor(
        private readonly storageService: StorageService,

        @InjectModel(Breeder.name) private breederModel: Model<BreederDocument>,
        @InjectModel(AvailablePet.name) private availablePetModel: Model<AvailablePetDocument>,
        @InjectModel(ParentPet.name) private parentPetModel: Model<ParentPetDocument>,
    ) {}

    @Post('representative-photos')
    @UseGuards(JwtAuthGuard)
    @ApiConsumes('multipart/form-data')
    @ApiEndpoint({
        summary: '대표 사진 업로드',
        description: '브리더의 대표 사진을 업로드하고 자동으로 DB에 저장합니다. (최대 3장, 각 5MB)',
        responseType: UploadResponseDto,
        isPublic: false,
    })
    @UseInterceptors(FilesInterceptor('files', 3))
    async uploadRepresentativePhotos(
        @UploadedFiles() files: Express.Multer.File[],
        @CurrentUser() user: any,
    ): Promise<ApiResponseDto<UploadResponseDto[]>> {
        if (!files || files.length === 0) {
            throw new BadRequestException('파일이 업로드되지 않았습니다.');
        }

        if (user.role !== 'breeder') {
            throw new ForbiddenException('브리더만 대표 사진을 업로드할 수 있습니다.');
        }

        // 파일 개수 검증 (최대 3장)
        if (files.length > 3) {
            throw new BadRequestException('대표 사진은 최대 3장까지 업로드 가능합니다.');
        }

        // 각 파일 크기 및 타입 검증
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        for (const file of files) {
            if (file.size > 5 * 1024 * 1024) {
                throw new BadRequestException('파일 크기는 5MB를 초과할 수 없습니다.');
            }
            if (!allowedMimeTypes.includes(file.mimetype)) {
                throw new BadRequestException('이미지 파일만 업로드 가능합니다. (jpg, jpeg, png, gif, webp)');
            }
        }

        const results = await this.storageService.uploadMultipleFiles(files, 'representative');
        const fileNames = results.map((r) => r.fileName);

        // DB 업데이트: profile.representativePhotos 배열에 추가
        await this.breederModel.findByIdAndUpdate(user.userId, {
            $set: { 'profile.representativePhotos': fileNames },
        });

        const responses = results.map(
            (result, index) => new UploadResponseDto(result.cdnUrl, result.fileName, files[index].size),
        );

        return ApiResponseDto.success(responses, '대표 사진이 업로드되고 저장되었습니다.');
    }

    @Post('available-pet-photos/:petId')
    @UseGuards(JwtAuthGuard)
    @ApiConsumes('multipart/form-data')
    @ApiEndpoint({
        summary: '분양 개체 사진 업로드',
        description: '분양 개체의 사진 1장을 업로드하고 자동으로 DB에 저장합니다.',
        responseType: UploadResponseDto,
        isPublic: false,
    })
    @UseInterceptors(FileInterceptor('file'))
    async uploadAvailablePetPhotos(
        @Param('petId') petId: string,
        @UploadedFile() file: Express.Multer.File,
        @CurrentUser() user: any,
    ): Promise<ApiResponseDto<UploadResponseDto>> {
        if (!file) {
            throw new BadRequestException('파일이 업로드되지 않았습니다.');
        }

        if (user.role !== 'breeder') {
            throw new ForbiddenException('브리더만 분양 개체 사진을 업로드할 수 있습니다.');
        }

        // 해당 petId가 본인 소유인지 확인
        const pet = await this.availablePetModel.findOne({ _id: petId, breederId: user.userId });
        if (!pet) {
            throw new BadRequestException('해당 분양 개체를 찾을 수 없습니다.');
        }

        const result = await this.storageService.uploadFile(file, 'pets/available');

        // DB 업데이트: photos 배열에 1개만 저장
        await this.availablePetModel.findByIdAndUpdate(petId, { $set: { photos: [result.fileName] } });

        const response = new UploadResponseDto(result.cdnUrl, result.fileName, file.size);

        return ApiResponseDto.success(response, '분양 개체 사진이 업로드되고 저장되었습니다.');
    }

    @Post('parent-pet-photos/:petId')
    @UseGuards(JwtAuthGuard)
    @ApiConsumes('multipart/form-data')
    @ApiEndpoint({
        summary: '부모견/묘 사진 업로드',
        description: '부모견/묘의 사진 1장을 업로드하고 자동으로 DB에 저장합니다.',
        responseType: UploadResponseDto,
        isPublic: false,
    })
    @UseInterceptors(FileInterceptor('file'))
    async uploadParentPetPhotos(
        @Param('petId') petId: string,
        @UploadedFile() file: Express.Multer.File,
        @CurrentUser() user: any,
    ): Promise<ApiResponseDto<UploadResponseDto>> {
        if (!file) {
            throw new BadRequestException('파일이 업로드되지 않았습니다.');
        }

        if (user.role !== 'breeder') {
            throw new ForbiddenException('브리더만 부모견/묘 사진을 업로드할 수 있습니다.');
        }

        // 해당 petId가 본인 소유인지 확인
        const pet = await this.parentPetModel.findOne({ _id: petId, breederId: user.userId });
        if (!pet) {
            throw new BadRequestException('해당 부모견/묘를 찾을 수 없습니다.');
        }

        const result = await this.storageService.uploadFile(file, 'pets/parent');

        // DB 업데이트: photos 배열에 1개만 저장
        await this.parentPetModel.findByIdAndUpdate(petId, { $set: { photos: [result.fileName] } });

        const response = new UploadResponseDto(result.cdnUrl, result.fileName, file.size);

        return ApiResponseDto.success(response, '부모견/묘 사진이 업로드되고 저장되었습니다.');
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

        const response = new UploadResponseDto(result.cdnUrl, result.fileName, file.size);

        return ApiResponseDto.success(response, '파일 업로드 성공');
    }

    @Post('multiple')
    @ApiConsumes('multipart/form-data')
    @ApiEndpoint({
        summary: '다중 파일 업로드',
        description: '다중 파일을 Google Cloud Storage에 업로드합니다. (최대 10개)',
        responseType: UploadResponseDto,
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
            (result, index) => new UploadResponseDto(result.cdnUrl, result.fileName, files[index].size),
        );

        return ApiResponseDto.success(responses, `${files.length}개 파일 업로드 성공`);
    }

    @Delete()
    @ApiEndpoint({
        summary: '파일 삭제',
        description: 'Google Cloud Storage에서 파일을 삭제합니다.',
        isPublic: true,
    })
    async deleteFile(@Body('fileName') fileName: string): Promise<ApiResponseDto<null>> {
        if (!fileName) {
            throw new BadRequestException('파일명이 없습니다.');
        }

        await this.storageService.deleteFile(fileName);

        return ApiResponseDto.success(null, '파일 삭제 성공');
    }
}
