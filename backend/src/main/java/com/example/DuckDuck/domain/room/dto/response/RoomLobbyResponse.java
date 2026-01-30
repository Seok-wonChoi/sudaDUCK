package com.example.DuckDuck.domain.room.dto.response;

import lombok.*;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomLobbyResponse {

    private Long roomId;
    private String roomCode;
    private Boolean isOpen;
    private List<ParticipantInfo> participants;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParticipantInfo {
        private Long userId;
        private String nickname;
        private String profileImageUrl;
        private Boolean isHost;
        private String readyStatus; // READY / NOT_READY
    }
}