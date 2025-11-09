import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { Model } from 'mongoose';

import { VerificationStatus, ReportStatus, AdminAction, AdminTargetType } from '../../../common/enum/user.enum';

import { StorageService } from '../../../common/storage/storage.service';

import { ReportActionRequestDto } from './dto/request/report-action-request.dto';
import { BreederSearchRequestDto } from './dto/request/breeder-search-request.dto';
import { BreederVerificationRequestDto } from './dto/request/breeder-verification-request.dto';
import { ApplicationMonitoringRequestDto } from './dto/request/application-monitoring-request.dto';
import { BreederVerificationResponseDto } from './dto/response/breeder-verification-response.dto';

import { Admin, AdminDocument } from '../../../schema/admin.schema';
import { Breeder, BreederDocument } from '../../../schema/breeder.schema';
import { BreederReport, BreederReportDocument } from '../../../schema/breeder-report.schema';

/**
 * 브리더 관리 Admin 서비스
 *
 * 브리더 도메인에 대한 관리자 기능을 제공합니다:
 * - 브리더 인증 승인/거절
 * - 브리더 신고 관리
 * - 입양 신청 모니터링
 */
@Injectable()
export class BreederAdminService {
    constructor(
        @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
        @InjectModel(Breeder.name) private breederModel: Model<BreederDocument>,
        @InjectModel(BreederReport.name) private breederReportModel: Model<BreederReportDocument>,
        private readonly storageService: StorageService,
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
     * 승인 대기 중인 브리더 목록 조회
     *
     * @param adminId 관리자 고유 ID
     * @param filter 검색 필터 (status, city, keyword, pagination)
     * @returns 승인 대기 브리더 목록
     */
    async getPendingBreederVerifications(adminId: string, filter: BreederSearchRequestDto): Promise<any> {
        const admin = await this.adminModel.findById(adminId);
        if (!admin || !admin.permissions.canManageBreeders) {
            throw new ForbiddenException('Access denied');
        }

        const {
            verificationStatus = VerificationStatus.REVIEWING,
            cityName,
            searchKeyword,
            pageNumber = 1,
            itemsPerPage = 10,
        } = filter;

        const query: any = { 'verification.status': verificationStatus };

        if (cityName) {
            query['profile.location.city'] = cityName;
        }

        if (searchKeyword) {
            query.$or = [{ name: new RegExp(searchKeyword, 'i') }, { email: new RegExp(searchKeyword, 'i') }];
        }

        const skip = (pageNumber - 1) * itemsPerPage;

        const [breeders, total] = await Promise.all([
            this.breederModel
                .find(query)
                .select('name email verification profile createdAt')
                .sort({ 'verification.submittedAt': -1 })
                .skip(skip)
                .limit(itemsPerPage)
                .lean(),
            this.breederModel.countDocuments(query),
        ]);

        return {
            breeders: breeders.map(
                (breeder): BreederVerificationResponseDto => ({
                    breederId: (breeder._id as any).toString(),
                    breederName: breeder.name,
                    emailAddress: breeder.emailAddress,
                    verificationInfo: {
                        verificationStatus: breeder.verification?.status || 'pending',
                        subscriptionPlan: breeder.verification?.plan || 'basic',
                        submittedAt: breeder.verification?.submittedAt,
                        // fileName을 동적으로 Signed URL로 변환 (1시간 유효)
                        documentUrls:
                            breeder.verification?.documents?.map((doc) =>
                                this.storageService.generateSignedUrl(doc.fileName, 60),
                            ) || [],
                        isSubmittedByEmail: breeder.verification?.submittedByEmail || false,
                    },
                    profileInfo: breeder.profile,
                    createdAt: (breeder as any).createdAt,
                }),
            ),
            total,
            page: pageNumber,
            totalPages: Math.ceil(total / itemsPerPage),
            hasNext: pageNumber < Math.ceil(total / itemsPerPage),
            hasPrev: pageNumber > 1,
        };
    }

    /**
     * 브리더 인증 승인/거절
     *
     * @param adminId 관리자 고유 ID
     * @param breederId 브리더 고유 ID
     * @param verificationData 인증 처리 데이터 (승인/거절 사유)
     * @returns 처리 결과
     */
    async updateBreederVerification(
        adminId: string,
        breederId: string,
        verificationData: BreederVerificationRequestDto,
    ): Promise<any> {
        const admin = await this.adminModel.findById(adminId);
        if (!admin || !admin.permissions.canManageBreeders) {
            throw new ForbiddenException('Access denied');
        }

        const breeder = await this.breederModel.findById(breederId);
        if (!breeder) {
            throw new BadRequestException('브리더를 찾을 수 없습니다.');
        }

        if (!breeder.verification) {
            throw new BadRequestException('No verification request found');
        }

        breeder.verification.status = verificationData.verificationStatus;
        breeder.verification.reviewedAt = new Date();

        if (verificationData.rejectionReason) {
            breeder.verification.rejectionReason = verificationData.rejectionReason;
        }

        await breeder.save();

        // Log admin activity
        const action =
            verificationData.verificationStatus === VerificationStatus.APPROVED
                ? AdminAction.APPROVE_BREEDER
                : AdminAction.REJECT_BREEDER;

        await this.logAdminActivity(
            adminId,
            action,
            AdminTargetType.BREEDER,
            breederId,
            breeder.name,
            `Breeder verification ${verificationData.verificationStatus}`,
        );

        return { message: `Breeder verification ${verificationData.verificationStatus}` };
    }

    /**
     * 입양 신청 모니터링
     *
     * 브리더에게 접수된 입양 신청 현황을 모니터링합니다.
     *
     * @param adminId 관리자 고유 ID
     * @param filter 필터 (breederId, 날짜 범위, pagination)
     * @returns 입양 신청 목록
     */
    async getApplications(adminId: string, filter: ApplicationMonitoringRequestDto): Promise<any> {
        const admin = await this.adminModel.findById(adminId);
        if (!admin) {
            throw new ForbiddenException('Access denied');
        }

        const { targetBreederId, startDate, endDate, pageNumber = 1, itemsPerPage = 10 } = filter;
        const skip = (pageNumber - 1) * itemsPerPage;

        const query: any = {};
        if (targetBreederId) {
            query._id = targetBreederId;
        }

        const dateFilter: any = {};
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) dateFilter.$lte = new Date(endDate);

        let pipeline: any[] = [{ $match: query }, { $unwind: '$receivedApplications' }];

        if (startDate || endDate) {
            pipeline.push({
                $match: { 'receivedApplications.appliedAt': dateFilter },
            });
        }

        pipeline.push(
            { $sort: { 'receivedApplications.appliedAt': -1 } },
            { $skip: skip },
            { $limit: itemsPerPage },
            {
                $project: {
                    breederName: '$name',
                    breederId: '$_id',
                    application: '$receivedApplications',
                },
            },
        );

        const [applications, totalCount] = await Promise.all([
            this.breederModel.aggregate(pipeline),
            this.breederModel.aggregate([
                { $match: query },
                { $unwind: '$receivedApplications' },
                ...(startDate || endDate ? [{ $match: { 'receivedApplications.appliedAt': dateFilter } }] : []),
                { $count: 'total' },
            ]),
        ]);

        const total = totalCount[0]?.total || 0;

        return {
            applications,
            total,
            page: pageNumber,
            totalPages: Math.ceil(total / itemsPerPage),
            hasNext: pageNumber < Math.ceil(total / itemsPerPage),
            hasPrev: pageNumber > 1,
        };
    }

    /**
     * 브리더 신고 목록 조회
     *
     * 브리더에 대한 신고 목록을 페이지네이션과 함께 조회합니다.
     *
     * @param adminId 관리자 고유 ID
     * @param page 페이지 번호
     * @param limit 페이지당 항목 수
     * @returns 브리더 신고 목록과 페이지네이션 정보
     */
    async getBreederReports(adminId: string, page: number = 1, limit: number = 10): Promise<any> {
        const admin = await this.adminModel.findById(adminId);
        if (!admin || !admin.permissions.canManageReports) {
            throw new ForbiddenException('Access denied');
        }

        const skip = (page - 1) * limit;

        // Get all reports from breeders
        const pipeline = [
            { $unwind: '$reports' },
            { $match: { 'reports.status': { $ne: ReportStatus.DISMISSED } } },
            { $sort: { 'reports.reportedAt': -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    breederName: '$name',
                    breederId: '$_id',
                    report: '$reports',
                },
            },
        ];

        const [reports, totalCount] = await Promise.all([
            this.breederModel.aggregate(pipeline as any),
            this.breederModel.aggregate([
                { $unwind: '$reports' },
                { $match: { 'reports.status': { $ne: ReportStatus.DISMISSED } } },
                { $count: 'total' },
            ]),
        ]);

        const total = totalCount[0]?.total || 0;

        const formattedReports = reports.map((item) => ({
            reportId: item.report.reportId,
            reporterId: item.report.reporterId,
            reporterName: item.report.reporterName,
            type: item.report.type,
            description: item.report.description,
            status: item.report.status,
            reportedAt: item.report.reportedAt,
            targetType: 'breeder',
            targetId: item.breederId.toString(),
            targetName: item.breederName,
        }));

        return {
            items: formattedReports,
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
     * 브리더 신고 처리
     *
     * 접수된 브리더 신고를 승인 또는 거절 처리합니다.
     *
     * @param adminId 관리자 고유 ID
     * @param breederId 브리더 고유 ID
     * @param reportId 신고 고유 ID
     * @param reportAction 신고 처리 데이터 (승인/거절/메모)
     * @returns 처리 결과
     */
    async updateReportStatus(
        adminId: string,
        breederId: string,
        reportId: string,
        reportAction: ReportActionRequestDto,
    ): Promise<any> {
        const admin = await this.adminModel.findById(adminId);
        if (!admin || !admin.permissions.canManageReports) {
            throw new ForbiddenException('Access denied');
        }

        const report = await this.breederReportModel.findOne({
            _id: reportId,
            breederId: breederId,
        });

        if (!report) {
            throw new BadRequestException('신고 내역을 찾을 수 없습니다.');
        }

        report.status = reportAction.reportStatus;
        if (reportAction.adminNotes) {
            report.adminNotes = reportAction.adminNotes;
        }

        await report.save();

        // 브리더 정보 조회
        const breeder = await this.breederModel.findById(breederId);

        await this.logAdminActivity(
            adminId,
            reportAction.reportStatus === ReportStatus.RESOLVED
                ? AdminAction.RESOLVE_REPORT
                : AdminAction.DISMISS_REPORT,
            AdminTargetType.REPORT,
            reportId,
            `Report against ${breeder?.name || 'Unknown'}`,
            reportAction.adminNotes,
        );

        return { message: `Report ${reportAction.reportStatus}` };
    }
}
