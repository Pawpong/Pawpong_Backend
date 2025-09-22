module.exports = {
    apps: [
        {
            // 애플리케이션 설정
            name: 'pawpong-backend',
            script: 'dist/main.js',
            
            // 4GB RAM 서버 최적화 설정
            instances: 2, // 4GB RAM에서는 2개 인스턴스가 적절
            exec_mode: 'cluster', // 클러스터 모드로 실행
            
            // 메모리 제한 (인스턴스당 1.5GB, 시스템용 1GB 확보)
            max_memory_restart: '1500M',
            
            // Node.js 메모리 최적화
            node_args: '--max-old-space-size=1400',
            
            // 환경 변수
            env: {
                NODE_ENV: 'production',
                PORT: 8082,
            },
            env_development: {
                NODE_ENV: 'development',
                PORT: 8082,
            },
            env_staging: {
                NODE_ENV: 'staging',
                PORT: 8082,
            },
            
            // 자동 재시작 설정
            watch: false, // 프로덕션에서는 watch 비활성화
            ignore_watch: [
                'node_modules',
                'logs',
                '.git',
                '*.log',
                'uploads',
                'temp'
            ],
            
            // 로그 설정
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            error_file: './logs/pm2/error.log',
            out_file: './logs/pm2/out.log',
            merge_logs: true,
            
            // 재시작 정책
            autorestart: true,
            max_restarts: 10,
            min_uptime: '10s',
            
            // 그레이스풀 재시작 설정
            kill_timeout: 5000,
            wait_ready: true,
            listen_timeout: 3000,
            
            // 크론 재시작 (매일 새벽 3시)
            cron_restart: '0 3 * * *',
            
            // 추가 설정
            time: true,
            combine_logs: true,
        }
    ],
    
    // 배포 설정
    deploy: {
        production: {
            user: 'deploy',
            host: 'your-server-ip',
            ref: 'origin/main',
            repo: 'git@github.com:your-username/pawpong.git',
            path: '/home/deploy/pawpong',
            'pre-deploy-local': '',
            'post-deploy': 'yarn install && yarn build && pm2 reload ecosystem.config.js --env production',
            'pre-setup': ''
        },
        staging: {
            user: 'deploy',
            host: 'your-staging-server-ip',
            ref: 'origin/develop',
            repo: 'git@github.com:your-username/pawpong.git',
            path: '/home/deploy/pawpong-staging',
            'post-deploy': 'yarn install && yarn build && pm2 reload ecosystem.config.js --env staging',
        }
    }
};