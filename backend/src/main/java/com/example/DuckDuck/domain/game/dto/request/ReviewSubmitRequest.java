package com.example.DuckDuck.domain.game.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class ReviewSubmitRequest {
    private List<AnswerItem> answers;

    @Getter @Setter
    public static class AnswerItem {
        private String scriptId;
        private String userAnswer;
    }
}
