/**
 * PM2 Health Monitor
 * API 헬스체크 및 알림 서비스
 */

const http = require('http');
const https = require('https');

// 환경 변수
const API_URL = process.env.API_URL || 'http://localhost:8082';
const CHECK_INTERVAL = parseInt(process.env.CHECK_INTERVAL) || 30000; // 30초
const ALERT_WEBHOOK = process.env.ALERT_WEBHOOK;

// 헬스체크 통계
const stats = {
    totalChecks: 0,
    successfulChecks: 0,
    failedChecks: 0,
    lastCheckTime: null,
    lastFailTime: null,
    consecutiveFailures: 0,
    startTime: Date.now(),
};

/**
 * 헬스체크 수행
 */
async function performHealthCheck() {
    const url = `${API_URL}/api/health`;
    const startTime = Date.now();
    
    return new Promise((resolve) => {
        const protocol = url.startsWith('https') ? https : http;
        
        const req = protocol.get(url, { timeout: 5000 }, (res) => {
            let data = '';
            
            res.on('data', chunk => {
                data += chunk;
            });
            
            res.on('end', () => {
                const responseTime = Date.now() - startTime;
                
                try {
                    const json = JSON.parse(data);
                    
                    if (res.statusCode === 200 && json.success) {
                        resolve({
                            success: true,
                            statusCode: res.statusCode,
                            responseTime,
                            data: json.item,
                        });
                    } else {
                        resolve({
                            success: false,
                            statusCode: res.statusCode,
                            responseTime,
                            error: 'Invalid response',
                        });
                    }
                } catch (error) {
                    resolve({
                        success: false,
                        statusCode: res.statusCode,
                        responseTime,
                        error: error.message,
                    });
                }
            });
        });
        
        req.on('error', (error) => {
            resolve({
                success: false,
                responseTime: Date.now() - startTime,
                error: error.message,
            });
        });
        
        req.on('timeout', () => {
            req.destroy();
            resolve({
                success: false,
                responseTime: Date.now() - startTime,
                error: 'Request timeout',
            });
        });
    });
}

/**
 * 알림 전송
 */
async function sendAlert(message, level = 'warning') {
    if (!ALERT_WEBHOOK) {
        console.error('Alert webhook not configured');
        return;
    }
    
    // Slack, Discord, 또는 커스텀 웹훅으로 알림 전송
    const alertData = {
        text: message,
        level,
        timestamp: new Date().toISOString(),
        service: 'Pawpong Backend',
        stats: {
            uptime: Math.floor((Date.now() - stats.startTime) / 1000),
            successRate: stats.totalChecks > 0 
                ? ((stats.successfulChecks / stats.totalChecks) * 100).toFixed(2) + '%'
                : '0%',
            consecutiveFailures: stats.consecutiveFailures,
        },
    };
    
    // 웹훅 전송 로직
    console.log('Alert:', alertData);
}

/**
 * 메인 모니터링 루프
 */
async function monitorHealth() {
    console.log('Starting health monitor...');
    console.log(`Monitoring: ${API_URL}`);
    console.log(`Check interval: ${CHECK_INTERVAL}ms`);
    
    setInterval(async () => {
        const result = await performHealthCheck();
        stats.totalChecks++;
        stats.lastCheckTime = new Date().toISOString();
        
        if (result.success) {
            stats.successfulChecks++;
            
            // 이전에 실패했다가 복구된 경우
            if (stats.consecutiveFailures > 0) {
                await sendAlert(
                    `✅ Service recovered after ${stats.consecutiveFailures} failures\nResponse time: ${result.responseTime}ms`,
                    'info'
                );
            }
            
            stats.consecutiveFailures = 0;
            
            // 응답 시간이 느린 경우 경고
            if (result.responseTime > 3000) {
                console.warn(`Slow response: ${result.responseTime}ms`);
            } else {
                console.log(`✓ Health check passed (${result.responseTime}ms)`);
            }
        } else {
            stats.failedChecks++;
            stats.consecutiveFailures++;
            stats.lastFailTime = new Date().toISOString();
            
            console.error(`✗ Health check failed: ${result.error}`);
            
            // 연속 실패 횟수에 따른 알림
            if (stats.consecutiveFailures === 1) {
                // 첫 번째 실패 - 경고
                await sendAlert(
                    `⚠️ Health check failed\nError: ${result.error}`,
                    'warning'
                );
            } else if (stats.consecutiveFailures === 3) {
                // 3회 연속 실패 - 심각
                await sendAlert(
                    `🚨 Service down! ${stats.consecutiveFailures} consecutive failures\nError: ${result.error}`,
                    'critical'
                );
            } else if (stats.consecutiveFailures === 10) {
                // 10회 연속 실패 - 긴급
                await sendAlert(
                    `🆘 Service critically down! ${stats.consecutiveFailures} consecutive failures\nLast success: ${stats.lastCheckTime}`,
                    'emergency'
                );
            }
        }
        
        // 1시간마다 통계 로그
        if (stats.totalChecks % 120 === 0) { // 30초 * 120 = 1시간
            console.log('=== Health Monitor Statistics ===');
            console.log(`Total checks: ${stats.totalChecks}`);
            console.log(`Successful: ${stats.successfulChecks}`);
            console.log(`Failed: ${stats.failedChecks}`);
            console.log(`Success rate: ${((stats.successfulChecks / stats.totalChecks) * 100).toFixed(2)}%`);
            console.log(`Uptime: ${Math.floor((Date.now() - stats.startTime) / 1000 / 60)} minutes`);
            console.log('================================');
        }
    }, CHECK_INTERVAL);
}

/**
 * 메모리 사용량 모니터링
 */
function monitorMemory() {
    setInterval(() => {
        const used = process.memoryUsage();
        const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
        const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
        const rssMB = Math.round(used.rss / 1024 / 1024);
        
        if (heapUsedMB > 150) { // 150MB 이상 사용시 경고
            console.warn(`High memory usage: Heap ${heapUsedMB}MB / RSS ${rssMB}MB`);
        }
    }, 60000); // 1분마다 체크
}

/**
 * 그레이스풀 셧다운
 */
process.on('SIGINT', async () => {
    console.log('\nShutting down health monitor...');
    console.log('Final statistics:');
    console.log(stats);
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, shutting down...');
    process.exit(0);
});

// 모니터링 시작
monitorHealth();
monitorMemory();

console.log('Health monitor started successfully');
console.log(`PID: ${process.pid}`);