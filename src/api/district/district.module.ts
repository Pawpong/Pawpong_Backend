import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { DistrictController } from './service/district.controller';
import { AdminDistrictController } from './admin/admin-district.controller';

import { DistrictService } from './service/district.service';
import { AdminDistrictService } from './admin/admin-district.service';

import { District, DistrictSchema } from '../../schema/district.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: District.name, schema: DistrictSchema }])],
    controllers: [DistrictController, AdminDistrictController],
    providers: [DistrictService, AdminDistrictService],
    exports: [DistrictService, AdminDistrictService],
})
export class DistrictModule {}
