package com.example.DuckDuck.domain.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.example.DuckDuck.domain.ai.dto.GptScriptResponse;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;


@Service
@RequiredArgsConstructor
@Slf4j
public class TranslateService {

    private final GptService gptService;
    private final AzureSpeechService azureSpeechService;
    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;
    private final TextPreprocessingService preprocessingService;

    private static final long TTL_MINUTES = 120;

    /**
     * 🔥 Redis 기반 sequence 생성 (턴별로 관리)
     *
     * @param roomId 방 ID
     * @param turnNo 턴 번호
     * @return order_no (1부터 시작)
     */
    private Long generateSequence(String roomId, Long turnNo) {
        // Redis key: room:{roomId}:turn:{turnNo}:sequence
        String sequenceKey = String.format("room:%s:turn:%d:sequence", roomId, turnNo);

        // Redis INCR로 원자적 증가 (1부터 시작)
        Long sequence = redisTemplate.opsForValue().increment(sequenceKey, 1L);

        // TTL 설정 (처음 생성 시에만)
        if (sequence == 1L) {
            redisTemplate.expire(sequenceKey, TTL_MINUTES, TimeUnit.MINUTES);
        }

        log.info("✅ Sequence 생성 - room:{}, turn:{}, sequence:{}", roomId, turnNo, sequence);

        return sequence;
    }

    /**
     * 한국어 → 영어 번역 + TTS 생성 + Redis 저장 (비동기)
     *
     * @param roomId 방 ID
     * @param text 한국어 텍스트
     * @param turnNo 턴 번호
     * @param speakerId 발화자 ID
     * @return 성공 여부
     */
    @Async("chatTaskExecutor")
    public CompletableFuture<Boolean> translateAndSaveToRedis(
            String roomId,
            String text,
            Long turnNo,
            Long speakerId) {

        // Redis 기반 sequence 생성 (턴별)
        Long orderNo = generateSequence(roomId, turnNo);

        log.info("📊 [ORDER-{}] 처리 시작 - roomId: {}, turn: {}, speaker: {}",
                orderNo, roomId, turnNo, speakerId);

        try {
            Long roomIdLong = Long.parseLong(roomId);

            // 원본 텍스트를 별도 변수로 저장 (로그용)
            String originalText = text;
            text = preprocessingService.preprocess(text);

            if (text == null) {
                // 원본 텍스트를 로그에 출력 (기존: text가 이미 null이어서 항상 "null" 출력됨)
                log.warn("[ASYNC-{}] 전처리 필터링됨 - 원본: '{}'",
                        orderNo, originalText);
                return CompletableFuture.completedFuture(false);
            }

            // 1. GPT 번역
            GptScriptResponse script = gptService.generateScript(text);
            log.info("📊 [ORDER-{}] GPT 완료 - en: {}", orderNo, script.getEn());

            // 2. TTS 생성 (영어 텍스트로 생성)
            String ttsUrl = null;
            try {
                ttsUrl = azureSpeechService.generateTTS(script.getEn(), roomId);
                log.info("📊 [ORDER-{}] TTS 완료 - url: {}", orderNo, ttsUrl);
            } catch (Exception e) {
                log.error("📊 [ORDER-{}] ❌ TTS 생성 실패 - 기본값(null) 사용", orderNo, e);
                // ttsUrl은 null로 유지
            }

            // 3. scriptId 생성 (timestamp_orderNo)
            String scriptId = System.currentTimeMillis() + "_" + orderNo;

            // 4. Redis에 저장 (명세서 형식)
            saveToRedis(roomIdLong, turnNo, scriptId, orderNo, speakerId, text, script, ttsUrl);
            log.info("📊 [ORDER-{}] ✅ Redis 저장 완료 - scriptId: {}", orderNo, scriptId);

            return CompletableFuture.completedFuture(true);

        } catch (NumberFormatException e) {
            log.error("❌ 잘못된 roomId 형식: {}", roomId, e);
            return CompletableFuture.completedFuture(false);
        } catch (Exception e) {
            log.error("❌ 처리 실패 - roomId: {}, turn: {}", roomId, turnNo, e);
            return CompletableFuture.completedFuture(false);
        }
    }

    /**
     * Redis에 명세서 형식으로 저장
     * 1. Hash: room:{roomId}:turn:{turnNo}:script:{scriptId}
     * 2. Sorted Set: room:{roomId}:turn:{turnNo}:scripts (순서 보장)
     * 3. Set: room:{roomId}:scripts (Cleanup용)
     */
    private void saveToRedis(Long roomId, Long turnNo, String scriptId, Long orderNo,
                             Long speakerId, String korean, GptScriptResponse script, String ttsUrl) {
        try {
            // 1. Script Detail
            String detailKey = String.format("room:%d:turn:%d:script:%s", roomId, turnNo, scriptId);

            Map<String, String> scriptData = new HashMap<>();
            scriptData.put("order_no", orderNo.toString());
            scriptData.put("speaker_id", speakerId.toString());
            scriptData.put("english", script.getEn());
            scriptData.put("korean", korean);
            scriptData.put("score", "0");
            scriptData.put("blank_script", script.getBlankScript());
            scriptData.put("similarity_phrases", String.join(",", script.getSimilarityPhrases()));
            scriptData.put("tts_url", ttsUrl != null ? ttsUrl : "");  // null이면 빈 문자열
            scriptData.put("created_at", LocalDateTime.now().toString());

            redisTemplate.opsForHash().putAll(detailKey, scriptData);
            redisTemplate.expire(detailKey, TTL_MINUTES, TimeUnit.MINUTES);
            log.info("Hash 저장: {}", detailKey);

            // 2. Turn-based Ordered Index (Sorted Set)
            String indexKey = String.format("room:%d:turn:%d:scripts", roomId, turnNo);
            redisTemplate.opsForZSet().add(indexKey, scriptId, orderNo.doubleValue());
            redisTemplate.expire(indexKey, TTL_MINUTES, TimeUnit.MINUTES);
            log.info("Sorted Set 저장: {} (score: {})", indexKey, orderNo);

            // 3. Cleanup Set
            String cleanupKey = String.format("room:%d:scripts", roomId);
            redisTemplate.opsForSet().add(cleanupKey, scriptId);
            redisTemplate.expire(cleanupKey, TTL_MINUTES, TimeUnit.MINUTES);
            log.info("Cleanup Set 저장: {}", cleanupKey);

            log.info("Redis 저장 완료 - room:{}, turn:{}, script:{}, order:{}",
                    roomId, turnNo, scriptId, orderNo);

        } catch (Exception e) {
            log.error("Redis 저장 실패 - roomId: {}, turnNo: {}", roomId, turnNo, e);
            throw new RuntimeException("Redis 저장 실패", e);
        }
    }
}