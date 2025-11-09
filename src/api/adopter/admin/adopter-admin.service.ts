import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';

import { AdminAction, AdminTargetType } from '../../../common/enum/user.enum';

import { Admin, AdminDocument } from '../../../schema/admin.schema';
import { Breeder, BreederDocument } from '../../../schema/breeder.schema';
import { BreederReview, BreederReviewDocument } from '../../../schema/breeder-review.schema';

/**
 * 입양자 관리 Admin 서비스
 *
 * 입양자 도메인에 대한 관리자 기능을 제공합니다:
 * - 후기 신고 관리
 * - 부적절한 후기 삭제
 */
@Injectable()
export class AdopterAdminService {
    constructor(
        @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
        @InjectModel(Breeder.name) private breederModel: Model<BreederDocument>,
        @InjectModel(BreederReview.name) private breederReviewModel: Model<BreederReviewDocument>,
    ) {}

    /**
     * 관리자 활동 로그 기록
     * @private
     */
    private async logAdminActivity(
        adminId: string,
        action: AdminAction,
        targetType: AdminTargetType,
        targetId: string,
        targetName?: string,
        description?: string,
    ): Promise<void> {
        const admin = await this.adminModel.findById(adminId);
        if (admin) {
            const logEntry = {
                logId: randomUUID(),
                action,
                targetType,
                targetId,
                targetName,
                description: description || `${action} performed on ${targetType} ${targetName || targetId}`,
                performedAt: new Date(),
            };
            admin.activityLogs.push(logEntry);
            await admin.save();
        }
    }

    /**
     * 후기 신고 목록 조회
     *
     * 신고된 후기 목록을 페이지네이션과 함께 조회합니다.
     * BreederReview 컬렉션에서 isReported가 true인 후기들을 조회합니다.
     *
     * @param adminId 관리자 고유 ID
     * @param page 페이지 번호
     * @param limit 페이지당 항목 수
     * @returns 신고된 후기 목록과 페이지네이션 정보
     * @throws ForbiddenException 권한 없음
     */
    async getReviewReports(adminId: string, page: number = 1, limit: number = 10): Promise<any> {
        const admin = await this.adminModel.findById(adminId);
        if (!admin || !admin.permissions.canManageReports) {
            throw new ForbiddenException('Access denied');
        }

        const skip = (page - 1) * limit;

        // BreederReview 컬렉션에서 신고된 후기 조회
        const [reviews, total] = await Promise.all([
            this.breederReviewModel
                .find({ isReported: true })
                .sort({ reportedAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('breederId', 'name')
                .populate('reportedBy', 'nickname')
                .lean(),
            this.breederReviewModel.countDocuments({ isReported: true }),
        ]);

        const formattedReviews = reviews.map((review: any) => ({
            reviewId: review._id.toString(),
            breederId: review.breederId?._id?.toString(),
            breederName: review.breederId?.name || 'Unknown',
            reportedBy: review.reportedBy?._id?.toString(),
            reporterName: review.reportedBy?.nickname || 'Unknown',
            reportReason: review.reportReason,
            reportDescription: review.reportDescription,
            reportedAt: review.reportedAt,
            content: review.content,
            writtenAt: review.writtenAt,
            isVisible: review.isVisible,
        }));

        return {
            items: formattedReviews,
            pagination: {
                currentPage: page,
                pageSize: limit,
                totalItems: total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1,
            },
        };
    }

    /**
     * 부적절한 후기 삭제
     *
     * 신고된 부적절한 후기를 삭제합니다 (isVisible = false로 설정).
     *
     * @param adminId 관리자 고유 ID
     * @param breederId 브리더 고유 ID
     * @param reviewId 후기 고유 ID
     * @returns 삭제 결과
     * @throws ForbiddenException 권한 없음
     * @throws BadRequestException 후기를 찾을 수 없음
     */
    async deleteReview(adminId: string, breederId: string, reviewId: string): Promise<any> {
        const admin = await this.adminModel.findById(adminId);
        if (!admin || !admin.permissions.canManageReports) {
            throw new ForbiddenException('Access denied');
        }

        const review = await this.breederReviewModel.findOne({
            _id: reviewId,
            breederId: breederId,
        });

        if (!review) {
            throw new BadRequestException('후기를 찾을 수 없습니다.');
        }

        review.isVisible = false;
        await review.save();

        // BreederReview 컬렉션만 업데이트 (참조 방식)

        // 브리더 정보 조회
        const breeder = await this.breederModel.findById(breederId);

        await this.logAdminActivity(
            adminId,
            AdminAction.DELETE_REVIEW,
            AdminTargetType.REVIEW,
            reviewId,
            `Review for ${breeder?.name || 'Unknown'}`,
            'Review deleted due to violation',
        );

        return { message: 'Review deleted successfully' };
    }
}
