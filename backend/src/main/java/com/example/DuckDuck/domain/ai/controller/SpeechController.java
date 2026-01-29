package com.example.DuckDuck.domain.ai.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.example.DuckDuck.domain.ai.service.AzureSpeechService;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * 발음 평가 API
 * - Redis에 저장된 스크립트의 score 업데이트
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Slf4j
public class SpeechController {

    private final AzureSpeechService azureSpeechService;
    private final SpeechExceptionHandler exceptionHandler;
    private final RedisTemplate<String, String> redisTemplate;

    private final int timeoutSeconds = 15;
    private static final long TTL_MINUTES = 120;

    /**
     * 발음 평가 및 Redis score 업데이트
     * POST /api/v1/assessment
     *
     * @param audioFile 녹음 파일
     * @param roomId 방 ID
     * @param turnNo 턴 번호
     * @param scriptId 스크립트 ID
     * @return 성공 여부
     */
    @PostMapping("/assessment")
    public CompletableFuture<ResponseEntity<Map<String, String>>> assessPronunciation(
            @RequestParam("audio") MultipartFile audioFile,
            @RequestParam("roomId") Long roomId,
            @RequestParam("turnNo") Long turnNo,
            @RequestParam("scriptId") String scriptId) throws IOException {

        log.info("발음 평가 요청 - room:{}, turn:{}, script:{}", roomId, turnNo, scriptId);

        // 1. 파라미터 검증
        if (audioFile.isEmpty()) {
            log.warn("음성 파일이 비어있음");
            return CompletableFuture.completedFuture(
                    ResponseEntity.badRequest().body(Map.of("message", "음성 파일은 필수입니다."))
            );
        }

        // 2. Redis에서 스크립트 조회
        String detailKey = String.format("room:%d:turn:%d:script:%s", roomId, turnNo, scriptId);
        String english = (String) redisTemplate.opsForHash().get(detailKey, "english");

        if (english == null || english.isEmpty()) {
            log.warn("스크립트를 찾을 수 없음 - key: {}", detailKey);
            return CompletableFuture.completedFuture(
                    ResponseEntity.status(404).body(Map.of("message", "스크립트를 찾을 수 없습니다."))
            );
        }

        log.info("평가 대상 텍스트: {}", english);

        // 3. 발음 평가 실행
        return azureSpeechService.getPronunciationScore(audioFile.getBytes(), english)
                .orTimeout(timeoutSeconds, TimeUnit.SECONDS)
                .thenApply(score -> {
                    // 4. Redis score 업데이트
                    redisTemplate.opsForHash().put(detailKey, "score", score.toString());
                    redisTemplate.expire(detailKey, TTL_MINUTES, TimeUnit.MINUTES);

                    log.info("✅ 발음 평가 완료 - room:{}, turn:{}, script:{}, score: {}",
                            roomId, turnNo, scriptId, score);

                    // 5. 성공 응답
                    return ResponseEntity.ok(Map.of("message", "평가 완료"));
                })
                .exceptionally(ex -> exceptionHandler.handle(ex, scriptId));
    }
}