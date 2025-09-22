#!/bin/bash

# PM2 시작 스크립트
# 4GB RAM 서버에 최적화된 설정

echo "========================================="
echo "Pawpong Backend PM2 Startup Script"
echo "========================================="

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 환경 확인
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: ./pm2-startup.sh [production|staging|development]${NC}"
    exit 1
fi

ENV=$1
CONFIG_FILE=""

# 환경별 설정 파일 선택
case $ENV in
    production)
        CONFIG_FILE="ecosystem.production.config.js"
        ;;
    staging)
        CONFIG_FILE="ecosystem.production.config.js"
        ;;
    development)
        CONFIG_FILE="ecosystem.config.js"
        ;;
    *)
        echo -e "${RED}Invalid environment: $ENV${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}Starting Pawpong Backend in $ENV mode...${NC}"

# 로그 디렉토리 생성
echo "Creating log directories..."
mkdir -p logs/pm2
mkdir -p logs/app
mkdir -p uploads
mkdir -p temp

# 기존 PM2 프로세스 종료
echo "Stopping existing PM2 processes..."
pm2 delete pawpong-api 2>/dev/null || true
pm2 delete pawpong-monitor 2>/dev/null || true

# 빌드 확인
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}Build directory not found. Building application...${NC}"
    yarn build
fi

# PM2 시작
echo "Starting PM2 with $CONFIG_FILE..."
pm2 start $CONFIG_FILE --env $ENV

# PM2 상태 확인
sleep 3
echo ""
echo "PM2 Process Status:"
pm2 status

# 로그 모니터링 옵션
echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}PM2 Started Successfully!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Useful commands:"
echo "  pm2 status              - Check process status"
echo "  pm2 logs                - View logs"
echo "  pm2 monit               - Real-time monitoring"
echo "  pm2 restart pawpong-api - Restart application"
echo "  pm2 reload pawpong-api  - Graceful reload"
echo "  pm2 stop pawpong-api    - Stop application"
echo ""
echo "Log files location:"
echo "  Application logs: ./logs/app/"
echo "  PM2 logs: ./logs/pm2/"
echo ""

# 시스템 리소스 체크
echo "System Resources:"
free -h | grep -E "^Mem|^Swap"
echo ""
df -h | grep -E "^Filesystem|/$"

# 자동 시작 설정 안내
echo ""
echo -e "${YELLOW}To enable auto-start on system boot:${NC}"
echo "  pm2 startup"
echo "  pm2 save"
echo ""

exit 0