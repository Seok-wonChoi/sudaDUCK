package org.example.service;

import lombok.RequiredArgsConstructor;
import org.example.dto.GptScriptResponse;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final GptService gptService;
    private final AzureSpeechService azureSpeechService;

    /**
     * 한국어 입력을 받아서 번역, 빈칸 생성, TTS 경로 반환까지의 비즈니스 로직 수행
     */
    public Map<String, Object> translateAndGenerateAudio(String roomId, String text) {
        // 1. GPT로 번역 및 학습 데이터 생성
        GptScriptResponse script = gptService.generateScript(text);

        // 2. 생성된 영어 문장으로 TTS 생성 (이제 AzureSpeechService가 URL을 반환함)
        String ttsUrl = azureSpeechService.generateTTS(script.getEn(), roomId);

        // 3. 결과 조합
        Map<String, Object> response = new HashMap<>();
        response.put("script", script);
        response.put("ttsUrl", ttsUrl);

        // [나중에] 여기에 Redis에 저장하는 코드를 딱 한 줄 넣으면 관리가 편해집니다!

        return response;
    }
}