package org.example.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponse {
    private Long sequence;            // 요청 순서 번호 (응답에 포함)
    private String requestId;         // 요청 ID
    
    @JsonProperty("script")
    private GptScriptResponse script; // GPT 응답
    
    @JsonProperty("tts_url")
    private String ttsUrl;            // TTS 파일 URL
    
    private Long timestamp;           // 처리 완료 시각
    
    // 에러 정보 (선택)
    private String errorCode;
    private String errorMessage;
    
    // 성공 응답 생성 헬퍼 메서드
    public static ChatResponse success(Long sequence, GptScriptResponse script, String ttsUrl) {
        return ChatResponse.builder()
                .sequence(sequence)
                .script(script)
                .ttsUrl(ttsUrl)
                .timestamp(System.currentTimeMillis())
                .build();
    }
    
    // 에러 응답 생성 헬퍼 메서드
    public static ChatResponse error(Long sequence, String errorCode, String errorMessage) {
        return ChatResponse.builder()
                .sequence(sequence)
                .errorCode(errorCode)
                .errorMessage(errorMessage)
                .timestamp(System.currentTimeMillis())
                .build();
    }
}
