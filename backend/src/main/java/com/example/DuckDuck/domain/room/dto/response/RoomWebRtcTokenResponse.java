package com.example.DuckDuck.domain.room.dto.response;

public class RoomWebRtcTokenResponse {

    private String roomCode;
    private Long roomId;
    private String sessionId;
    private String token;

    public RoomWebRtcTokenResponse() {}

    public RoomWebRtcTokenResponse(String roomCode, Long roomId, String sessionId, String token) {
        this.roomCode = roomCode;
        this.roomId = roomId;
        this.sessionId = sessionId;
        this.token = token;
    }

    public String getRoomCode() {
        return roomCode;
    }

    public Long getRoomId() {
        return roomId;
    }

    public String getSessionId() {
        return sessionId;
    }

    public String getToken() {
        return token;
    }
}
