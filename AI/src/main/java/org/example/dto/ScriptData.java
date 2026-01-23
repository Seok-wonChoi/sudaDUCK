package org.example.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Redis에 저장될 스크립트 데이터
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScriptData {
    
    @JsonProperty("speaker_name")
    private String speakerName;
    
    @JsonProperty("korean_sentence")
    private String koreanSentence;
    
    @JsonProperty("english_sentence")
    private String englishSentence;
    
    @JsonProperty("blank_script")
    private String blankScript;
    
    @JsonProperty("similarity_phrases")
    private List<String> similarityPhrases;
    
    @JsonProperty("tts_url")
    private String ttsUrl;
    
    @JsonProperty("sequence")
    private Long sequence;
    
    @JsonProperty("created_at")
    private LocalDateTime createdAt;
}
