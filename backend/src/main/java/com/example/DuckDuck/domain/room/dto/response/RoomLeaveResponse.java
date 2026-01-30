package com.example.DuckDuck.domain.room.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RoomLeaveResponse {
    private Long roomId;
    private String roomCode;

    // 방장 나감 여부
    private boolean hostLeft;

    // 방이 종료되었는지
    private boolean roomClosed;

    // 남은 인원수 (방 종료면 0)
    private Long remainingCount;
}
