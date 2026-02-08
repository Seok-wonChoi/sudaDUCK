package com.example.DuckDuck.domain.room.dto.ws;

import lombok.*;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MicChangedPayload {
    private Long memberId;
    private Boolean micOn;
}
