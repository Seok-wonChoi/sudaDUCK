package com.example.DuckDuck.domain.room.dto.response;

import java.time.LocalDateTime;

public record RoomCreateResponse(
        Long roomId,
        Long hostUserId,
        String title,
        String topic,
        int turnCnt,
        LocalDateTime createdAt,
        String roomCode
) {}