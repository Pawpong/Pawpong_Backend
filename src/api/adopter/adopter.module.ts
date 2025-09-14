import { Module, forwardRef } from '@nestjs/common';
import { AdopterController } from './adopter.controller';
import { AdopterService } from './adopter.service';
import { AdopterRepository } from './adopter.repository';
import { AuthDatabaseModule } from '../../common/database/database.module';
import { BreederManagementModule } from '../breeder-management/breeder-management.module';

@Module({
    imports: [AuthDatabaseModule, forwardRef(() => BreederManagementModule)],
    controllers: [AdopterController],
    providers: [AdopterService, AdopterRepository],
    exports: [AdopterService, AdopterRepository],
})
export class AdopterModule {}
