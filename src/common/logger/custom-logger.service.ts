import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

/**
 * 커스텀 로거 서비스
 * Winston을 기반으로 한 통일된 로깅 인터페이스를 제공합니다.
 * 모든 로그는 [메서드명] 설명: 결과 형식을 따릅니다.
 */
@Injectable()
export class CustomLoggerService implements LoggerService {
    constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}

    /**
     * 정보 레벨 로그를 출력합니다.
     * @param message 로그 메시지
     * @param context 컨텍스트 (클래스명 또는 모듈명)
     */
    log(message: string, context?: string) {
        this.logger.info(message, { context });
    }

    /**
     * 에러 레벨 로그를 출력합니다.
     * @param message 에러 메시지
     * @param trace 스택 트레이스
     * @param context 컨텍스트
     */
    error(message: string, trace?: string, context?: string) {
        this.logger.error(message, { context, stack: trace });
    }

    /**
     * 경고 레벨 로그를 출력합니다.
     * @param message 경고 메시지
     * @param context 컨텍스트
     */
    warn(message: string, context?: string) {
        this.logger.warn(message, { context });
    }

    /**
     * 디버그 레벨 로그를 출력합니다.
     * @param message 디버그 메시지
     * @param context 컨텍스트
     */
    debug(message: string, context?: string) {
        this.logger.debug(message, { context });
    }

    /**
     * Verbose 레벨 로그를 출력합니다.
     * @param message verbose 메시지
     * @param context 컨텍스트
     */
    verbose(message: string, context?: string) {
        this.logger.verbose(message, { context });
    }

    /**
     * 성공적인 작업 완료를 로그합니다.
     * @param methodName 메서드명
     * @param description 작업 설명
     * @param result 결과값
     * @param context 컨텍스트
     */
    logSuccess(methodName: string, description: string, result?: any, context?: string) {
        const resultText = result ? ` 결과: ${JSON.stringify(result)}` : '';
        this.log(`[${methodName}] ${description}:${resultText}`, context);
    }

    /**
     * 에러를 로그합니다.
     * @param methodName 메서드명
     * @param description 작업 설명
     * @param error 에러 객체
     * @param context 컨텍스트
     */
    logError(methodName: string, description: string, error: any, context?: string) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : undefined;
        this.error(`[${methodName}] ${description}: 에러 - ${errorMessage}`, stack, context);
    }

    /**
     * 작업 시작을 로그합니다.
     * @param methodName 메서드명
     * @param description 작업 설명
     * @param params 입력 파라미터
     * @param context 컨텍스트
     */
    logStart(methodName: string, description: string, params?: any, context?: string) {
        const paramsText = params ? ` 파라미터: ${JSON.stringify(params)}` : '';
        this.debug(`[${methodName}] ${description} 시작${paramsText}`, context);
    }

    /**
     * 비즈니스 로직 경고를 로그합니다.
     * @param methodName 메서드명
     * @param description 경고 설명
     * @param details 상세 정보
     * @param context 컨텍스트
     */
    logWarning(methodName: string, description: string, details?: any, context?: string) {
        const detailsText = details ? ` 상세: ${JSON.stringify(details)}` : '';
        this.warn(`[${methodName}] ${description}${detailsText}`, context);
    }

    /**
     * 데이터베이스 작업을 로그합니다.
     * @param methodName 메서드명
     * @param operation DB 작업 유형 (create, read, update, delete)
     * @param collection 컬렉션명
     * @param result 작업 결과
     * @param context 컨텍스트
     */
    logDbOperation(methodName: string, operation: string, collection: string, result?: any, context?: string) {
        const resultText = result ? ` 결과: ${typeof result === 'object' ? JSON.stringify(result) : result}` : '';
        this.debug(`[${methodName}] DB ${operation.toUpperCase()} 작업 - ${collection}${resultText}`, context);
    }

    /**
     * API 요청을 로그합니다.
     * @param methodName 메서드명 (API 엔드포인트)
     * @param userId 사용자 ID
     * @param userRole 사용자 역할
     * @param requestData 요청 데이터
     * @param context 컨텍스트
     */
    logApiRequest(methodName: string, userId: string, userRole: string, requestData?: any, context?: string) {
        const dataText = requestData ? ` 요청데이터: ${JSON.stringify(requestData)}` : '';
        this.log(`[${methodName}] API 요청 - 사용자ID: ${userId}, 역할: ${userRole}${dataText}`, context);
    }

    /**
     * 인증 관련 작업을 로그합니다.
     * @param methodName 메서드명
     * @param action 인증 작업 (login, logout, register, etc.)
     * @param email 사용자 이메일
     * @param success 성공 여부
     * @param context 컨텍스트
     */
    logAuth(methodName: string, action: string, email: string, success: boolean, context?: string) {
        const status = success ? '성공' : '실패';
        this.log(`[${methodName}] 인증 ${action} - 이메일: ${email}, 결과: ${status}`, context);
    }
}
