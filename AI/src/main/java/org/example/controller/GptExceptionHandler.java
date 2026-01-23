package org.example.controller;

import lombok.extern.slf4j.Slf4j;
import org.example.dto.ChatResponse;
import org.example.exception.AzureSpeechException;
import org.example.exception.GptServiceException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletionException;
import java.util.concurrent.TimeoutException;

/**
 * 비동기 예외 처리 전담 클래스
 * - Controller를 가볍게 유지
 * - 재사용 가능
 */
@Component
@Slf4j
public class GptExceptionHandler {

    public ResponseEntity<ChatResponse> handle(Throwable ex, Long sequence) {
        // CompletionException 언래핑
        Throwable cause = (ex instanceof CompletionException) ? ex.getCause() : ex;

        // 1. 타임아웃
        if (cause instanceof TimeoutException) {
            log.error("[SEQ-{}] 타임아웃", sequence);
            return ResponseEntity.status(HttpStatus.REQUEST_TIMEOUT)
                    .body(ChatResponse.error(sequence, "TIMEOUT", "처리 시간 초과"));
        }

        // 2. GPT 오류
        if (cause instanceof GptServiceException) {
            GptServiceException gptEx = (GptServiceException) cause;
            log.error("[SEQ-{}] GPT 오류: {}", sequence, gptEx.getErrorCode());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(ChatResponse.error(sequence, gptEx.getErrorCode(), gptEx.getMessage()));
        }

        // 3. Azure 오류
        if (cause instanceof AzureSpeechException) {
            log.error("[SEQ-{}] Azure 오류", sequence);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(ChatResponse.error(sequence, "AZURE_ERROR", cause.getMessage()));
        }

        // 4. 기타 오류
        log.error("[SEQ-{}] 예기치 않은 오류", sequence, cause);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ChatResponse.error(sequence, "SERVER_ERROR", "서버 오류"));
    }
}
