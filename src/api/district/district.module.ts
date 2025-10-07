import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { District, DistrictSchema } from 'src/schema/district.schema';
import { DistrictController } from './district.controller';
import { DistrictService } from './district.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: District.name, schema: DistrictSchema },
        ]),
    ],
    controllers: [DistrictController],
    providers: [DistrictService],
    exports: [DistrictService],
})
export class DistrictModule {}
