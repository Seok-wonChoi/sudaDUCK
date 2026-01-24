package org.example.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GptScriptResponse {

    @JsonProperty("en")
    private String en;

    @JsonProperty("blank_script")
    private String blankScript;  // ← blank_script → blankScript (camelCase)

    @JsonProperty("similarity_phrases")
    private String[] similarityPhrases;  // ← similarity_phrases → similarityPhrases
}