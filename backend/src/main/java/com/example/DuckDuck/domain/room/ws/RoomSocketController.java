package com.example.DuckDuck.domain.room.ws;

import com.example.DuckDuck.domain.room.dto.request.RoomReadyPatchRequest;
import com.example.DuckDuck.domain.room.dto.response.RoomReadyPatchResponse;
import com.example.DuckDuck.domain.room.dto.ws.*;
import com.example.DuckDuck.domain.room.service.RoomReadyService;
import com.example.DuckDuck.domain.room.service.RoomSocketService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.stereotype.Controller;
import com.example.DuckDuck.domain.user.entity.Member;
import com.example.DuckDuck.domain.user.repository.MemberRepository;
import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class RoomSocketController {

    private final RoomReadyService roomReadyService;   // 기존 Redis 저장 로직 재사용
    private final RoomSocketService roomSocketService;
    private final MemberRepository memberRepository;

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

        try {
            Member member = requireMember(principal);
            String senderKey = String.valueOf(member.getId());
            String email = principal.getName();
            // 입력 검증
            if (payload == null || payload.getReady() == null) {
                roomSocketService.broadcast(roomCode,
                        RoomWsMessage.of(WsType.ERROR, roomCode, senderKey, "ready(true/false)는 필수입니다."));
                return;
            }

            // 서비스 호출(기존 로직 재사용)
            RoomReadyPatchResponse result =
                    roomReadyService.patchReady(email, roomCode, new RoomReadyPatchRequest(payload.getReady()));

            // 브로드캐스트(senderKey는 userId)
            roomSocketService.broadcast(roomCode,
                    RoomWsMessage.of(WsType.READY_CHANGED, roomCode, senderKey, result));

        } catch (Exception e) {
            String fallback = (principal != null) ? principal.getName() : "anonymous";
            roomSocketService.broadcast(roomCode,
                    RoomWsMessage.of(WsType.ERROR, roomCode, fallback, e.getMessage()));
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

        try {
            Member member = requireMember(principal);
            Long memberId = member.getId();
            String senderKey = String.valueOf(memberId);

            // 입력 검증도 senderKey(userId)로 에러 브로드캐스트
            if (payload == null || payload.getMicOn() == null) {
                roomSocketService.broadcast(roomCode,
                        RoomWsMessage.of(WsType.ERROR, roomCode, senderKey, "micOn(true/false)는 필수입니다."));
                return;
            }

            MicChangedPayload out = MicChangedPayload.builder()
                    .memberId(memberId)
                    .micOn(payload.getMicOn())
                    .build();

            roomSocketService.broadcast(roomCode,
                    RoomWsMessage.of(WsType.MIC_CHANGED, roomCode, senderKey, out));

        } catch (Exception e) {
            String fallback = (principal != null) ? principal.getName() : "anonymous";
            roomSocketService.broadcast(roomCode,
                    RoomWsMessage.of(WsType.ERROR, roomCode, fallback, e.getMessage()));
        }
    }

    @MessageMapping("/rooms/{roomCode}/voice-level")
    public void setVoiceLevel(@DestinationVariable String roomCode,
                              @Payload VoiceLevelSetMessage payload,
                              Principal principal) {

        try {
            Member member = requireMember(principal);
            Long memberId = member.getId();
            String senderKey = String.valueOf(memberId);

            // 입력 검증
            if (payload == null || payload.getLevel() == null) {
                roomSocketService.broadcast(roomCode,
                        RoomWsMessage.of(WsType.ERROR, roomCode, senderKey, "level(0.0~1.0)은 필수입니다."));
                return;
            }

            // level clamp (안전)
            double level = payload.getLevel();
            if (Double.isNaN(level) || Double.isInfinite(level)) level = 0.0;
            level = Math.max(0.0, Math.min(1.0, level));

            VoiceLevelChangedPayload out = VoiceLevelChangedPayload.builder()
                    .memberId(memberId)
                    .level(level)
                    .build();

            roomSocketService.broadcast(roomCode,
                    RoomWsMessage.of(WsType.VOICE_LEVEL_CHANGED, roomCode, senderKey, out));

        } catch (Exception e) {
            String fallback = (principal != null) ? principal.getName() : "anonymous";
            roomSocketService.broadcast(roomCode,
                    RoomWsMessage.of(WsType.ERROR, roomCode, fallback, e.getMessage()));
        }
    }


    private Member requireMember(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new IllegalArgumentException("인증 정보(principal)가 없습니다.");
        }
        String email = principal.getName();
        return memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다. email=" + email));
    }
}
