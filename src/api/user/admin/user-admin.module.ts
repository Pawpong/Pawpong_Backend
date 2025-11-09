import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UserAdminController } from './user-admin.controller';
import { UserAdminService } from './user-admin.service';

import { Admin, AdminSchema } from '../../../schema/admin.schema';
import { Breeder, BreederSchema } from '../../../schema/breeder.schema';
import { Adopter, AdopterSchema } from '../../../schema/adopter.schema';

/**
 * 사용자 관리 Admin 모듈
 *
 * 사용자 관리 관련 관리자 기능을 제공합니다:
 * - 관리자 프로필 관리
 * - 통합 사용자 관리 (입양자 + 브리더)
 * - 사용자 상태 변경
 */
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Admin.name, schema: AdminSchema },
            { name: Breeder.name, schema: BreederSchema },
            { name: Adopter.name, schema: AdopterSchema },
        ]),
    ],
    controllers: [UserAdminController],
    providers: [UserAdminService],
    exports: [UserAdminService],
})
export class UserAdminModule {}
