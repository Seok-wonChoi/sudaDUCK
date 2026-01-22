package com.example.DuckDuck.domain.room.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class RoomJoinRequest {

    @NotBlank(message = "roomCode는 필수입니다.")
    @Size(min = 6, max = 6, message = "roomCode는 6자리여야 합니다.")
    private String roomCode;
}
