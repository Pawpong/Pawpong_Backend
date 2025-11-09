import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { StandardQuestionService } from './standard-question.service';
import { StandardQuestionAdminController } from './admin/standard-question-admin.controller';
import { StandardQuestionAdminService } from './admin/standard-question-admin.service';
import { StandardQuestion, StandardQuestionSchema } from '../../schema/standard-question.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: StandardQuestion.name, schema: StandardQuestionSchema }])],
    controllers: [StandardQuestionAdminController],
    providers: [StandardQuestionService, StandardQuestionAdminService],
    exports: [StandardQuestionService, StandardQuestionAdminService],
})
export class StandardQuestionModule {}
