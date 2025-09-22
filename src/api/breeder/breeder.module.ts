import { Module } from '@nestjs/common';

import { BreederController } from './breeder.controller';

import { BreederService } from './breeder.service';
import { BreederExploreService } from './breeder-explore.service';

import { BreederDatabaseModule, AdopterDatabaseModule } from '../../common/database/database.module';

@Module({
    imports: [BreederDatabaseModule, AdopterDatabaseModule],
    controllers: [BreederController],
    providers: [BreederService, BreederExploreService],
    exports: [BreederService, BreederExploreService],
})
export class BreederModule {}
