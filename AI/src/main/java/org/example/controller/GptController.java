package org.example.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.service.TranslateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/v1/gpt")
@RequiredArgsConstructor
@Slf4j
public class GptController {

    private final TranslateService translateService;
    private final int timeoutSeconds = 10;

    /**
     * 번역 API - Redis에 저장
     * POST /api/v1/gpt/translate?roomId=1&text=안녕&sequence=1&turnNo=1&speakerId=100
     */
    @PostMapping("/translate")
    public CompletableFuture<ResponseEntity<Map<String, String>>> translate(
            @RequestParam String roomId,
            @RequestParam String text,
            @RequestParam Long sequence,
            @RequestParam Long turnNo,
            @RequestParam Long speakerId) {

        // 파라미터 검증
        if (roomId == null || roomId.trim().isEmpty()) {
            log.warn("잘못된 요청 - roomId 없음");
            return CompletableFuture.completedFuture(
                    ResponseEntity.badRequest().body(Map.of("message", "roomId는 필수입니다."))
            );
        }

        if (text == null || text.trim().isEmpty()) {
            log.warn("잘못된 요청 - text 없음");
            return CompletableFuture.completedFuture(
                    ResponseEntity.badRequest().body(Map.of("message", "text는 필수입니다."))
            );
        }

        if (turnNo == null) {
            log.warn("잘못된 요청 - turnNo 없음");
            return CompletableFuture.completedFuture(
                    ResponseEntity.badRequest().body(Map.of("message", "turnNo는 필수입니다."))
            );
        }

        if (speakerId == null) {
            log.warn("잘못된 요청 - speakerId 없음");
            return CompletableFuture.completedFuture(
                    ResponseEntity.badRequest().body(Map.of("message", "speakerId는 필수입니다."))
            );
        }

        log.info("번역 요청 - roomId: {}, turn: {}, seq: {}, speaker: {}",
                roomId, turnNo, sequence, speakerId);

        return translateService.translateAndSaveToRedis(roomId, text, sequence, turnNo, speakerId)
                .orTimeout(timeoutSeconds, TimeUnit.SECONDS)
                .thenApply(success -> {
                    if (success) {
                        log.info("번역 완료 - roomId: {}, turn: {}, seq: {}", roomId, turnNo, sequence);
                        return ResponseEntity.ok(Map.of("message", "저장 완료"));
                    } else {
                        log.error("번역 실패 - roomId: {}, turn: {}, seq: {}", roomId, turnNo, sequence);
                        return ResponseEntity.status(500).body(Map.of("message", "저장 실패"));
                    }
                })
                .exceptionally(ex -> {
                    log.error("번역 실패 - roomId: {}, turn: {}", roomId, turnNo, ex);
                    return ResponseEntity.status(500).body(Map.of("message", "서버 오류: " + ex.getMessage()));
                });
    }
}