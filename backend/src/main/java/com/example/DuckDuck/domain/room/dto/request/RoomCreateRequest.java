package com.example.DuckDuck.domain.room.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RoomCreateRequest(
        @NotBlank String title,
        @NotBlank String topic,
        Integer turnCnt,
        String openviduSessionId //추가사항 : 오픈비듀 세션아이디도 받아옵시닷!
) {
}
