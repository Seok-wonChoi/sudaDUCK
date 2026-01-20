package org.example.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.dto.ChatResponse;
import org.example.dto.GptScriptResponse;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final GptService gptService;
    private final AzureSpeechService azureSpeechService;

    /**
     * 비동기 방식: 동시 호출 시 병렬 처리
     * - @Async 어노테이션으로 별도 쓰레드에서 실행
     * - CompletableFuture 반환으로 논블로킹 처리
     */
    @Async("chatTaskExecutor")
    public CompletableFuture<ChatResponse> translateAndGenerateAudioAsync(
            String roomId, 
            String text, 
            Long sequence) {
        
        log.info("[ASYNC-{}] 쓰레드 시작: {} - roomId: {}, text: {}", 
                sequence, Thread.currentThread().getName(), roomId, text);
        
        try {
            // 1. GPT 번역
            GptScriptResponse script = gptService.generateScript(text);
            log.info("[ASYNC-{}] GPT 번역 완료", sequence);
            
            // 2. TTS 생성
            String ttsUrl = azureSpeechService.generateTTS(script.getEn(), roomId);
            log.info("[ASYNC-{}] TTS 생성 완료 - URL: {}", sequence, ttsUrl);
            
            // 3. 성공 응답
            ChatResponse response = ChatResponse.success(sequence, script, ttsUrl);
            
            log.info("[ASYNC-{}] 처리 완료 - 쓰레드: {}", 
                    sequence, Thread.currentThread().getName());
            
            return CompletableFuture.completedFuture(response);
            
        } catch (Exception e) {
            log.error("[ASYNC-{}] 처리 실패: {}", sequence, e.getMessage(), e);
            ChatResponse errorResponse = ChatResponse.error(
                    sequence, 
                    "CHAT_PROCESSING_ERROR", 
                    e.getMessage()
            );
            return CompletableFuture.completedFuture(errorResponse);
        }
    }
}
