/**
 * PM2 Production Configuration - Fork Mode with Auto Build
 *
 * 사용법:
 *   npm run build && pm2 start  - 빌드 후 시작
 *   pm2 restart pawpong-api     - 재시작
 *   pm2 logs pawpong-api        - 로그 확인
 *   pm2 stop pawpong-api        - 중지
 */

module.exports = {
    apps: [
        {
            // 기본 설정
            name: 'pawpong-api',
            script: './dist/main.js',

            // Fork 모드 (단일 프로세스)
            instances: 1,
            exec_mode: 'fork',

            // 메모리 관리
            max_memory_restart: '2G',
            node_args: '--max-old-space-size=2048',

            // 환경 변수 설정
            env_production: {
                NODE_ENV: 'production',
                PORT: 8080,

                // MongoDB 연결
                MONGODB_URI: process.env.MONGODB_URI,

                // JWT 설정
                JWT_SECRET: process.env.JWT_SECRET,
                JWT_EXPIRATION: '1h',
                JWT_REFRESH_EXPIRATION: '7d',

                // 로그 레벨
                LOG_LEVEL: 'info',
            },

            // 로그 설정
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            log_file: './logs/pm2/combined.log',
            error_file: './logs/pm2/error.log',
            out_file: './logs/pm2/out.log',
            merge_logs: true,

            // 재시작 정책
            autorestart: true,
            watch: false,
            max_restarts: 10,
            min_uptime: '10s',

            // 그레이스풀 셧다운
            kill_timeout: 5000,
            wait_ready: true,
            listen_timeout: 3000,

            // 환경변수 파일 로드
            env_file: '.env',
        }
    ],
};
