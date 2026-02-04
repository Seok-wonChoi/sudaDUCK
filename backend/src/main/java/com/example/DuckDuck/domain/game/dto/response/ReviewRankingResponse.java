package com.example.DuckDuck.domain.game.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ReviewRankingResponse {
    private Long userId;
    private String nickname;
    private String profileImageUrl;
    private int score;
    private boolean isMe; // '나'인지 표시
}
