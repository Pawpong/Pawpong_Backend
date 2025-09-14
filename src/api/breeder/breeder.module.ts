import { Module } from '@nestjs/common';
import { BreederController } from './breeder.controller';
import { BreederService } from './breeder.service';
import { BreederDatabaseModule } from '../../common/database/database.module';

@Module({
    imports: [BreederDatabaseModule],
    controllers: [BreederController],
    providers: [BreederService],
    exports: [BreederService],
})
export class BreederModule {}
