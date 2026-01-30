package com.example.DuckDuck.domain.room.service;

import com.example.DuckDuck.domain.room.dto.response.RoomLobbyResponse;
import com.example.DuckDuck.domain.room.entity.Room;
import com.example.DuckDuck.domain.room.entity.RoomParticipants;
import com.example.DuckDuck.domain.room.repository.RoomParticipantsRepository;
import com.example.DuckDuck.domain.room.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class RoomLobbyService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final RoomRepository roomRepository;
    private final RoomParticipantsRepository roomParticipantsRepository;

    // ===== Redis Key =====
    private String keyRoomCodeToId(String roomCode) { return "room:code:" + roomCode; }
    private String keyRoomReady(Long roomId) { return "room:ready:" + roomId; }

    @Transactional(readOnly = true)
    public RoomLobbyResponse getLobbyStatus(String roomCode) {

        // roomCode → roomId (Redis)
        Object roomIdObj = redisTemplate.opsForValue().get(keyRoomCodeToId(roomCode));
        if (roomIdObj == null) {
            throw new IllegalArgumentException("유효하지 않은 roomCode입니다.");
        }
        Long roomId = Long.valueOf(roomIdObj.toString());

        // Room (DB)
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 방입니다."));

        // 참가자 목록 (DB)
        List<RoomParticipants> participants =
                roomParticipantsRepository.findByRoom_RoomIdAndIsLeftFalse(roomId);

        // ready 상태 (Redis Hash)
        Map<Object, Object> readyRaw =
                redisTemplate.opsForHash().entries(keyRoomReady(roomId));

        Map<Long, String> readyMap = new HashMap<>();
        for (Map.Entry<Object, Object> entry : readyRaw.entrySet()) {
            readyMap.put(
                    Long.valueOf(entry.getKey().toString()),
                    entry.getValue().toString()
            );
        }

        // 응답용 참가자 DTO 변환
        List<RoomLobbyResponse.ParticipantInfo> participantInfos =
                participants.stream()
                        .map(p -> RoomLobbyResponse.ParticipantInfo.builder()
                                .userId(p.getUser().getId())
                                .nickname(p.getUser().getNickname())
                                .profileImageUrl(p.getUser().getProfileImageUrl())
                                .isHost(p.getIsHost())
                                .readyStatus(
                                        readyMap.getOrDefault(
                                                p.getUser().getId(),
                                                "NOT_READY"
                                        )
                                )
                                .build())
                        .toList();

        return RoomLobbyResponse.builder()
                .roomId(roomId)
                .roomCode(roomCode)
                .isOpen(room.getIsOpen())
                .participants(participantInfos)
                .build();
    }
}
