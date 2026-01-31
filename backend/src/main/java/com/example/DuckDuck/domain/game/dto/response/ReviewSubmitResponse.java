package com.example.DuckDuck.domain.game.dto.response;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewSubmitResponse {
    private int correctCount;  // 맞춘 개수
    private int totalQuestions; // 전체 문제 수 (보통 4개)
    private String message;     // 결과 메시지 (예: "참 잘했어요!")
}
