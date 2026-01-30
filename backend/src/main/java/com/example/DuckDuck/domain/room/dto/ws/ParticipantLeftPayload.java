package com.example.DuckDuck.domain.room.dto.ws;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ParticipantLeftPayload {
    private Long memberId;
}
