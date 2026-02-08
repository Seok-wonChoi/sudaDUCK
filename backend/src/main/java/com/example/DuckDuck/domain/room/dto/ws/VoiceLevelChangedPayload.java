package com.example.DuckDuck.domain.room.dto.ws;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class VoiceLevelChangedPayload {
    private Long memberId;
    private Double level; // 0.0 ~ 1.0
}
