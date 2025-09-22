/**
 * PM2 Production Configuration for 4GB RAM Server
 * 최적화된 설정으로 안정적인 서비스 운영을 보장합니다.
 */

module.exports = {
    apps: [
        {
            // 기본 설정
            name: 'pawpong-api',
            script: './dist/main.js',
            
            // 클러스터 설정 (4GB RAM 최적화)
            instances: 2,
            exec_mode: 'cluster',
            
            // 메모리 관리
            max_memory_restart: '1400M',
            node_args: [
                '--max-old-space-size=1300',
                '--optimize_for_size',
                '--gc_interval=100',
                '--max-semi-space-size=128'
            ].join(' '),
            
            // 환경 변수 설정
            env_production: {
                NODE_ENV: 'production',
                PORT: 8082,
                
                // MongoDB 연결
                MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/pawpong',
                MONGODB_MAX_POOL_SIZE: 10,
                MONGODB_MIN_POOL_SIZE: 2,
                
                // JWT 설정
                JWT_SECRET: process.env.JWT_SECRET,
                JWT_EXPIRATION: '1h',
                JWT_REFRESH_EXPIRATION: '7d',
                
                // 로그 레벨
                LOG_LEVEL: 'info',
                
                // 성능 모니터링
                ENABLE_MONITORING: true,
                MONITORING_INTERVAL: 60000, // 1분
                
                // API Rate Limiting
                RATE_LIMIT_WINDOW: 900000, // 15분
                RATE_LIMIT_MAX_REQUESTS: 100,
                
                // 파일 업로드
                MAX_FILE_SIZE: 10485760, // 10MB
                UPLOAD_PATH: './uploads',
                
                // CORS
                CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
                
                // 캐시 설정
                CACHE_TTL: 300, // 5분
                
                // 헬스체크
                HEALTH_CHECK_INTERVAL: 30000, // 30초
            },
            
            // 로그 설정
            log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS Z',
            log_file: './logs/pm2/combined.log',
            error_file: './logs/pm2/error.log',
            out_file: './logs/pm2/out.log',
            pid_file: './logs/pm2/pawpong.pid',
            merge_logs: true,
            log_type: 'json',
            
            // 재시작 정책
            autorestart: true,
            max_restarts: 10,
            min_uptime: '20s',
            restart_delay: 4000,
            
            // 그레이스풀 셧다운
            kill_timeout: 10000,
            shutdown_with_message: true,
            wait_ready: true,
            listen_timeout: 5000,
            
            // 모니터링
            instance_var: 'INSTANCE_ID',
            monitoring: true,
            
            // 크론 재시작 (매일 새벽 4시 - 트래픽이 가장 적은 시간)
            cron_restart: '0 4 * * *',
            
            // 시그널 처리
            stop_exit_codes: [0],
            
            // 추가 옵션
            time: true,
            combine_logs: true,
            vizion: false, // git 메타데이터 비활성화 (성능 향상)
        },
        
        // 모니터링 워커 (선택사항)
        {
            name: 'pawpong-monitor',
            script: './scripts/health-monitor.js',
            instances: 1,
            exec_mode: 'fork',
            max_memory_restart: '200M',
            
            env_production: {
                NODE_ENV: 'production',
                API_URL: 'http://localhost:8082',
                CHECK_INTERVAL: 30000, // 30초마다 체크
                ALERT_WEBHOOK: process.env.ALERT_WEBHOOK_URL,
            },
            
            autorestart: true,
            watch: false,
            log_file: './logs/pm2/monitor.log',
            error_file: './logs/pm2/monitor-error.log',
        }
    ],
    
    // 배포 설정
    deploy: {
        production: {
            user: 'deploy',
            host: process.env.PRODUCTION_HOST,
            key: '~/.ssh/id_rsa',
            ref: 'origin/main',
            repo: 'git@github.com:your-username/pawpong.git',
            path: '/home/deploy/pawpong',
            ssh_options: ['ForwardAgent=yes'],
            
            // 배포 전 로컬에서 실행
            'pre-deploy-local': 'echo "Starting deployment to production"',
            
            // 배포 전 원격에서 실행
            'pre-setup': [
                'mkdir -p /home/deploy/pawpong',
                'mkdir -p /home/deploy/pawpong/shared/logs',
                'mkdir -p /home/deploy/pawpong/shared/uploads',
            ].join(' && '),
            
            // 배포 후 실행
            'post-deploy': [
                'yarn install --production',
                'yarn build',
                'pm2 reload ecosystem.production.config.js --env production',
                'pm2 save',
            ].join(' && '),
            
            // 환경 변수
            env: {
                NODE_ENV: 'production',
            }
        },
        
        staging: {
            user: 'deploy',
            host: process.env.STAGING_HOST,
            ref: 'origin/develop',
            repo: 'git@github.com:your-username/pawpong.git',
            path: '/home/deploy/pawpong-staging',
            
            'post-deploy': [
                'yarn install',
                'yarn build',
                'pm2 reload ecosystem.production.config.js --env staging',
            ].join(' && '),
            
            env: {
                NODE_ENV: 'staging',
            }
        }
    }
};