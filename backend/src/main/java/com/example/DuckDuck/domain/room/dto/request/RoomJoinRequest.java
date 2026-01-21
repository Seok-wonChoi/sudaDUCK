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

    // 소셜 로그인 전 임시: email로 유저 식별
    @NotBlank(message = "email은 필수입니다.")
    @Email(message = "email 형식이 올바르지 않습니다.")
    private String email;
}
