/**
 * Auth 도메인 스웨거 문서
 */
export class AuthSwaggerDocs {
    static readonly registerAdopter = {
        summary: '입양자 회원가입',
        description: `
            새로운 입양자 계정을 생성합니다.
            
            ## 필수 정보
            - 이메일 (중복 불가)
            - 비밀번호 (최소 8자)
            - 이름
            - 전화번호
            
            ## 응답
            - Access Token (1시간 유효)
            - Refresh Token (7일 유효)
            - 사용자 정보
        `,
    };

    static readonly registerBreeder = {
        summary: '브리더 회원가입',
        description: `
            새로운 브리더 계정을 생성합니다.
            
            ## 필수 정보
            - 이메일 (중복 불가)
            - 비밀번호 (최소 8자)
            - 이름/업체명
            - 전화번호
            
            ## 초기 상태
            - 인증 상태: PENDING
            - 플랜: BASIC
            - 레벨: NEW
            
            ## 응답
            - Access Token (1시간 유효)
            - Refresh Token (7일 유효)
            - 브리더 정보
        `,
    };

    static readonly login = {
        summary: '사용자 로그인',
        description: `
            이메일과 비밀번호로 로그인합니다.
            
            ## 지원 계정
            - 입양자 (adopter)
            - 브리더 (breeder)
            
            ## 토큰 정책
            - Access Token: 1시간 유효
            - Refresh Token: 7일 유효
            - Refresh Token은 DB에 해시화되어 저장
            
            ## 실패 사유
            - 잘못된 이메일/비밀번호
            - 계정 정지 상태
        `,
    };

    static readonly refresh = {
        summary: '토큰 재발급',
        description: `
            Refresh 토큰을 사용하여 새로운 토큰을 발급받습니다.
            
            ## 토큰 갱신
            - 새로운 Access Token 발급
            - 새로운 Refresh Token 발급
            - 기존 Refresh Token 무효화
            
            ## 실패 사유
            - 만료된 Refresh Token
            - 유효하지 않은 토큰 형식
            - DB에 저장된 토큰과 불일치
        `,
    };

    static readonly logout = {
        summary: '로그아웃',
        description: `
            현재 사용자를 로그아웃 처리합니다.
            
            ## 처리 내용
            - DB에서 Refresh Token 제거
            - 클라이언트는 Access Token 삭제 필요
            
            ## 인증 필요
            - 유효한 Access Token 필요
        `,
    };
}

/**
 * Auth 요청 예시
 */
export const AUTH_REQUEST_EXAMPLES = {
    registerAdopter: {
        email: 'user@example.com',
        password: 'securePassword123!',
        name: '김입양',
        phone: '010-1234-5678',
    },
    registerBreeder: {
        email: 'breeder@example.com',
        password: 'securePassword123!',
        name: '해피독 브리더',
        phone: '010-9876-5432',
    },
    login: {
        email: 'user@example.com',
        password: 'securePassword123!',
    },
    refresh: {
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
};

/**
 * Auth 응답 예시
 */
export const AUTH_RESPONSE_EXAMPLE = {
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    accessTokenExpiresIn: 3600,
    refreshTokenExpiresIn: 604800,
    userInfo: {
        userId: '507f1f77bcf86cd799439011',
        emailAddress: 'user@example.com',
        fullName: '김입양',
        userRole: 'adopter',
        accountStatus: 'active',
        profileImageUrl: null,
    },
    message: '로그인이 완료되었습니다.',
};