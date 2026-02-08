package com.example.DuckDuck.domain.room.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RoomStartResponse {
    private Long roomId;
    private String roomCode;
    private Boolean isOpen;

    private Long totalCount;        // members 전체(방장 포함)
    private Long readyTargetCount;  // 준비 대상(방장 제외)
    private Long readyCount;        // READY 개수(방장 제외 기준으로 카운트)

    private String message;
}
