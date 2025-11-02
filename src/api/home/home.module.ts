import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { HomeController } from './home.controller';

import { HomeService } from './home.service';

import { AvailablePetRepository } from './repository/available-pet.repository';

import { AvailablePet, AvailablePetSchema } from '../../schema/available-pet.schema';
import { Banner, BannerSchema } from '../../schema/banner.schema';
import { Faq, FaqSchema } from '../../schema/faq.schema';

import { StorageModule } from '../../common/storage/storage.module';

/**
 * Home Module
 * 홈 화면 관련 기능 모듈
 */
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: AvailablePet.name, schema: AvailablePetSchema },
            { name: Banner.name, schema: BannerSchema },
            { name: Faq.name, schema: FaqSchema },
        ]),
        StorageModule, // Signed URL 생성을 위한 StorageService 주입
    ],
    controllers: [HomeController],
    providers: [HomeService, AvailablePetRepository],
    exports: [HomeService, AvailablePetRepository], // 다른 모듈에서 사용 가능하도록 export
})
export class HomeModule {}
