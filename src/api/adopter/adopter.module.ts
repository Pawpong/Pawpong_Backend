import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AdopterController } from './adopter.controller';

import { AdopterService } from './adopter.service';

import { AdopterRepository } from './adopter.repository';

import { AdoptionApplication, AdoptionApplicationSchema } from '../../schema/adoption-application.schema';

import { AdopterDatabaseModule } from '../../common/database/database.module';
import { BreederManagementModule } from '../breeder-management/breeder-management.module';

@Module({
    imports: [
        AdopterDatabaseModule,
        forwardRef(() => BreederManagementModule),
        MongooseModule.forFeature([{ name: AdoptionApplication.name, schema: AdoptionApplicationSchema }]),
    ],
    controllers: [AdopterController],
    providers: [AdopterService, AdopterRepository],
    exports: [AdopterService, AdopterRepository],
})
export class AdopterModule {}
