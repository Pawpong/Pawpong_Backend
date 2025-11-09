import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { StandardQuestion, StandardQuestionDocument } from '../../schema/standard-question.schema';

/**
 * 표준 입양 신청 질문 Public 서비스
 *
 * 역할:
 * - 브리더가 사용할 활성화된 표준 질문 제공
 */
@Injectable()
export class StandardQuestionService {
    constructor(
        @InjectModel(StandardQuestion.name) private readonly standardQuestionModel: Model<StandardQuestionDocument>,
    ) {}

    /**
     * 모든 활성화된 표준 질문 조회 (브리더용)
     * @returns 활성화된 표준 질문 목록
     */
    async getAllActiveQuestions(): Promise<StandardQuestionDocument[]> {
        return this.standardQuestionModel.find({ isActive: true }).sort({ order: 1 }).exec() as any;
    }

    /**
     * ID로 표준 질문 조회
     * @param id 질문 ID
     * @returns 표준 질문 또는 null
     */
    async getQuestionById(id: string): Promise<StandardQuestionDocument | null> {
        return this.standardQuestionModel.findOne({ id }).exec() as any;
    }
}
