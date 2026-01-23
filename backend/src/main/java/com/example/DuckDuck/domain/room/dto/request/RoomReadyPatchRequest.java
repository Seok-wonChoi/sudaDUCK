package com.example.DuckDuck.domain.room.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class RoomReadyPatchRequest {

    @NotNull(message = "ready(true/false)는 필수입니다.")
    private Boolean ready;
}
