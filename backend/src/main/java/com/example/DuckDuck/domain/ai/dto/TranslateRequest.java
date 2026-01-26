package com.example.DuckDuck.domain.ai.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class TranslateRequest {

    @NotBlank(message = "roomId는 필수입니다.")
    private String roomId;

    @NotBlank(message = "text는 필수입니다.")
    private String text;

    @NotNull(message = "turnNo는 필수입니다.")
    private Long turnNo;

    @NotNull(message = "speakerId는 필수입니다.")
    private Long speakerId;
}
