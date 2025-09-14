import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AdminDocument = Admin & Document;

/**
 * 관리자 권한 설정 스키마
 * 관리자별로 접근 가능한 기능을 세분화하여 관리합니다.
 */
@Schema({ _id: false })
export class AdminPermissions {
    /**
     * 사용자 관리 권한 (입양자 계정 정지/해제 등)
     */
    @Prop({ default: true })
    canManageUsers: boolean;

    /**
     * 브리더 관리 권한 (인증 승인/거절 등)
     */
    @Prop({ default: true })
    canManageBreeders: boolean;

    /**
     * 신고 처리 권한 (신고 접수/처리 등)
     */
    @Prop({ default: true })
    canManageReports: boolean;

    /**
     * 통계 조회 권한 (시스템 통계 데이터 조회)
     */
    @Prop({ default: true })
    canViewStatistics: boolean;

    /**
     * 관리자 관리 권한 (다른 관리자 계정 관리, 최고관리자만 가능)
     */
    @Prop({ default: false })
    canManageAdmins: boolean;
}

/**
 * 관리자 활동 로그 스키마
 * 관리자가 수행한 모든 관리 작업의 이력을 추적하여 감사 및 책임 추적성을 확보합니다.
 */
@Schema({ _id: false })
export class AdminActivityLog {
    /**
     * 로그 고유 ID
     */
    @Prop({ required: true })
    logId: string;

    /**
     * 수행한 관리 작업 유형
     */
    @Prop({
        required: true,
        enum: [
            'approve_breeder', // 브리더 인증 승인
            'reject_breeder', // 브리더 인증 거절
            'suspend_user', // 사용자 계정 정지
            'activate_user', // 사용자 계정 활성화
            'resolve_report', // 신고 해결
            'dismiss_report', // 신고 기각
            'delete_review', // 후기 삭제
        ],
    })
    action: string;

    /**
     * 작업 대상 유형
     */
    @Prop({ required: true, enum: ['breeder', 'adopter', 'report', 'review'] })
    targetType: string;

    /**
     * 작업 대상 ID
     */
    @Prop({ required: true })
    targetId: string;

    /**
     * 작업 대상 이름 (검색 및 식별 편의성을 위해)
     */
    @Prop()
    targetName?: string;

    /**
     * 작업 상세 설명
     */
    @Prop({ required: true })
    description: string;

    /**
     * 작업 수행 일시
     */
    @Prop({ default: Date.now })
    performedAt: Date;
}

/**
 * 관리자 메인 스키마
 * 시스템 관리를 담당하는 관리자의 정보와 권한, 활동 내역을 관리합니다.
 */
@Schema({
    timestamps: true,
    collection: 'admins',
})
export class Admin {
    /**
     * 이메일 주소 (로그인 ID)
     */
    @Prop({ required: true })
    email: string;

    /**
     * 해시된 비밀번호
     */
    @Prop({ required: true })
    password: string;

    /**
     * 관리자 이름
     */
    @Prop({ required: true })
    name: string;

    /**
     * 프로필 이미지 URL
     */
    @Prop()
    profileImage?: string;

    /**
     * 계정 상태 (active: 활성, suspended: 정지, deleted: 삭제)
     */
    @Prop({ default: 'active', enum: ['active', 'suspended', 'deleted'] })
    status: string;

    /**
     * 관리자 범위 등급 (super_admin: 최고관리자, breeder_admin: 브리더관리자, report_admin: 신고관리자, stats_admin: 통계관리자)
     */
    @Prop({
        type: String,
        enum: ['super_admin', 'breeder_admin', 'report_admin', 'stats_admin'],
        default: 'breeder_admin',
    })
    adminLevel: string;

    /**
     * 마지막 로그인 일시
     */
    @Prop({ default: Date.now })
    lastLoginAt: Date;

    /**
     * 관리자 권한 설정
     */
    @Prop({ type: AdminPermissions, default: () => new AdminPermissions() })
    permissions: AdminPermissions;

    /**
     * 관리자 활동 로그 목록
     */
    @Prop([AdminActivityLog])
    activityLogs: AdminActivityLog[];
}

export const AdminSchema = SchemaFactory.createForClass(Admin);

// MongoDB 인덱스 설정 - 관리자 관리 및 검색 성능 최적화

// 1. 이메일 주소 - 유니크 인덱스 (로그인 및 사용자 식별용)
AdminSchema.index({ email: 1 }, { unique: true });

// 2. 계정 상태별 조회 - 활성화된 관리자 목록 조회 최적화
AdminSchema.index({ status: 1 });

// 3. 관리자 범위별 조회 - 권한 기반 접근 제어용
AdminSchema.index({ adminLevel: 1 });

// 4. 최근 가입 관리자 조회 - 가입 날짜 역순 정렬
AdminSchema.index({ createdAt: -1 });
