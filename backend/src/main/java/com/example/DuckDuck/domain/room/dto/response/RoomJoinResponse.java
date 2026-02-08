package com.example.DuckDuck.domain.room.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RoomJoinResponse {

    private final Long roomId;
    private final String roomCode;
    private final String readyStatus;
    private final boolean alreadyJoined;
    //오픈비두 세션 ID
    private final String openviduSessionId;
}
