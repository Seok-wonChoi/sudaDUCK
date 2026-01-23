package com.example.DuckDuck.domain.room.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RoomReadyPatchResponse {
    private Long roomId;
    private String roomCode;

    private Long readyCount;
    private Long totalCount;
    private Boolean isAllReady;

    private String myReadyStatus; // READY | NOT_READY
    private Boolean isHost; // 내가 방장인지
}
