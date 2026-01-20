package org.example.exception;

/**
 * GPT 서비스 관련 예외
 */
public class GptServiceException extends RuntimeException {
    private final String errorCode;
    
    public GptServiceException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }
    
    public GptServiceException(String message, String errorCode, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
}
