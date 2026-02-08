package com.example.DuckDuck.domain.game.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionResultResponse {
    private Integer order_no;
    private String scriptId;
    private String speakerName;
    private String english;
    private String korean;
    private String blank_script;
    private Double score; // 개인 점수
    private Double averageScore; // 백엔드에서 계산된 평균 점수
}
