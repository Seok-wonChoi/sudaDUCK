package com.example.DuckDuck.domain.room.dto.ws;

import lombok.*;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadyChangedPayload {
    private Long memberId;
    private Boolean ready;
}
