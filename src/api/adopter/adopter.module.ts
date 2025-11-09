import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AdopterController } from './adopter.controller';
import { AdopterAdminController } from './admin/adopter-admin.controller';

import { AdopterService } from './adopter.service';
import { AdopterAdminService } from './admin/adopter-admin.service';

import { AdopterRepository } from './adopter.repository';

import { AdoptionApplication, AdoptionApplicationSchema } from '../../schema/adoption-application.schema';

import { AdopterDatabaseModule, AdminDatabaseModule } from '../../common/database/database.module';
import { StorageModule } from '../../common/storage/storage.module';
import { BreederManagementModule } from '../breeder-management/breeder-management.module';

@Module({
    imports: [
        AdopterDatabaseModule,
        AdminDatabaseModule,
        StorageModule,
        forwardRef(() => BreederManagementModule),
        MongooseModule.forFeature([{ name: AdoptionApplication.name, schema: AdoptionApplicationSchema }]),
    ],
    controllers: [AdopterController, AdopterAdminController],
    providers: [AdopterService, AdopterAdminService, AdopterRepository],
    exports: [AdopterService, AdopterRepository],
})
export class AdopterModule {}
