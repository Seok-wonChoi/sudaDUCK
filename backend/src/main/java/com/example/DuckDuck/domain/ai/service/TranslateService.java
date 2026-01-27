package com.example.DuckDuck.domain.ai.service;

import com.example.DuckDuck.domain.room.entity.Room;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.example.DuckDuck.domain.ai.dto.GptScriptResponse;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
@Slf4j
public class TranslateService {

    private final GptService gptService;
    private final AzureSpeechService azureSpeechService;
    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    private static final long TTL_MINUTES = 120;

    // 방별 sequence 관리를 위한 Map
    private final Map<String, AtomicLong> roomSequenceMap = new HashMap<>();

    /**
     * 방별 sequence 생성 (thread-safe)
     */
    private synchronized Long generateSequence(String roomId) {
        return roomSequenceMap
                .computeIfAbsent(roomId, k -> new AtomicLong(0))
                .incrementAndGet();
    }

    /**
     * 한국어 → 영어 번역 + TTS 생성 + Redis 저장 (비동기)
     *
     * @param roomId 방 ID
     * @param text 한국어 텍스트
     * @param turnNo 턴 번호
     * @param speakerId 발화자 이름
     * @return 성공 여부
     */
    @Async("chatTaskExecutor")
    public CompletableFuture<Boolean> translateAndSaveToRedis(
            String roomId,
            String text,
            Long turnNo,
            String speakerId) {

        // API 호출 순서대로 sequence 생성
        Long sequence = generateSequence(roomId);

        log.info("[ASYNC-{}] 처리 시작 - roomId: {}, turn: {}, speaker_id: {}",
                sequence, roomId, turnNo, speakerId);

        try {
            Long roomIdLong = Long.parseLong(roomId);
            //발화자 id로 이름 찾기
            String topic = redisTemplate.opsForValue().get("room:" + roomId + ":topic");
            String speakerName = (String) redisTemplate.opsForHash().get("room:" + roomId + ":member", speakerId);
            //참여자 전체 명단
            String participantsJson = redisTemplate.opsForValue().get("room:" + roomId + ":participants");
            //방 정보가 없으면 에러
            if (topic == null || speakerName == null){
                log.error("[ASYNC-{}] Redis 세션 정보 누락 - roomId: {}, topic: {}, speakerName: {}",sequence, roomId, topic, speakerName);
                return CompletableFuture.completedFuture(false);
            }

            // 1. GPT 번역
            GptScriptResponse script = gptService.generateScript(text);
            log.info("[ASYNC-{}] GPT 완료 - en: {}", sequence, script.getEn());

            // 2. TTS 생성
            String ttsUrl = azureSpeechService.generateTTS(script.getEn(), roomId);
            log.info("[ASYNC-{}] TTS 완료: {}", sequence, ttsUrl);

            // 3. scriptId 생성 (timestamp_sequence)
            String scriptId = System.currentTimeMillis() + "_" + sequence;

            // 4. Redis에 저장 (명세서 형식)
            saveToRedis(roomIdLong, turnNo, scriptId, sequence, topic, speakerName, text, script,ttsUrl, participantsJson);
            log.info("[ASYNC-{}] Redis 저장 완료 - scriptId: {}", sequence, scriptId);

            return CompletableFuture.completedFuture(true);

        } catch (NumberFormatException e) {
            log.error("[ASYNC-{}] 잘못된 roomId 형식: {}", sequence, roomId, e);
            return CompletableFuture.completedFuture(false);
        } catch (Exception e) {
            log.error("[ASYNC-{}] 처리 실패 - roomId: {}", sequence, roomId, e);
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
                             String topic, String speakerName, String korean, GptScriptResponse script, String ttsUrl, String participantsJson) {
        try {
            // 1. Script Detail
            String detailKey = String.format("room:%d:turn:%d:script:%s", roomId, turnNo, scriptId);

            Map<String, String> scriptData = new HashMap<>();
            scriptData.put("order_no", orderNo.toString());
            scriptData.put("speaker_name", speakerName);
            scriptData.put("topic", topic);
            scriptData.put("participants", participantsJson);
            scriptData.put("english", script.getEn());
            scriptData.put("korean", korean);
            scriptData.put("score", "0");
            scriptData.put("blank_script", script.getBlankScript());
            scriptData.put("similarity_phrases", String.join(",", script.getSimilarityPhrases()));
            scriptData.put("tts_url", ttsUrl);
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