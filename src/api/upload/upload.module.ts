import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { StorageModule } from '../../common/storage/storage.module';
import { BreederDatabaseModule, AdopterDatabaseModule } from '../../common/database/database.module';
import { CustomLoggerService } from '../../common/logger/custom-logger.service';

@Module({
    imports: [StorageModule, BreederDatabaseModule, AdopterDatabaseModule],
    controllers: [UploadController],
    providers: [CustomLoggerService],
})
export class UploadModule {}
