package com.example.DuckDuck.domain.room.dto.ws;

public enum WsType {
    READY_SET,
    READY_CHANGED,
    MIC_SET,
    MIC_CHANGED,


    ROOM_UPDATED,   //방 정보 수정
    ERROR
}
