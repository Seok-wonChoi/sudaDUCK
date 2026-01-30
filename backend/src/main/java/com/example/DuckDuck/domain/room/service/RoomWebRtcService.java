package com.example.DuckDuck.domain.room.service;

import com.example.DuckDuck.domain.client.openvidu.OpenViduClient;
import com.example.DuckDuck.domain.client.openvidu.dto.reponse.OpenViduConnectionCreateResponse;
import com.example.DuckDuck.domain.room.dto.response.RoomWebRtcTokenResponse;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Set;

@Service
public class RoomWebRtcService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final OpenViduClient openViduClient;

    public RoomWebRtcService(RedisTemplate<String, Object> redisTemplate,
                             OpenViduClient openViduClient) {
        this.redisTemplate = redisTemplate;
        this.openViduClient = openViduClient;
    }

    public RoomWebRtcTokenResponse issueToken(String roomCode, String requesterKey) {
        // 1) roomCode -> roomId 조회 (예: "room:code:{roomCode}" => roomId)
        Long roomId = getRoomIdByRoomCode(roomCode);

        // 2) 방 멤버 검증 (예: "room:members:{roomId}" set에 requesterKey(email 또는 userId)가 있어야 함)
        validateMember(roomId, requesterKey);

        // 3) sessionId 고정
        String sessionId = "room-" + roomId;

        // 4) OpenVidu 세션 ensure + token 발급
        openViduClient.createSessionIfNotExists(sessionId);
        OpenViduConnectionCreateResponse conn = openViduClient.createConnection(sessionId);

        if (conn == null || conn.getToken() == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "OpenVidu token 발급 실패");
        }

        return new RoomWebRtcTokenResponse(roomCode, roomId, sessionId, conn.getToken());
    }

    private Long getRoomIdByRoomCode(String roomCode) {
        // 예: "room:code:{roomCode}" -> roomId
        String key = "room:code:" + roomCode;

        Object roomIdObj = redisTemplate.opsForValue().get(key);
        if (roomIdObj == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "유효하지 않은 roomCode 입니다.");
        }

        try {
            return Long.parseLong(roomIdObj.toString());
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "roomId 파싱 실패: " + roomIdObj);
        }
    }

    private void validateMember(Long roomId, String requesterKey) {
        // ✅ 너희 멤버 저장 키에 맞게 조정
        // 예: "room:members:{roomId}" set에 userId 또는 email 저장
        String key = "room:members:" + roomId;

        Set<Object> members = redisTemplate.opsForSet().members(key);
        if (members == null || members.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "방 멤버 정보가 없습니다.");
        }

        boolean ok = members.stream().anyMatch(m -> requesterKey.equals(String.valueOf(m)));
        if (!ok) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "방 멤버가 아닙니다. join 후 시도하세요.");
        }
    }
}
