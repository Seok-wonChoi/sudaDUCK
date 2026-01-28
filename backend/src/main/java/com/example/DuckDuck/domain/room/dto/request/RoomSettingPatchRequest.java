package com.example.DuckDuck.domain.room.dto.request;

public record RoomSettingPatchRequest (
        String title,
        String topic,
        Integer turnCnt
){

}
