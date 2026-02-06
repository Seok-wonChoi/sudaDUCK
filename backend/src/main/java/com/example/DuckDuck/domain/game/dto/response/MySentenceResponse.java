package com.example.DuckDuck.domain.game.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class MySentenceResponse {
    private String sentenceId;
    private String englishSentence;
    private String koreanSentence;
    private int score;
    private String topic;
    private String speakerName;
    private List<String> participants;
    private LocalDateTime createdAt;
    private String ttsUrl;
    private List<String> similarityPhrases;
}
