package com.example.DuckDuck.domain.room.ws;

import com.example.DuckDuck.domain.room.dto.request.RoomReadyPatchRequest;
import com.example.DuckDuck.domain.room.dto.response.RoomReadyPatchResponse;
import com.example.DuckDuck.domain.room.dto.ws.*;
import com.example.DuckDuck.domain.room.service.RoomReadyService;
import com.example.DuckDuck.domain.room.service.RoomSocketService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class RoomSocketController {

    private final RoomReadyService roomReadyService;   // 기존 Redis 저장 로직 재사용
    private final RoomSocketService roomSocketService;

    /**
     * READY 설정
     * client SEND: /app/rooms/{roomCode}/ready
     * server BROADCAST: /topic/rooms/{roomCode}
     */
    @MessageMapping("/rooms/{roomCode}/ready")
    public void setReady(@DestinationVariable String roomCode,
                         @Payload ReadySetMessage payload,
                         Principal principal) {

        System.out.println("WS principal=" + (principal==null ? "null" : principal.getName()));

        String senderKey = (principal != null) ? principal.getName() : "anonymous";

        // 1) 입력 검증
        if (payload == null || payload.getReady() == null) {
            roomSocketService.broadcast(roomCode,
                    RoomWsMessage.of(WsType.ERROR, roomCode, senderKey, "ready(true/false)는 필수입니다."));
            return;
        }

        try {
            // 1) 서비스 호출 (REST와 동일 로직 재사용)
            RoomReadyPatchResponse result =
                    roomReadyService.patchReady(senderKey, roomCode, new RoomReadyPatchRequest(payload.getReady()));

            // 2) 결과를 그대로 브로드캐스트 (프론트에 readyCount/totalCount까지 같이 전달 가능)
            roomSocketService.broadcast(roomCode,
                    RoomWsMessage.of(WsType.READY_CHANGED, roomCode, senderKey, result));

        } catch (Exception e) {
            roomSocketService.broadcast(roomCode,
                    RoomWsMessage.of(WsType.ERROR, roomCode, senderKey, e.getMessage()));
        }
    }

    /**
     * MIC 설정
     * client SEND: /app/rooms/{roomCode}/mic
     * server BROADCAST: /topic/rooms/{roomCode}
     */
    @MessageMapping("/rooms/{roomCode}/mic")
    public void setMic(@DestinationVariable String roomCode,
                       @Payload MicSetMessage payload,
                       Principal principal) {

        System.out.println("WS principal=" + (principal==null ? "null" : principal.getName()));

        String senderKey = (principal != null) ? principal.getName() : "anonymous";

        if (payload == null || payload.getMicOn() == null) {
            roomSocketService.broadcast(roomCode,
                    RoomWsMessage.of(WsType.ERROR, roomCode, senderKey, "micOn(true/false)는 필수입니다."));
            return;
        }

        MicChangedPayload out = MicChangedPayload.builder()
                .memberId(null)
                .micOn(payload.getMicOn())
                .build();

        roomSocketService.broadcast(roomCode,
                RoomWsMessage.of(WsType.MIC_CHANGED, roomCode, senderKey, out));
    }
}
