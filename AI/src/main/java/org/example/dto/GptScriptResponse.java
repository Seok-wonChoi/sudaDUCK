package org.example.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor  // JSON -> 객체 변환을 위해 필수!
@AllArgsConstructor // 직접 객체 생성할 때 편리함
public class GptScriptResponse {
    private String en;
    private String blank_script;
    private String[] similarity_phrases;
}