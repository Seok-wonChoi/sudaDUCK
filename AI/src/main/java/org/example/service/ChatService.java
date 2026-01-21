package org.example.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.dto.ChatResponse;
import org.example.dto.GptScriptResponse;
import org.example.exception.AzureSpeechException;
import org.example.exception.GptServiceException;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

/**
 * 채팅 관련 비즈니스 로직
 * - 모든 비동기 처리는 여기서
 * - 예외는 그대로 던짐 (Controller에서 처리)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final GptService gptService;
    private final AzureSpeechService azureSpeechService;

    /**
     * 한국어 → 영어 번역 + TTS 생성 (비동기)
     * 
     * @throws GptServiceException GPT 오류 시
     * @throws AzureSpeechException Azure 오류 시
     */
    @Async("chatTaskExecutor")
    public CompletableFuture<ChatResponse> translateAndGenerateAudio(
            String roomId, 
            String text, 
            Long sequence) {
        
        log.info("[ASYNC-{}] 처리 시작 - Thread: {}", sequence, Thread.currentThread().getName());
        
        // 1. GPT 번역 (예외 발생 시 자동으로 CompletableFuture.failedFuture()로 변환)
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
