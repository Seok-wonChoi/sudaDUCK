/**
 * 에러 로깅 유틸리티
 * 프로덕션 환경에서는 Sentry 등의 서비스로 쉽게 교체 가능
 */

const isDevelopment = import.meta.env.MODE === 'development';

/**
 * 에러 로그 (심각한 에러)
 */
export const logError = (context, error, additionalInfo = {}) => {
  const errorLog = {
    level: 'error',
    context,
    message: error?.message || String(error),
    stack: error?.stack,
    timestamp: new Date().toISOString(),
    ...additionalInfo
  };

  // 개발 환경: 콘솔에 출력
  if (isDevelopment) {
    console.error(`[ERROR] ${context}:`, error, additionalInfo);
  }

  // 프로덕션 환경: Sentry 등으로 전송
  // if (window.Sentry) {
  //   window.Sentry.captureException(error, {
  //     tags: { context },
  //     extra: additionalInfo
  //   });
  // }

  return errorLog;
};

/**
 * 경고 로그 (무시 가능한 에러)
 */
export const logWarning = (context, message, additionalInfo = {}) => {
  const warningLog = {
    level: 'warning',
    context,
    message,
    timestamp: new Date().toISOString(),
    ...additionalInfo
  };

  // 개발 환경에서만 출력
  if (isDevelopment) {
    console.warn(`[WARN] ${context}:`, message, additionalInfo);
  }

  // 프로덕션 환경: 선택적으로 전송
  // if (window.Sentry) {
  //   window.Sentry.captureMessage(message, {
  //     level: 'warning',
  //     tags: { context },
  //     extra: additionalInfo
  //   });
  // }

  return warningLog;
};

/**
 * 정보 로그 (디버깅용)
 */
export const logInfo = (context, message, additionalInfo = {}) => {
  if (isDevelopment) {
    console.log(`[INFO] ${context}:`, message, additionalInfo);
  }
};
