package com.example.DuckDuck.domain.ai.controller;

import lombok.extern.slf4j.Slf4j;
import com.example.DuckDuck.domain.ai.exception.AzureSpeechException;
import com.example.DuckDuck.domain.ai.exception.GptServiceException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.CompletionException;
import java.util.concurrent.TimeoutException;

@Component
@Slf4j
public class GptExceptionHandler {

    public ResponseEntity<Map<String, String>> handle(Throwable ex) {
        Throwable cause = (ex instanceof CompletionException) ? ex.getCause() : ex;

        // 1. 타임아웃
        if (cause instanceof TimeoutException) {
            log.error("타임아웃 발생");
            return ResponseEntity.status(HttpStatus.REQUEST_TIMEOUT)
                    .body(Map.of(
                            "message", "처리 시간 초과",
                            "errorCode", "TIMEOUT"
                    ));
        }

        // 2. GPT 오류
        if (cause instanceof GptServiceException) {
            GptServiceException gptEx = (GptServiceException) cause;
            log.error("GPT 오류: {}", gptEx.getErrorCode());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of(
                            "message", gptEx.getMessage(),
                            "errorCode", gptEx.getErrorCode()
                    ));
        }

        // 3. Azure 오류
        if (cause instanceof AzureSpeechException) {
            log.error("Azure 오류", cause);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of(
                            "message", cause.getMessage(),
                            "errorCode", "AZURE_ERROR"
                    ));
        }

        // 4. 기타 오류
        log.error("예기치 않은 오류", cause);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                        "message", "서버 오류",
                        "errorCode", "SERVER_ERROR"
                ));
    }
}