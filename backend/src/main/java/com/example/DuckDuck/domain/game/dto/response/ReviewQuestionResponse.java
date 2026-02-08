package com.example.DuckDuck.domain.game.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewQuestionResponse {
    private String scriptId;
    private String korean;
    private String english;
    private String blank_script;
}
