package com.example.DuckDuck.domain.room.dto.ws;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipantChangedPayload {

    private Long memberId;
    private String nickname;
    private String profileImageUrl;
    private boolean isHost;
}
