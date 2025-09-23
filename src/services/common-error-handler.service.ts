/**
 * 통합 에러 핸들링 시스템
 *
 * Steps 2-4의 공통 에러 처리 패턴을 제공합니다.
 * - 표준화된 에러 클래스
 * - 일관된 폴백 메커니즘
 * - 통합 로깅 및 보고
 * - 우아한 성능 저하 지원
 */

// =============================================================================
// 기본 에러 클래스들
// =============================================================================

/** 모든 Step 에러의 기본 클래스 */
export abstract class StepError extends Error {
  constructor(
    public readonly stepName: string,
    message: string,
    public readonly cause?: Error,
    public readonly code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

/** 생성 실패 에러 */
export class GenerationError extends StepError {
  constructor(stepName: string, message: string, cause?: Error, code?: string) {
    super(stepName, message, cause, code);
  }
}

/** 검증 실패 에러 */
export class ValidationError extends StepError {
  constructor(
    stepName: string,
    message: string,
    public readonly field: string,
    public readonly value: any
  ) {
    super(stepName, message);
  }
}

/** 파싱 실패 에러 */
export class ParsingError extends StepError {
  constructor(stepName: string, message: string, cause?: Error) {
    super(stepName, message, cause);
  }
}

/** API 호출 실패 에러 */
export class ApiError extends StepError {
  constructor(stepName: string, message: string, cause?: Error, public readonly statusCode?: number) {
    super(stepName, message, cause);
  }
}

// =============================================================================
// 에러 핸들링 전략 타입
// =============================================================================

export type ErrorHandlingStrategy = 'throw' | 'fallback' | 'retry';

export interface ErrorHandlingOptions {
  strategy: ErrorHandlingStrategy;
  maxRetries?: number;
  retryDelay?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export interface FallbackProvider<T> {
  createFallback(...args: any[]): T;
}

// =============================================================================
// 통합 에러 핸들러 클래스
// =============================================================================

export class CommonErrorHandler {
  private static instance: CommonErrorHandler | null = null;

  static getInstance(): CommonErrorHandler {
    if (!CommonErrorHandler.instance) {
      CommonErrorHandler.instance = new CommonErrorHandler();
    }
    return CommonErrorHandler.instance;
  }

  /**
   * 통합 에러 처리 메서드
   */
  async handleError<T>(
    stepName: string,
    operation: () => Promise<T>,
    fallbackProvider: FallbackProvider<T>,
    options: ErrorHandlingOptions = { strategy: 'fallback', logLevel: 'error' }
  ): Promise<T> {
    const { strategy, maxRetries = 3, retryDelay = 1000, logLevel = 'error' } = options;

    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt <= (strategy === 'retry' ? maxRetries : 0)) {
      try {
        console.log(`🔄 ${stepName}: 시도 ${attempt + 1}/${maxRetries + 1}`);
        const result = await operation();

        if (attempt > 0) {
          console.log(`✅ ${stepName}: 재시도 성공 (${attempt + 1}번째 시도)`);
        }

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attempt++;

        this.logError(stepName, lastError, logLevel);

        if (strategy === 'retry' && attempt <= maxRetries) {
          console.log(`⏳ ${stepName}: ${retryDelay}ms 후 재시도...`);
          await this.delay(retryDelay);
          continue;
        }

        break;
      }
    }

    // 에러 처리 전략에 따른 처리
    switch (strategy) {
      case 'throw':
        throw this.wrapError(stepName, lastError!);

      case 'fallback':
      case 'retry':
        console.log(`🔄 ${stepName}: 폴백 결과 적용`);
        return fallbackProvider.createFallback();

      default:
        throw this.wrapError(stepName, lastError!);
    }
  }

  /**
   * 동기 작업용 에러 처리
   */
  handleSyncError<T>(
    stepName: string,
    operation: () => T,
    fallbackProvider: FallbackProvider<T>,
    options: ErrorHandlingOptions = { strategy: 'fallback', logLevel: 'error' }
  ): T {
    try {
      return operation();
    } catch (error) {
      const wrappedError = error instanceof Error ? error : new Error(String(error));
      this.logError(stepName, wrappedError, options.logLevel || 'error');

      if (options.strategy === 'throw') {
        throw this.wrapError(stepName, wrappedError);
      }

      console.log(`🔄 ${stepName}: 폴백 결과 적용`);
      return fallbackProvider.createFallback();
    }
  }

  /**
   * 입력 검증 헬퍼
   */
  validateInput(stepName: string, field: string, value: any, validator: (value: any) => boolean): void {
    if (!validator(value)) {
      throw new ValidationError(stepName, `필수 입력값이 유효하지 않습니다: ${field}`, field, value);
    }
  }

  /**
   * API 응답 검증 헬퍼
   */
  validateApiResponse(stepName: string, response: any): void {
    if (!response) {
      throw new ApiError(stepName, '응답이 비어있습니다');
    }

    if (!response.content) {
      throw new ApiError(stepName, '응답 내용이 없습니다');
    }
  }

  /**
   * JSON 파싱 헬퍼
   */
  parseJsonSafely<T>(stepName: string, jsonString: string): T {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      throw new ParsingError(stepName, 'JSON 파싱 실패', error instanceof Error ? error : new Error(String(error)));
    }
  }

  // =============================================================================
  // Private 헬퍼 메서드들
  // =============================================================================

  private wrapError(stepName: string, error: Error): StepError {
    if (error instanceof StepError) {
      return error;
    }

    // 에러 타입에 따른 래핑
    if (error.message.includes('JSON') || error.message.includes('parse')) {
      return new ParsingError(stepName, error.message, error);
    }

    if (error.message.includes('API') || error.message.includes('network')) {
      return new ApiError(stepName, error.message, error);
    }

    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return new ValidationError(stepName, error.message, 'unknown', null);
    }

    return new GenerationError(stepName, error.message, error);
  }

  private logError(stepName: string, error: Error, level: string = 'error'): void {
    const emoji = this.getLogEmoji(level);
    const message = `${emoji} ${stepName} 에러: ${error.message}`;

    switch (level) {
      case 'debug':
        console.debug(message, error);
        break;
      case 'info':
        console.info(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      case 'error':
      default:
        console.error(message, error);
        break;
    }
  }

  private getLogEmoji(level: string): string {
    switch (level) {
      case 'debug': return '🐛';
      case 'info': return 'ℹ️';
      case 'warn': return '⚠️';
      case 'error': default: return '❌';
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// =============================================================================
// 편의 함수들
// =============================================================================

/** 공통 에러 핸들러 인스턴스 */
export const errorHandler = CommonErrorHandler.getInstance();

/** Step별 전용 에러 핸들러 팩토리 */
export function createStepErrorHandler(stepName: string) {
  return {
    async handle<T>(
      operation: () => Promise<T>,
      fallbackProvider: FallbackProvider<T>,
      options?: ErrorHandlingOptions
    ): Promise<T> {
      return errorHandler.handleError(stepName, operation, fallbackProvider, options);
    },

    handleSync<T>(
      operation: () => T,
      fallbackProvider: FallbackProvider<T>,
      options?: ErrorHandlingOptions
    ): T {
      return errorHandler.handleSyncError(stepName, operation, fallbackProvider, options);
    },

    validateInput(field: string, value: any, validator: (value: any) => boolean): void {
      return errorHandler.validateInput(stepName, field, value, validator);
    },

    validateApiResponse(response: any): void {
      return errorHandler.validateApiResponse(stepName, response);
    },

    parseJson<T>(jsonString: string): T {
      return errorHandler.parseJsonSafely<T>(stepName, jsonString);
    }
  };
}