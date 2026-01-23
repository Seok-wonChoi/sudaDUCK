package org.example.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.dto.ChatResponse;
import org.example.dto.GptScriptResponse;
import org.example.dto.ScriptData;
import org.example.exception.AzureSpeechException;
import org.example.exception.GptServiceException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * 번역 관련 비즈니스 로직
 * - GPT 번역
 * - TTS 생성
 * - Redis 저장
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TranslateService {

    private final GptService gptService;
    private final AzureSpeechService azureSpeechService;
    private final RedisTemplate<String, String> redisTemplate;  // ← Redis 추가!
    private final ObjectMapper objectMapper;

    private static final String KEY_PREFIX = "chat:room:";
    private static final long TTL_HOURS = 24; // 24시간 후 자동 삭제

    /**
     * 한국어 → 영어 번역 + TTS 생성 + Redis 저장 (비동기)
     * 
     * @param roomId 방 ID
     * @param speakerName 발화자 이름
     * @param text 한국어 텍스트
     * @param sequence 순서 번호
     * @return 성공 여부
     * @throws GptServiceException GPT 오류 시
     * @throws AzureSpeechException Azure 오류 시
     */
    @Async("chatTaskExecutor")
    public CompletableFuture<Boolean> translateAndSaveToRedis(
            String roomId,
            String speakerName,
            String text, 
            Long sequence) {
        
        log.info("[ASYNC-{}] 처리 시작 - Thread: {}, roomId: {}",
                sequence, Thread.currentThread().getName(), roomId);
        
        try {
            // roomId를 Long으로 변환
            Long roomIdLong = Long.parseLong(roomId);
            
            // 1. GPT 번역
            GptScriptResponse script = gptService.generateScript(text);
            log.info("[ASYNC-{}] GPT 완료", sequence);
            
            // 2. TTS 생성
            String ttsUrl = azureSpeechService.generateTTS(script.getEn(), roomId);
            log.info("[ASYNC-{}] TTS 완료: {}", sequence, ttsUrl);
            
            // 3. ScriptData 생성
            ScriptData scriptData = ScriptData.builder()
                    .speakerName(speakerName)
                    .koreanSentence(text)
                    .englishSentence(script.getEn())
                    .blankScript(script.getBlankScript())
                    .similarityPhrases(script.getSimilarityPhrases())
                    .ttsUrl(ttsUrl)
                    .sequence(sequence)
                    .createdAt(LocalDateTime.now())
                    .build();
            
            // 4. Redis에 저장
            saveToRedis(roomIdLong, scriptData);
            log.info("[ASYNC-{}] Redis 저장 완료", sequence);
            
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
     * Redis에 스크립트 저장
     */
    private void saveToRedis(Long roomId, ScriptData scriptData) {
        try {
            String key = KEY_PREFIX + roomId + ":messages";
            String scriptJson = objectMapper.writeValueAsString(scriptData);
            
            // List 구조로 저장 (순서 보장)
            redisTemplate.opsForList().rightPush(key, scriptJson);
            
            // TTL 설정 (24시간)
            redisTemplate.expire(key, TTL_HOURS, TimeUnit.HOURS);
            
            log.info("Redis 저장 완료 - roomId: {}, sequence: {}",
                    roomId, scriptData.getSequence());
            
        } catch (Exception e) {
            log.error("Redis 저장 실패 - roomId: {}", roomId, e);
            throw new RuntimeException("Redis 저장 실패", e);
        }
    }

    /**
     * (기존 메서드 - 필요 시 유지)
     * ChatResponse를 직접 반환하는 방식
     * - Redis 저장 없이 응답만 반환
     */
    @Async("chatTaskExecutor")
    public CompletableFuture<ChatResponse> translateAndGenerateAudio(
            String roomId, 
            String text, 
            Long sequence) {
        
        log.info("[ASYNC-{}] 처리 시작 (응답 반환) - Thread: {}", sequence, Thread.currentThread().getName());
        
        // 1. GPT 번역
        GptScriptResponse script = gptService.generateScript(text);
        log.info("[ASYNC-{}] GPT 완료", sequence);
        
        // 2. TTS 생성
        String ttsUrl = azureSpeechService.generateTTS(script.getEn(), roomId);
        log.info("[ASYNC-{}] TTS 완료: {}", sequence, ttsUrl);
        
        // 3. 성공 응답
        ChatResponse response = ChatResponse.success(sequence, script, ttsUrl);
        log.info("[ASYNC-{}] 처리 완료", sequence);
        
        return CompletableFuture.completedFuture(response);
    }
}
