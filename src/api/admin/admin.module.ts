import { Module } from '@nestjs/common';

import { AdminController } from './admin.controller';

import { AdminService } from './admin.service';

import { AdminDatabaseModule } from '../../common/database/database.module';
import { StorageModule } from '../../common/storage/storage.module';

@Module({
    imports: [AdminDatabaseModule, StorageModule],
    controllers: [AdminController],
    providers: [AdminService],
    exports: [AdminService],
})
export class AdminModule {}
