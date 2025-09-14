import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';

import { winstonConfig } from './common/config/winston.config';
import { CustomLoggerService } from './common/logger/custom-logger.service';

import { DatabaseModule } from './common/database/database.module';
import { AuthModule } from './api/auth/auth.module';
import { BreederModule } from './api/breeder/breeder.module';
import { AdopterModule } from './api/adopter/adopter.module';
import { BreederManagementModule } from './api/breeder-management/breeder-management.module';
import { AdminModule } from './api/admin/admin.module';
import { HealthModule } from './api/health/health.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        WinstonModule.forRoot(winstonConfig),
        DatabaseModule,
        AuthModule,
        BreederModule,
        AdopterModule,
        BreederManagementModule,
        AdminModule,
        HealthModule,
    ],
    controllers: [],
    providers: [CustomLoggerService],
})
export class AppModule {}
