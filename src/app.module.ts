import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';

import { winstonConfig } from './common/config/winston.config';
import { CustomLoggerService } from './common/logger/custom-logger.service';

import { DatabaseModule } from './common/database/database.module';
import { AuthModule } from './api/auth/auth.module';
import { HomeModule } from './api/home/home.module';
import { BreedModule } from './api/breed/breed.module';
import { HealthModule } from './api/health/health.module';
import { UploadModule } from './api/upload/upload.module';
import { BreederModule } from './api/breeder/breeder.module';
import { AdopterModule } from './api/adopter/adopter.module';
import { DistrictModule } from './api/district/district.module';
import { UserAdminModule } from './api/user/admin/user-admin.module';
import { PlatformAdminModule } from './api/platform/admin/platform-admin.module';
import { StandardQuestionModule } from './api/standard-question/standard-question.module';
import { BreederManagementModule } from './api/breeder-management/breeder-management.module';
import { FilterOptionsModule } from './api/filter-options/filter-options.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        WinstonModule.forRoot(winstonConfig),
        DatabaseModule,
        StandardQuestionModule,
        AuthModule,
        HomeModule,
        BreederModule,
        AdopterModule,
        BreederManagementModule,
        UserAdminModule,
        PlatformAdminModule,
        HealthModule,
        UploadModule,
        DistrictModule,
        BreedModule,
        FilterOptionsModule,
    ],
    controllers: [],
    providers: [CustomLoggerService],
})
export class AppModule {}
