package com.example.DuckDuck.domain.room.dto.ws;

import lombok.*;

import java.time.Instant;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomWsMessage<T> {
    private WsType type;
    private String roomCode;
    private String senderKey;   // email or userId 등 식별자
    private Instant ts;
    private T payload;

    public static <T> RoomWsMessage<T> of(WsType type, String roomCode, String senderKey, T payload) {
        return RoomWsMessage.<T>builder()
                .type(type)
                .roomCode(roomCode)
                .senderKey(senderKey)
                .ts(Instant.now())
                .payload(payload)
                .build();
    }
}
