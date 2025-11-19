import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { StandardQuestion, StandardQuestionDocument } from '../../../schema/standard-question.schema';
import { STANDARD_QUESTIONS } from '../../../common/data/standard-questions.data';

/**
 * 표준 입양 신청 질문 관리 Admin 서비스
 *
 * 역할:
 * - 관리자의 표준 질문 CRUD 관리
 */
@Injectable()
export class StandardQuestionAdminService {
    constructor(
        @InjectModel(StandardQuestion.name) private readonly standardQuestionModel: Model<StandardQuestionDocument>,
    ) {}

    /**
     * 모든 표준 질문 조회 (관리자용 - 비활성화 포함)
     * @returns 모든 표준 질문 목록
     */
    async getAllQuestions(): Promise<StandardQuestionDocument[]> {
        return this.standardQuestionModel.find().sort({ order: 1 }).exec() as any;
    }

    /**
     * ID로 표준 질문 조회
     * @param id 질문 ID
     * @returns 표준 질문 또는 null
     */
    async getQuestionById(id: string): Promise<StandardQuestionDocument | null> {
        return this.standardQuestionModel.findOne({ id }).exec() as any;
    }

    /**
     * 표준 질문 수정 (관리자 전용)
     * @param id 질문 ID
     * @param updateData 수정할 데이터
     * @returns 수정된 질문
     */
    async updateQuestion(id: string, updateData: Partial<StandardQuestion>): Promise<StandardQuestionDocument> {
        const question = await this.standardQuestionModel.findOne({ id });
        if (!question) {
            throw new BadRequestException('해당 질문을 찾을 수 없습니다.');
        }

        // ID는 수정 불가
        delete updateData.id;

        Object.assign(question, updateData);
        return question.save() as any;
    }

    /**
     * 표준 질문 활성화/비활성화 (관리자 전용)
     * @param id 질문 ID
     * @param isActive 활성화 여부
     * @returns 수정된 질문
     */
    async toggleQuestionStatus(id: string, isActive: boolean): Promise<StandardQuestionDocument> {
        const question = await this.standardQuestionModel.findOne({ id });
        if (!question) {
            throw new BadRequestException('해당 질문을 찾을 수 없습니다.');
        }

        question.isActive = isActive;
        return question.save() as any;
    }

    /**
     * 표준 질문 순서 변경 (관리자 전용)
     * @param reorderData 순서 변경 데이터 배열
     * @returns 성공 메시지
     */
    async reorderQuestions(reorderData: Array<{ id: string; order: number }>): Promise<{ message: string }> {
        const bulkOps = reorderData.map((item) => ({
            updateOne: {
                filter: { id: item.id },
                update: { $set: { order: item.order } },
            },
        }));

        await this.standardQuestionModel.bulkWrite(bulkOps);
        return { message: '질문 순서가 성공적으로 변경되었습니다.' };
    }

    /**
     * 표준 질문 재시딩 (관리자 전용 - 초기화)
     * @returns 성공 메시지
     */
    async reseedQuestions(): Promise<{ message: string }> {
        // 기존 데이터 삭제
        await this.standardQuestionModel.deleteMany({});

        // 새로운 데이터 삽입
        await this.standardQuestionModel.insertMany(STANDARD_QUESTIONS);

        console.log(`[StandardQuestionAdminService] 표준 질문 재시딩 완료: ${STANDARD_QUESTIONS.length}개`);

        return { message: `${STANDARD_QUESTIONS.length}개의 표준 질문이 재시딩되었습니다.` };
    }
}
