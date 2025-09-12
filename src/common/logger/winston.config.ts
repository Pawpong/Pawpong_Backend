import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston/dist/winston.utilities';

/**
 * Winston 로거 설정
 * 개발 환경과 프로덕션 환경에 따라 다른 로그 레벨과 출력 방식을 적용합니다.
 */
const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

/**
 * 커스텀 로그 포맷
 * [메서드명] 설명: 결과 형식으로 로그를 출력합니다.
 */
const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, context, stack }) => {
        const logContext = context ? `[${context}]` : '';
        const logMessage = stack ? `${message}\n${stack}` : message;
        return `${timestamp} [${level.toUpperCase()}] ${logContext} ${logMessage}`;
    }),
);

/**
 * Winston 모듈 옵션 설정
 */
export const winstonConfig: WinstonModuleOptions = {
    level: logLevel,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
    ),
    defaultMeta: { service: 'pawpong-backend' },
    transports: [
        // 콘솔 출력 (개발 환경)
        new winston.transports.Console({
            level: logLevel,
            format: winston.format.combine(
                winston.format.colorize({ all: true }),
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                nestWinstonModuleUtilities.format.nestLike('Pawpong', {
                    prettyPrint: true,
                    colors: true,
                }),
            ),
        }),

        // 에러 로그 파일
        new winston.transports.File({
            level: 'error',
            filename: 'logs/error.log',
            format: customFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),

        // 전체 로그 파일
        new winston.transports.File({
            filename: 'logs/combined.log',
            format: customFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 10,
        }),

        // 개발 환경에서 디버그 로그 파일
        ...(process.env.NODE_ENV === 'development'
            ? [
                  new winston.transports.File({
                      level: 'debug',
                      filename: 'logs/debug.log',
                      format: customFormat,
                      maxsize: 5242880, // 5MB
                      maxFiles: 3,
                  }),
              ]
            : []),
    ],
    // 예외와 rejection 처리
    exceptionHandlers: [
        new winston.transports.File({
            filename: 'logs/exceptions.log',
            format: customFormat,
        }),
    ],
    rejectionHandlers: [
        new winston.transports.File({
            filename: 'logs/rejections.log',
            format: customFormat,
        }),
    ],
};
