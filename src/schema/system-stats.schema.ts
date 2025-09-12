import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SystemStatsDocument = SystemStats & Document;

@Schema({ _id: false })
export class UserStats {
    @Prop({ default: 0 })
    totalAdopters: number;

    @Prop({ default: 0 })
    newAdopters: number;

    @Prop({ default: 0 })
    activeAdopters: number;

    @Prop({ default: 0 })
    totalBreeders: number;

    @Prop({ default: 0 })
    newBreeders: number;

    @Prop({ default: 0 })
    approvedBreeders: number;

    @Prop({ default: 0 })
    pendingBreeders: number;
}

@Schema({ _id: false })
export class AdoptionStats {
    @Prop({ default: 0 })
    totalApplications: number;

    @Prop({ default: 0 })
    newApplications: number;

    @Prop({ default: 0 })
    completedAdoptions: number;

    @Prop({ default: 0 })
    pendingApplications: number;

    @Prop({ default: 0 })
    rejectedApplications: number;
}

@Schema({ _id: false })
export class PopularBreed {
    @Prop({ required: true })
    breed: string;

    @Prop({ required: true, enum: ['dog', 'cat'] })
    type: string;

    @Prop({ default: 0 })
    applicationCount: number;

    @Prop({ default: 0 })
    completedAdoptionCount: number;

    @Prop({ default: 0 })
    averagePrice: number;
}

@Schema({ _id: false })
export class RegionalStats {
    @Prop({ required: true })
    city: string;

    @Prop({ required: true })
    district: string;

    @Prop({ default: 0 })
    breederCount: number;

    @Prop({ default: 0 })
    applicationCount: number;

    @Prop({ default: 0 })
    completedAdoptionCount: number;
}

@Schema({ _id: false })
export class BreederPerformance {
    @Prop({ required: true })
    breederId: string;

    @Prop({ required: true })
    breederName: string;

    @Prop({ required: true })
    city: string;

    @Prop({ default: 0 })
    applicationCount: number;

    @Prop({ default: 0 })
    completedAdoptionCount: number;

    @Prop({ default: 0 })
    averageRating: number;

    @Prop({ default: 0 })
    totalReviews: number;

    @Prop({ default: 0 })
    profileViews: number;
}

@Schema({ _id: false })
export class ReportStats {
    @Prop({ default: 0 })
    totalReports: number;

    @Prop({ default: 0 })
    newReports: number;

    @Prop({ default: 0 })
    resolvedReports: number;

    @Prop({ default: 0 })
    pendingReports: number;

    @Prop({ default: 0 })
    dismissedReports: number;
}

@Schema({
    timestamps: true,
    collection: 'system_stats',
})
export class SystemStats {
    @Prop({ required: true })
    date: string;

    @Prop({ required: true, enum: ['daily', 'weekly', 'monthly'], default: 'daily' })
    type: string;

    @Prop({ type: UserStats, default: () => new UserStats() })
    userStats: UserStats;

    @Prop({ type: AdoptionStats, default: () => new AdoptionStats() })
    adoptionStats: AdoptionStats;

    @Prop([PopularBreed])
    popularBreeds: PopularBreed[];

    @Prop([RegionalStats])
    regionalStats: RegionalStats[];

    @Prop([BreederPerformance])
    breederPerformance: BreederPerformance[];

    @Prop({ type: ReportStats, default: () => new ReportStats() })
    reportStats: ReportStats;

    @Prop({ default: Date.now })
    calculatedAt: Date;
}

export const SystemStatsSchema = SchemaFactory.createForClass(SystemStats);

SystemStatsSchema.index({ date: 1, type: 1 }, { unique: true });
SystemStatsSchema.index({ type: 1, createdAt: -1 });
SystemStatsSchema.index({ calculatedAt: -1 });
