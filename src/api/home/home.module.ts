import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { Banner, BannerSchema } from '../../schema/banner.schema';
import { Faq, FaqSchema } from '../../schema/faq.schema';
import { StorageModule } from '../../common/storage/storage.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Banner.name, schema: BannerSchema },
            { name: Faq.name, schema: FaqSchema },
        ]),
        StorageModule,
    ],
    controllers: [HomeController],
    providers: [HomeService],
    exports: [HomeService],
})
export class HomeModule {}
