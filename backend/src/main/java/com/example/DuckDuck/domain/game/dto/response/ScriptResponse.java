package com.example.DuckDuck.domain.game.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScriptResponse {
    private Integer order_no;
    private String speakerName;
    private String english;
    private String korean;
    private String blank_script;
    private String tts_url;
}
