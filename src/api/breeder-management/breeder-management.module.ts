import { Module, forwardRef } from '@nestjs/common';
import { BreederManagementController } from './breeder-management.controller';
import { BreederManagementService } from './breeder-management.service';
import { BreederRepository } from './breeder.repository';
import { AuthDatabaseModule } from '../../common/database/database.module';
import { AdopterModule } from '../adopter/adopter.module';

@Module({
    imports: [AuthDatabaseModule, forwardRef(() => AdopterModule)],
    controllers: [BreederManagementController],
    providers: [BreederManagementService, BreederRepository],
    exports: [BreederManagementService, BreederRepository],
})
export class BreederManagementModule {}
