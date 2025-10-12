import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

import { Adopter, AdopterSchema } from '../../schema/adopter.schema';
import { Breeder, BreederSchema } from '../../schema/breeder.schema';
import { Admin, AdminSchema } from '../../schema/admin.schema';
import { SystemStats, SystemStatsSchema } from '../../schema/system-stats.schema';
import { ParentPet, ParentPetSchema } from '../../schema/parent-pet.schema';
import { AvailablePet, AvailablePetSchema } from '../../schema/available-pet.schema';
import { BreederReview, BreederReviewSchema } from '../../schema/breeder-review.schema';
import { BreederReport, BreederReportSchema } from '../../schema/breeder-report.schema';
import { AdoptionApplication, AdoptionApplicationSchema } from '../../schema/adoption-application.schema';

@Module({
    imports: [
        MongooseModule.forRootAsync({
            useFactory: (configService: ConfigService) => {
                const uri = configService.get<string>('MONGODB_URI');
                console.log('[DatabaseModule] MongoDB URI:', uri ? uri.replace(/:[^:]*@/, ':****@') : 'NOT SET');

                return {
                    uri: uri,
                    connectionFactory: (connection) => {
                        connection.on('connected', () => {
                            console.log('[DatabaseModule] MongoDB connected successfully');
                        });
                        connection.on('disconnected', () => {
                            console.log('[DatabaseModule] MongoDB disconnected');
                        });
                        connection.on('error', (error) => {
                            console.error('[DatabaseModule] MongoDB connection error:', error.message);
                        });
                        return connection;
                    },
                    // 연결 옵션 추가
                    retryAttempts: 3,
                    retryDelay: 1000,
                    serverSelectionTimeoutMS: 5000,
                    connectTimeoutMS: 10000,
                    socketTimeoutMS: 45000,
                };
            },
            inject: [ConfigService],
        }),
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
    imports: [
        MongooseModule.forFeature([
            { name: Adopter.name, schema: AdopterSchema },
            { name: Breeder.name, schema: BreederSchema },
            { name: BreederReview.name, schema: BreederReviewSchema },
        ]),
    ],
    exports: [MongooseModule],
})
export class AdopterDatabaseModule {}

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Breeder.name, schema: BreederSchema },
            { name: AvailablePet.name, schema: AvailablePetSchema },
            { name: ParentPet.name, schema: ParentPetSchema },
            { name: BreederReview.name, schema: BreederReviewSchema },
            { name: AdoptionApplication.name, schema: AdoptionApplicationSchema },
        ]),
    ],
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
            { name: BreederReport.name, schema: BreederReportSchema },
            { name: BreederReview.name, schema: BreederReviewSchema },
        ]),
    ],
    exports: [MongooseModule],
})
export class AdminDatabaseModule {}
