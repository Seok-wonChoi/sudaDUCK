package com.example.DuckDuck.domain.room.controller;

import com.example.DuckDuck.domain.room.dto.response.RoomWebRtcTokenResponse;
import com.example.DuckDuck.domain.room.service.RoomWebRtcService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/rooms")
public class RoomWebRtcController {

    private final RoomWebRtcService roomWebRtcService;

    public RoomWebRtcController(RoomWebRtcService roomWebRtcService) {
        this.roomWebRtcService = roomWebRtcService;
    }

    @PostMapping("/{roomCode}/webrtc/token")
    public RoomWebRtcTokenResponse issueToken(@PathVariable String roomCode,
                                              Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증이 필요합니다.");
        }
        String requesterKey = authentication.getName();
        return roomWebRtcService.issueToken(roomCode, requesterKey);
    }


    @PostMapping("/{roomCode}/webrtc/token/test")
    public RoomWebRtcTokenResponse issueTokenTest(@PathVariable String roomCode,
                                                  @RequestParam String email) {
        return roomWebRtcService.issueToken(roomCode, email);
    }


    public static class TokenReq {
        private String email;
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }

}
