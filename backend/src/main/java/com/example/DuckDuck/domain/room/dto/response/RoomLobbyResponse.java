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

    // 방 정보
    private String title;
    private String topic;
    private Integer turnCnt;
    private Long hostId;

    private List<ParticipantInfo> participants;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParticipantInfo {
        private Long userId;
        private String nickname;

        // 커스텀
        private String avatarCustomJson;
        private String duckCustomJson;
        private String aiDuckbotCustomJson;

        private Boolean isHost;
        private String readyStatus; // READY / NOT_READY
    }
}