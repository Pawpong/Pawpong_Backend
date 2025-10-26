import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { BreedController } from './service/breed.controller';
import { AdminBreedController } from './admin/admin-breed.controller';

import { BreedService } from './service/breed.service';
import { AdminBreedService } from './admin/admin-breed.service';

import { Breed, BreedSchema } from '../../schema/breed.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: Breed.name, schema: BreedSchema }])],
    controllers: [BreedController, AdminBreedController],
    providers: [BreedService, AdminBreedService],
    exports: [BreedService, AdminBreedService],
})
export class BreedModule {}
