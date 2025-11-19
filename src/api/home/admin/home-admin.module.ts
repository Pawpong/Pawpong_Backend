import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { HomeAdminController } from './home-admin.controller';
import { HomeAdminService } from './home-admin.service';
import { Banner, BannerSchema } from '../../../schema/banner.schema';
import { Faq, FaqSchema } from '../../../schema/faq.schema';
import { StorageModule } from '../../../common/storage/storage.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Banner.name, schema: BannerSchema },
            { name: Faq.name, schema: FaqSchema },
        ]),
        StorageModule,
    ],
    controllers: [HomeAdminController],
    providers: [HomeAdminService],
    exports: [HomeAdminService],
})
export class HomeAdminModule {}
