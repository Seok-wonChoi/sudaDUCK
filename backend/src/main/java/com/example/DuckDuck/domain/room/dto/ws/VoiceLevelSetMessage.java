package com.example.DuckDuck.domain.room.dto.ws;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class VoiceLevelSetMessage {
    private Double level; // 0.0 ~ 1.0
}
