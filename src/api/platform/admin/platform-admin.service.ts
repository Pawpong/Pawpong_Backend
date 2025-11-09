import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
    VerificationStatus,
    UserStatus,
    ApplicationStatus,
} from '../../../common/enum/user.enum';

import { Admin, AdminDocument } from '../../../schema/admin.schema';
import { Breeder, BreederDocument } from '../../../schema/breeder.schema';
import { Adopter, AdopterDocument } from '../../../schema/adopter.schema';
import { SystemStats, SystemStatsDocument } from '../../../schema/system-stats.schema';

import { StatsFilterRequestDto } from './dto/request/stats-filter-request.dto';
import { AdminStatsResponseDto } from './dto/response/admin-stats-response.dto';

/**
 * 플랫폼 Admin 서비스
 *
 * 플랫폼 전체 통계 관련 관리자 기능을 제공합니다:
 * - 플랫폼 통계 조회
 * - 사용자 통계
 * - 입양 신청 통계
 * - 인기 품종 통계
 * - 지역별 통계
 * - 브리더 성과 랭킹
 * - 신고 통계
 */
@Injectable()
export class PlatformAdminService {
    constructor(
        @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
        @InjectModel(Breeder.name) private breederModel: Model<BreederDocument>,
        @InjectModel(Adopter.name) private adopterModel: Model<AdopterDocument>,
        @InjectModel(SystemStats.name) private systemStatsModel: Model<SystemStatsDocument>,
    ) {}

    /**
     * 플랫폼 통계 조회
     *
     * 전체 플랫폼의 통계 정보를 조회합니다:
     * - 사용자 통계 (입양자/브리더)
     * - 입양 신청 통계
     * - 인기 품종 통계
     * - 지역별 통계
     * - 브리더 성과 랭킹
     * - 신고 통계
     *
     * @param adminId 관리자 고유 ID
     * @param filter 통계 필터 (날짜 범위, 유형 등)
     * @returns 플랫폼 통계
     */
    async getStats(adminId: string, filter: StatsFilterRequestDto): Promise<AdminStatsResponseDto> {
        const admin = await this.adminModel.findById(adminId);
        if (!admin || !admin.permissions.canViewStatistics) {
            throw new ForbiddenException('Access denied');
        }

        const { statsType, startDate, endDate } = filter;

        // For now, return aggregated stats. In production, you'd use SystemStats collection
        const [adoptersTotal, breedersTotal, breedersApproved, breedersPending] = await Promise.all([
            this.adopterModel.countDocuments({ account_status: UserStatus.ACTIVE }),
            this.breederModel.countDocuments({ status: UserStatus.ACTIVE }),
            this.breederModel.countDocuments({ 'verification.status': VerificationStatus.APPROVED }),
            this.breederModel.countDocuments({ 'verification.status': VerificationStatus.REVIEWING }),
        ]);

        // Get application stats through aggregation
        const applicationStats = await this.breederModel.aggregate([
            { $unwind: '$receivedApplications' },
            {
                $group: {
                    _id: '$receivedApplications.status',
                    count: { $sum: 1 },
                },
            },
        ]);

        const totalApplications = applicationStats.reduce((sum, stat) => sum + stat.count, 0);
        const pendingApplications =
            applicationStats.find((s) => s._id === ApplicationStatus.CONSULTATION_PENDING)?.count || 0;
        const completedAdoptions =
            applicationStats.find((s) => s._id === ApplicationStatus.ADOPTION_APPROVED)?.count || 0;
        const rejectedApplications =
            applicationStats.find((s) => s._id === ApplicationStatus.ADOPTION_REJECTED)?.count || 0;

        // Get popular breeds
        const popularBreeds = await this.breederModel.aggregate([
            { $unwind: '$availablePets' },
            {
                $group: {
                    _id: { breed: '$availablePets.breed', type: '$availablePets.type' },
                    applicationCount: { $sum: 1 },
                    averagePrice: { $avg: '$availablePets.price' },
                },
            },
            { $sort: { applicationCount: -1 } },
            { $limit: 10 },
        ]);

        // Get regional stats
        const regionalStats = await this.breederModel.aggregate([
            {
                $group: {
                    _id: { city: '$profile.location.city', district: '$profile.location.district' },
                    breederCount: { $sum: 1 },
                    applicationCount: { $sum: '$stats.totalApplications' },
                    completedAdoptionCount: { $sum: '$stats.completedAdoptions' },
                },
            },
            { $sort: { breederCount: -1 } },
            { $limit: 10 },
        ]);

        // Get breeder performance
        const breederPerformance = await this.breederModel.aggregate([
            {
                $project: {
                    breederId: '$_id',
                    breederName: '$name',
                    city: '$profile.location.city',
                    applicationCount: '$stats.totalApplications',
                    completedAdoptionCount: '$stats.completedAdoptions',
                    averageRating: '$stats.averageRating',
                    totalReviews: '$stats.totalReviews',
                    profileViews: '$stats.profileViews',
                },
            },
            { $sort: { applicationCount: -1 } },
            { $limit: 10 },
        ]);

        // Get report stats
        const reportStats = await this.breederModel.aggregate([
            { $unwind: '$reports' },
            {
                $group: {
                    _id: '$reports.status',
                    count: { $sum: 1 },
                },
            },
        ]);

        const totalReports = reportStats.reduce((sum, stat) => sum + stat.count, 0);
        const pendingReports = reportStats.find((s) => s._id === 'pending')?.count || 0;
        const resolvedReports = reportStats.find((s) => s._id === 'resolved')?.count || 0;
        const dismissedReports = reportStats.find((s) => s._id === 'dismissed')?.count || 0;

        return {
            userStatistics: {
                totalAdopterCount: adoptersTotal,
                newAdopterCount: 0, // Would need date filtering
                activeAdopterCount: adoptersTotal,
                totalBreederCount: breedersTotal,
                newBreederCount: 0, // Would need date filtering
                approvedBreederCount: breedersApproved,
                pendingBreederCount: breedersPending,
            },
            adoptionStatistics: {
                totalApplicationCount: totalApplications,
                newApplicationCount: 0, // Would need date filtering
                completedAdoptionCount: completedAdoptions,
                pendingApplicationCount: pendingApplications,
                rejectedApplicationCount: rejectedApplications,
            },
            popularBreeds: popularBreeds.map((breed) => ({
                breedName: breed._id.breed,
                petType: breed._id.type,
                applicationCount: breed.applicationCount,
                completedAdoptionCount: 0,
                averagePrice: breed.averagePrice || 0,
            })),
            regionalStatistics: regionalStats.map((region) => ({
                cityName: region._id.city || 'Unknown',
                districtName: region._id.district || 'Unknown',
                breederCount: region.breederCount,
                applicationCount: region.applicationCount || 0,
                completedAdoptionCount: region.completedAdoptionCount || 0,
            })),
            breederPerformanceRanking: breederPerformance.map((breeder) => ({
                breederId: breeder.breederId.toString(),
                breederName: breeder.breederName,
                cityName: breeder.city || 'Unknown',
                applicationCount: breeder.applicationCount || 0,
                completedAdoptionCount: breeder.completedAdoptionCount || 0,
                averageRating: breeder.averageRating || 0,
                totalReviewCount: breeder.totalReviews || 0,
                profileViewCount: breeder.profileViews || 0,
            })),
            reportStatistics: {
                totalReportCount: totalReports,
                newReportCount: 0, // Would need date filtering
                resolvedReportCount: resolvedReports,
                pendingReportCount: pendingReports,
                dismissedReportCount: dismissedReports,
            },
        };
    }
}
