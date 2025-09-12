import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AdminDocument = Admin & Document;

@Schema({ _id: false })
export class AdminPermissions {
    @Prop({ default: true })
    canManageUsers: boolean;

    @Prop({ default: true })
    canManageBreeders: boolean;

    @Prop({ default: true })
    canManageReports: boolean;

    @Prop({ default: true })
    canViewStatistics: boolean;

    @Prop({ default: false })
    canManageAdmins: boolean;
}

@Schema({ _id: false })
export class AdminActivityLog {
    @Prop({ required: true })
    logId: string;

    @Prop({
        required: true,
        enum: [
            'approve_breeder',
            'reject_breeder',
            'suspend_user',
            'activate_user',
            'resolve_report',
            'dismiss_report',
            'delete_review',
        ],
    })
    action: string;

    @Prop({ required: true, enum: ['breeder', 'adopter', 'report', 'review'] })
    targetType: string;

    @Prop({ required: true })
    targetId: string;

    @Prop()
    targetName?: string;

    @Prop({ required: true })
    description: string;

    @Prop({ default: Date.now })
    performedAt: Date;
}

@Schema({
    timestamps: true,
    collection: 'admins',
})
export class Admin {
    @Prop({ required: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true })
    name: string;

    @Prop()
    profileImage?: string;

    @Prop({ default: 'active', enum: ['active', 'suspended', 'deleted'] })
    status: string;

    @Prop({
        type: String,
        enum: ['super_admin', 'breeder_admin', 'report_admin', 'stats_admin'],
        default: 'breeder_admin',
    })
    adminLevel: string;

    @Prop({ default: Date.now })
    lastLoginAt: Date;

    @Prop({ type: AdminPermissions, default: () => new AdminPermissions() })
    permissions: AdminPermissions;

    @Prop([AdminActivityLog])
    activityLogs: AdminActivityLog[];
}

export const AdminSchema = SchemaFactory.createForClass(Admin);

AdminSchema.index({ email: 1 }, { unique: true });
AdminSchema.index({ status: 1 });
AdminSchema.index({ adminLevel: 1 });
AdminSchema.index({ createdAt: -1 });
