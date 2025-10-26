import { Prop, Schema } from '@nestjs/mongoose';

/**
 * 소셜 인증 정보 스키마 (공통)
 * 사용자의 소셜 로그인 연동 정보를 저장합니다.
 */
@Schema({ _id: false })
export class SocialAuthInfo {
    /**
     * 인증 제공자 (local, google, kakao, naver, apple)
     */
    @Prop({ required: true, enum: ['local', 'google', 'kakao', 'naver', 'apple'] })
    authProvider: string;

    /**
     * 제공자 고유 ID
     */
    @Prop()
    providerUserId?: string;

    /**
     * 제공자에서 받은 이메일
     */
    @Prop()
    providerEmail?: string;
}

/**
 * User 베이스 스키마 (공통)
 * Adopter, Breeder, Admin이 상속받는 기본 사용자 정보
 */
@Schema()
export class User {
    /**
     * 이메일 주소 (로그인 ID)
     */
    @Prop({ required: true, lowercase: true })
    emailAddress: string;

    /**
     * 해시된 비밀번호 (소셜 로그인 사용자는 선택)
     */
    @Prop()
    passwordHash?: string;

    /**
     * 리프레시 토큰 (JWT 재발급용)
     */
    @Prop()
    refreshToken?: string;

    /**
     * 닉네임 (화면 표시용 이름)
     */
    @Prop({ required: true })
    nickname: string;

    /**
     * 연락처 전화번호
     */
    @Prop()
    phoneNumber?: string;

    /**
     * 프로필 이미지 파일 이름
     */
    @Prop()
    profileImageFileName?: string;

    /**
     * 소셜 인증 정보
     */
    @Prop({ type: SocialAuthInfo })
    socialAuthInfo?: SocialAuthInfo;

    /**
     * 사용자 역할 (adopter, breeder, admin)
     */
    @Prop({
        required: true,
        enum: ['adopter', 'breeder', 'admin'],
    })
    userRole: string;

    /**
     * 계정 상태 (active, suspended, deleted)
     */
    @Prop({
        default: 'active',
        enum: ['active', 'suspended', 'deleted'],
    })
    accountStatus: string;

    /**
     * 마지막 로그인 일시
     */
    @Prop({ default: Date.now })
    lastLoginAt: Date;

    /**
     * 마지막 활동 일시 (API 호출 등)
     */
    @Prop({ default: Date.now })
    lastActivityAt: Date;

    /**
     * 서비스 이용약관 동의 여부 (필수)
     */
    @Prop({ required: true, default: false })
    termsAgreed: boolean;

    /**
     * 개인정보 처리방침 동의 여부 (필수)
     */
    @Prop({ required: true, default: false })
    privacyAgreed: boolean;

    /**
     * 마케팅 정보 수신 동의 여부 (선택)
     */
    @Prop({ default: false })
    marketingAgreed: boolean;

    /**
     * 계정 생성 일시 (timestamps: true로 자동 생성)
     */
    createdAt?: Date;

    /**
     * 계정 수정 일시 (timestamps: true로 자동 생성)
     */
    updatedAt?: Date;
}
