import { Module, forwardRef } from '@nestjs/common';

import { BreederManagementController } from './breeder-management.controller';
import { BreederAdminController } from './admin/breeder-admin.controller';

import { BreederManagementService } from './breeder-management.service';
import { BreederAdminService } from './admin/breeder-admin.service';

import { BreederRepository } from './repository/breeder.repository';
import { ParentPetRepository } from './repository/parent-pet.repository';
import { AdoptionApplicationRepository } from './repository/adoption-application.repository';
import { AvailablePetManagementRepository } from './repository/available-pet-management.repository';

import { AdopterModule } from '../adopter/adopter.module';
import { StorageModule } from '../../common/storage/storage.module';
import { AdminDatabaseModule } from '../../common/database/database.module';
import { BreederDatabaseModule } from '../../common/database/database.module';

@Module({
    imports: [BreederDatabaseModule, AdminDatabaseModule, StorageModule, forwardRef(() => AdopterModule)],
    controllers: [BreederManagementController, BreederAdminController],
    providers: [
        BreederManagementService,
        BreederAdminService,
        BreederRepository,
        ParentPetRepository,
        AdoptionApplicationRepository,
        AvailablePetManagementRepository,
    ],
    exports: [BreederManagementService, BreederRepository, AvailablePetManagementRepository],
})
export class BreederManagementModule {}
