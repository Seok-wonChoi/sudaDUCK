package com.example.DuckDuck.domain.room.dto.ws;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MiniGameQuestionsMessage {
    private List<QuestionData> questions;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionData {
        private String scriptId;
        private String korean;
        private String english;
        private String blank_script;
    }
}