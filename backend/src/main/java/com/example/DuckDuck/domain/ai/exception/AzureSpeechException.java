package com.example.DuckDuck.domain.ai.exception;

/**
 * Azure Speech 서비스 관련 예외
 */
public class AzureSpeechException extends RuntimeException {
    private final Integer failedScore;
    
    public AzureSpeechException(String message) {
        super(message);
        this.failedScore = null;
    }
    
    public AzureSpeechException(String message, Integer score) {
        super(message);
        this.failedScore = score;
    }
    
    public AzureSpeechException(String message, Throwable cause) {
        super(message, cause);
        this.failedScore = null;
    }
    
    public Integer getFailedScore() {
        return failedScore;
    }
}
