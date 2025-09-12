import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

import { Adopter, AdopterSchema } from '../../schema/adopter.schema';
import { Breeder, BreederSchema } from '../../schema/breeder.schema';
import { Admin, AdminSchema } from '../../schema/admin.schema';
import { SystemStats, SystemStatsSchema } from '../../schema/system-stats.schema';

@Module({
    imports: [
        MongooseModule.forRootAsync({
            useFactory: (configService: ConfigService) => ({
                uri: configService.get<string>('MONGODB_URI'),
            }),
            inject: [ConfigService],
        }),
        MongooseModule.forFeature([
            { name: Adopter.name, schema: AdopterSchema },
            { name: Breeder.name, schema: BreederSchema },
            { name: Admin.name, schema: AdminSchema },
            { name: SystemStats.name, schema: SystemStatsSchema },
        ]),
    ],
    exports: [MongooseModule],
})
export class DatabaseModule {}

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Adopter.name, schema: AdopterSchema },
            { name: Breeder.name, schema: BreederSchema },
        ]),
    ],
    exports: [MongooseModule],
})
export class AuthDatabaseModule {}

@Module({
    imports: [MongooseModule.forFeature([{ name: Adopter.name, schema: AdopterSchema }])],
    exports: [MongooseModule],
})
export class AdopterDatabaseModule {}

@Module({
    imports: [MongooseModule.forFeature([{ name: Breeder.name, schema: BreederSchema }])],
    exports: [MongooseModule],
})
export class BreederDatabaseModule {}

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Admin.name, schema: AdminSchema },
            { name: Breeder.name, schema: BreederSchema },
            { name: Adopter.name, schema: AdopterSchema },
            { name: SystemStats.name, schema: SystemStatsSchema },
        ]),
    ],
    exports: [MongooseModule],
})
export class AdminDatabaseModule {}
