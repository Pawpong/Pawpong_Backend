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
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StorageService } from '../../common/storage/storage.service';
import { ApiController, ApiEndpoint } from '../../common/decorator/swagger.decorator';
import { ApiResponseDto } from '../../common/dto/response/api-response.dto';
import { UploadResponseDto } from './dto/response/upload-response.dto';
import {
    VerificationDocumentsResponseDto,
    UploadedVerificationDocument,
} from './dto/response/verification-documents-response.dto';
import { MultipleUploadResponseDto } from './dto/response/multiple-upload-response.dto';
import { FileDeleteResponseDto } from './dto/response/file-delete-response.dto';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guard/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorator/user.decorator';
import { Breeder, BreederDocument } from '../../schema/breeder.schema';
import { Adopter, AdopterDocument } from '../../schema/adopter.schema';
import { AvailablePet, AvailablePetDocument } from '../../schema/available-pet.schema';
import { ParentPet, ParentPetDocument } from '../../schema/parent-pet.schema';

@ApiController('upload')
@Controller('upload')
export class UploadController {
    constructor(
        private readonly storageService: StorageService,
        @InjectModel(Breeder.name) private breederModel: Model<BreederDocument>,
        @InjectModel(Adopter.name) private adopterModel: Model<AdopterDocument>,
        @InjectModel(AvailablePet.name) private availablePetModel: Model<AvailablePetDocument>,
        @InjectModel(ParentPet.name) private parentPetModel: Model<ParentPetDocument>,
    ) {}

    @Post('profile')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiConsumes('multipart/form-data')
    @ApiEndpoint({
        summary: '프로필 이미지 업로드',
        description:
            '브리더 또는 입양자의 프로필 이미지를 Google Cloud Storage에 업로드합니다. 로그인 시 자동으로 DB에 저장됩니다. (최대 5MB)',
        responseType: UploadResponseDto,
        isPublic: true,
    })
    @UseInterceptors(FileInterceptor('file'))
    async uploadProfile(
        @UploadedFile() file: Express.Multer.File,
        @CurrentUser() user?: any,
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

        // 로그인 사용자인 경우에만 DB 업데이트
        if (user) {
            if (user.role === 'breeder') {
                await this.breederModel.findByIdAndUpdate(user.userId, {
                    profileImage: result.fileName,
                });
            } else if (user.role === 'adopter') {
                await this.adopterModel.findByIdAndUpdate(user.userId, {
                    profileImage: result.fileName,
                });
            }
        }

        const response = new UploadResponseDto(result.cdnUrl, result.fileName, file.size);

        const message = user
            ? '프로필 이미지가 업로드되고 저장되었습니다.'
            : '프로필 이미지가 업로드되었습니다. (DB 저장은 로그인 후 가능)';

        return ApiResponseDto.success(response, message);
    }

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
            throw new NotFoundException('해당 분양 개체를 찾을 수 없습니다.');
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
            throw new NotFoundException('해당 부모견/묘를 찾을 수 없습니다.');
        }

        const result = await this.storageService.uploadFile(file, 'pets/parent');

        // DB 업데이트: photos 배열에 1개만 저장
        await this.parentPetModel.findByIdAndUpdate(petId, { $set: { photos: [result.fileName] } });

        const response = new UploadResponseDto(result.cdnUrl, result.fileName, file.size);

        return ApiResponseDto.success(response, '부모견/묘 사진이 업로드되고 저장되었습니다.');
    }

    @Post('verification-documents')
    @ApiConsumes('multipart/form-data')
    @ApiEndpoint({
        summary: '브리더 인증 서류 업로드',
        description:
            '브리더 입점 인증 서류를 업로드합니다. 회원가입 시 사용하며, 로그인 없이도 업로드 가능합니다. (최대 4개, 각 10MB)',
        responseType: VerificationDocumentsResponseDto,
        isPublic: true,
    })
    @UseInterceptors(
        FilesInterceptor('files', 10, {
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB
                files: 10,
            },
        }),
    )
    async uploadVerificationDocuments(
        @UploadedFiles() files: Express.Multer.File[],
        @Body() body: any,
    ): Promise<ApiResponseDto<VerificationDocumentsResponseDto>> {
        const typesString = body.types;

        console.log(`[uploadVerificationDocuments] 요청 - 파일 ${files?.length || 0}개, types: ${typesString}`);

        if (!files || files.length === 0) {
            throw new BadRequestException('파일이 업로드되지 않았습니다.');
        }

        // types 문자열을 배열로 파싱
        let types: string[];
        try {
            types = JSON.parse(typesString);
            if (!Array.isArray(types)) {
                throw new Error('types는 배열이어야 합니다.');
            }
        } catch (error) {
            console.log(`[uploadVerificationDocuments] 에러: types 파싱 실패`);
            throw new BadRequestException(
                'types 형식이 올바르지 않습니다. JSON 배열 형식으로 입력해주세요. 예: ["id_card","animal_production_license"]',
            );
        }

        // types 검증
        const allowedTypes = [
            'id_card',
            'animal_production_license',
            'adoption_contract_sample',
            'pedigree',
            'breeder_certification',
        ];
        for (const type of types) {
            if (!allowedTypes.includes(type)) {
                console.log(`[uploadVerificationDocuments] 에러: 유효하지 않은 타입 - ${type}`);
                throw new BadRequestException(
                    `유효하지 않은 서류 타입입니다: ${type}. 허용된 타입: ${allowedTypes.join(', ')}`,
                );
            }
        }

        if (types.length === 0) {
            throw new BadRequestException('최소 1개 이상의 서류 타입을 입력해야 합니다.');
        }

        if (types.length > 10) {
            console.log(`[uploadVerificationDocuments] 에러: 최대 개수 초과 - ${types.length}개`);
            throw new BadRequestException('최대 10개까지 업로드 가능합니다.');
        }

        // files와 types 배열 길이 일치 검증
        if (files.length !== types.length) {
            throw new BadRequestException(
                `파일 개수(${files.length})와 서류 타입 개수(${types.length})가 일치하지 않습니다.`,
            );
        }

        // 파일 타입 및 크기 검증 (PDF, 모든 이미지 허용, 최대 10MB)
        const allowedMimeTypes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'image/heic',
            'image/heif',
            'image/gif',
            'image/bmp',
            'image/tiff',
        ];
        for (const file of files) {
            if (file.size > 10 * 1024 * 1024) {
                throw new BadRequestException('파일 크기는 10MB를 초과할 수 없습니다.');
            }
            if (!allowedMimeTypes.includes(file.mimetype)) {
                throw new BadRequestException(
                    'PDF 또는 이미지 파일만 업로드 가능합니다. (pdf, jpg, jpeg, png, webp, heic, gif 등)',
                );
            }
        }

        // 파일 업로드
        const uploadedDocuments: UploadedVerificationDocument[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const type = types[i];

            // 파일 업로드 (임시 폴더에 저장, 회원가입 완료 시 브리더 ID 폴더로 이동)
            const result = await this.storageService.uploadFile(file, 'documents/verification/temp');

            const uploadedDoc: UploadedVerificationDocument = {
                type,
                url: result.cdnUrl,
                filename: result.fileName,
                size: file.size,
                uploadedAt: new Date(),
            };

            uploadedDocuments.push(uploadedDoc);
        }

        const response = new VerificationDocumentsResponseDto(uploadedDocuments, uploadedDocuments);

        return ApiResponseDto.success(response, `${uploadedDocuments.length}개의 인증 서류가 업로드되었습니다.`);
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
