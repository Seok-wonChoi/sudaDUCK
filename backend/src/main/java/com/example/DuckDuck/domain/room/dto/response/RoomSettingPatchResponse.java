package com.example.DuckDuck.domain.room.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RoomSettingPatchResponse {
    private Long roomId;
    private String roomCode;

    private String title;
    private String topic;
    private Integer turnCnt;

    private boolean readyReset;
}
