package org.example.controller;

import lombok.extern.slf4j.Slf4j;
import org.example.exception.AzureSpeechException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletionException;
import java.util.concurrent.TimeoutException;

@Component
@Slf4j
public class SpeechExceptionHandler {

    public ResponseEntity<Map<String, Object>> handle(Throwable ex, Long sequence) {
        Throwable cause = (ex instanceof CompletionException) ? ex.getCause() : ex;

        if (cause instanceof TimeoutException) {
            log.error("[SEQ-{}] 발음 평가 타임아웃", sequence);

            Map<String, Object> body = new HashMap<>();
            body.put("sequence", sequence);
            body.put("errorCode", "TIMEOUT");
            body.put("message", "평가 시간 초과");

            return ResponseEntity.status(HttpStatus.REQUEST_TIMEOUT).body(body);
        }

        if (cause instanceof AzureSpeechException) {
            log.error("[SEQ-{}] Azure 오류: {}", sequence, cause.getMessage());

            Map<String, Object> body = new HashMap<>();
            body.put("sequence", sequence);
            body.put("errorCode", "AZURE_ERROR");
            body.put("message", cause.getMessage());

            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(body);
        }

        log.error("[SEQ-{}] 발음 평가 실패", sequence, cause);

        Map<String, Object> body = new HashMap<>();
        body.put("sequence", sequence);
        body.put("errorCode", "SERVER_ERROR");
        body.put("message", "서버 오류");

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}