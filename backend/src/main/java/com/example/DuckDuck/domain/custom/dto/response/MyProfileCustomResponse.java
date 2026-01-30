package com.example.DuckDuck.domain.custom.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Builder
public class MyProfileCustomResponse {
    private String nickname;

    private Integer coins;
    private String duckCustomJson;
    private String avatarCustomJson;
    private String aiDuckbotCustomJson;
}
