import { INestApplication, Logger, ValidationPipe, HttpStatus, HttpException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';

import { CustomLoggerService } from './common/logger/custom-logger.service';
import { HttpStatusInterceptor } from './common/interceptor/http-status.interceptor';
import { AppModule } from './app.module';

declare const module: any;

/**
 * Pawpong Backend 애플리케이션 부트스트랩
 * NestJS 서버를 초기화하고 필요한 미들웨어와 설정을 적용합니다.
 */
async function bootstrap(): Promise<void> {
    // NestJS 앱 생성 (커스텀 로거 준비 전까지 로그 버퍼링)
    const app: INestApplication = await NestFactory.create(AppModule, {
        bufferLogs: true,
        abortOnError: false,
    });

    // 커스텀 Winston 로거 적용
    app.useLogger(app.get(CustomLoggerService));
    const logger = new Logger('Bootstrap');

    // Express 앱 인스턴스 가져오기
    const expressApp = app.getHttpAdapter().getInstance();

    // 쿠키 파서 미들웨어 적용
    app.use(cookieParser());

    // HTTP 연결 최적화 설정
    expressApp.set('trust proxy', true);
    expressApp.set('etag', false); // ETag 비활성화로 캐싱 문제 완화

    // 모든 응답에 연결 유지 헤더 추가
    app.use((req, res, next) => {
        res.setHeader('Alt-Svc', ''); // HTTP/3 광고 비활성화
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Keep-Alive', 'timeout=60');
        next();
    });

    // Global Validation Pipe 설정
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            transformOptions: { enableImplicitConversion: true },
            whitelist: true, // DTO에 정의되지 않은 속성 제거
            forbidNonWhitelisted: false,
            forbidUnknownValues: true,
        }),
    );

    // HTTP 상태 코드 통일 인터셉터 적용
    app.useGlobalInterceptors(new HttpStatusInterceptor());

    // CORS 설정
    app.enableCors({
        origin: [
            // 개발 환경
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:3002',
            // Pawpong 프론트엔드 (추후 도메인 설정)
            'https://pawpong.co.kr',
            'https://www.pawpong.co.kr',
            'https://admin.pawpong.co.kr',
        ],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie'],
        exposedHeaders: ['Authorization', 'Content-Disposition', 'Set-Cookie'],
        credentials: true,
        maxAge: 3600,
    });

    // 업로드 폴더를 정적 파일로 제공
    const uploadsPath = path.join(process.cwd(), 'uploads');
    app.use(
        '/uploads',
        express.static(uploadsPath, {
            setHeaders: (res, filePath) => {
                if (filePath.endsWith('.webp')) {
                    res.setHeader('Content-Type', 'image/webp');
                } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
                    res.setHeader('Content-Type', 'image/jpeg');
                } else if (filePath.endsWith('.png')) {
                    res.setHeader('Content-Type', 'image/png');
                }
            },
        }),
    );

    // 글로벌 'api' 프리픽스 설정
    app.setGlobalPrefix('api');

    // Swagger 설정
    const config: Omit<OpenAPIObject, 'paths'> = new DocumentBuilder()
        .setTitle('Pawpong Backend API')
        .setDescription('반려동물 입양 플랫폼 백엔드 API 문서')
        .setVersion('1.0')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'JWT 토큰 인증 (입양자, 브리더, 관리자)',
            },
            'JWT-Auth',
        )
        .build();

    const document: OpenAPIObject = SwaggerModule.createDocument(app, config, {
        operationIdFactory: (_controllerKey: string, methodKey: string) => methodKey,
    });
    
    SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true, // 인증 정보 유지
            tryItOutEnabled: true, // API 테스트 기능 활성화
            filter: true, // API 검색 기능 활성화
            displayOperationId: true, // Operation ID 표시
        },
        customCss: '.swagger-ui .topbar { display: none }', // 탑바 숨김
        customSiteTitle: 'Pawpong API Documentation',
    });
    
    // ConfigService 주입
    const configService: ConfigService = app.get(ConfigService);

    // 프로덕션 환경 체크
    const isProduction = process.env.NODE_ENV === 'production';
    
    // 개발 환경에서 Swagger JSON 파일 저장
    if (!isProduction) {
        const fs = require('fs');
        const path = require('path');
        const swaggerPath = path.join(process.cwd(), 'swagger.json');
        fs.writeFileSync(swaggerPath, JSON.stringify(document, null, 2));
        logger.log(`[bootstrap] Swagger JSON saved to: ${swaggerPath}`);
    }

    // Express Request Body 크기 제한 설정
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));

    // 포트 설정
    const port: number = configService.get<number>('PORT') || 8082;

    // Graceful shutdown 설정
    app.enableShutdownHooks();

    let isShuttingDown = false;

    // 서버 시작
    const server = await app.listen(port);

    // 시작 로그
    logger.log(`[bootstrap] Pawpong Backend Server running on: http://localhost:${port}`);
    logger.log(`[bootstrap] API Documentation available at: http://localhost:${port}/api/docs`);
    logger.log(`[bootstrap] Health check endpoint: http://localhost:${port}/api/health`);
    logger.log(`[bootstrap] Health check endpoint: http://localhost:${port}/api/health`);
    logger.log(`[bootstrap] Static files served from: http://localhost:${port}/uploads/`);
    logger.log(`[bootstrap] Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.log(`[bootstrap] Environment: ${process.env.NODE_ENV || 'development'}`);

    // PM2 프로세스 매니저에게 준비 완료 알림
    if (process.send) {
        logger.log('[bootstrap] Sending ready signal to PM2');
        process.send('ready');
    }

    // SIGTERM 시그널 처리 (Graceful Shutdown)
    process.on('SIGTERM', async () => {
        if (isShuttingDown) return;
        isShuttingDown = true;

        logger.warn('[bootstrap] Received SIGTERM signal. Starting graceful shutdown...');

        server.close(() => {
            logger.log('[bootstrap] Server closed gracefully. Process will now exit.');
            process.exit(0);
        });

        // 10초 후에도 종료되지 않으면 강제 종료
        setTimeout(() => {
            logger.error('[bootstrap] Could not close connections in time, forcing shutdown');
            process.exit(1);
        }, 10000);
    });

    // SIGINT 시그널 처리 (Ctrl+C)
    process.on('SIGINT', async () => {
        if (isShuttingDown) return;
        isShuttingDown = true;

        logger.warn('[bootstrap] Received SIGINT signal. Starting graceful shutdown...');

        server.close(() => {
            logger.log('[bootstrap] Server closed gracefully. Process will now exit.');
            process.exit(0);
        });

        // 10초 후에도 종료되지 않으면 강제 종료
        setTimeout(() => {
            logger.error('[bootstrap] Could not close connections in time, forcing shutdown');
            process.exit(1);
        }, 10000);
    });

    // Hot Module Replacement (HMR) 설정 - 개발 환경에서만
    if (module.hot) {
        logger.log('[bootstrap] Hot Module Replacement enabled');
        module.hot.accept();
        module.hot.dispose(() => app.close());
    }

    // 개발 환경 추가 로그
    if (!isProduction) {
        logger.debug('[bootstrap] Debug logging enabled for development');
        logger.log('[bootstrap] ValidationPipe and global filters are active');
    }
}

// 부트스트랩 실행 및 에러 처리
bootstrap().catch((err) => {
    const fallbackLogger = new Logger('BootstrapError');
    fallbackLogger.error('[bootstrap] Failed to start Pawpong Backend:', err.stack || err.message, err);
    process.exit(1);
});
