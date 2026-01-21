package com.example.DuckDuck.domain.room.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RoomCreateRequest(
        @Email @NotBlank String email,
        @NotBlank String title,
        @NotBlank String topic,
        Integer turnCnt
) {
}
