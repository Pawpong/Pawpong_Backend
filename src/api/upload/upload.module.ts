import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { StorageModule } from '../../common/storage/storage.module';
import { BreederDatabaseModule, AdopterDatabaseModule } from '../../common/database/database.module';

@Module({
  imports: [
    StorageModule,
    BreederDatabaseModule,
    AdopterDatabaseModule,
  ],
  controllers: [UploadController],
})
export class UploadModule {}
