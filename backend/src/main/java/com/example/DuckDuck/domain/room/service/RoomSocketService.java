package com.example.DuckDuck.domain.room.service;

import com.example.DuckDuck.domain.room.dto.ws.RoomWsMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RoomSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcast(String roomCode, RoomWsMessage<?> msg) {
        // 구독 경로: /topic/rooms/{roomCode}
        messagingTemplate.convertAndSend("/topic/rooms/" + roomCode, msg);
    }
}
