package com.example.DuckDuck.domain.room.dto.ws;

public enum WsType {
    // READY
    READY_SET,
    READY_CHANGED,

    // MIC
    MIC_SET,
    MIC_CHANGED,

    // VOICE
    VOICE_LEVEL_CHANGED,

    // ROOM / PARTICIPANT
    PARTICIPANT_JOINED,
    PARTICIPANT_LEFT,

    ROOM_UPDATED,
    ROOM_STARTED,

    ROOM_ENDED,
    ROOM_CLOSED,

    MINIGAME_START,

    // ERROR
    ERROR
}
