package org.example.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.service.TranslateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * GPT API 엔드포인트
 * - 번역 요청 처리 및 Redis 저장
 */
@RestController
@RequestMapping("/api/v1/gpt")
@RequiredArgsConstructor
@Slf4j
public class GptController {

    private final TranslateService translateService;
    private final GptExceptionHandler exceptionHandler;

    private int timeoutSeconds = 10;

    /**
     * 번역 API - Redis에 저장
     * POST /api/v1/gpt/translate?roomId=123&&speakerName=홍길동&text=안녕&sequence=1
     * 
     * Response:
     * 200 OK: {"message": "저장 완료"}
     * 400 Bad Request: 파라미터 오류
     * 408 Request Timeout: 타임아웃
     * 502 Bad Gateway: 외부 서비스 오류
     * 500 Internal Server Error: 서버 오류
     */
    @PostMapping("/translate")
    public CompletableFuture<ResponseEntity<Map<String, String>>> translate(
            @RequestParam String roomId,
            @RequestParam String speakerName,
            @RequestParam String text,
            @RequestParam Long sequence) {

        // 파라미터 검증
        if (roomId == null || roomId.trim().isEmpty()) {
            log.warn("잘못된 요청 - roomId 없음");
            return CompletableFuture.completedFuture(
                ResponseEntity.badRequest().body(Map.of("message", "roomId는 필수입니다."))
            );
        }

        if (speakerName == null || speakerName.trim().isEmpty()) {
            log.warn("잘못된 요청 - speakerName 없음");
            return CompletableFuture.completedFuture(
                ResponseEntity.badRequest().body(Map.of("message", "speakerName은 필수입니다."))
            );
        }

        if (text == null || text.trim().isEmpty()) {
            log.warn("잘못된 요청 - text 없음");
            return CompletableFuture.completedFuture(
                ResponseEntity.badRequest().body(Map.of("message", "text는 필수입니다."))
            );
        }

        log.info("번역 요청 - roomId: {}, seq: {}", roomId, sequence);

        return translateService.translateAndSaveToRedis(roomId, speakerName, text, sequence)
                .orTimeout(timeoutSeconds, TimeUnit.SECONDS)
                .thenApply(success -> {
                    if (success) {
                        log.info("번역 완료 - roomId: {}, seq: {}", roomId, sequence);
                        return ResponseEntity.ok(Map.of("message", "저장 완료"));
                    } else {
                        log.error("번역 실패 - roomId: {}, seq: {}", roomId, sequence);
                        return ResponseEntity.status(500).body(Map.of("message", "저장 실패"));
                    }
                })
                .exceptionally(ex -> {
                    log.error("번역 실패 - roomId: {}", roomId);
                    return ResponseEntity.status(500).body(Map.of("message", "서버 오류"));
                });
    }
}
