package com.example.DuckDuck.domain.room.service;

import com.example.DuckDuck.domain.room.dto.request.RoomCreateRequest;
import com.example.DuckDuck.domain.room.dto.response.RoomCreateResponse;
import com.example.DuckDuck.domain.room.entity.Room;
import com.example.DuckDuck.domain.room.entity.RoomParticipants;
import com.example.DuckDuck.domain.room.repository.RoomParticipantsRepository;
import com.example.DuckDuck.domain.room.repository.RoomRepository;
import com.example.DuckDuck.domain.user.entity.Member;
import com.example.DuckDuck.domain.user.repository.MemberRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import java.util.concurrent.TimeUnit;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final RoomParticipantsRepository roomParticipantsRepository;
    private final MemberRepository memberRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    @Transactional
    public RoomCreateResponse createRoom(RoomCreateRequest request) {
        Member host = memberRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 이메일입니다. email=" + request.email()));

        int turnCnt = (request.turnCnt() == null) ? 3 : request.turnCnt();

        LocalDateTime now = LocalDateTime.now();

        Room room = Room.builder()
                .creator(host)
                .title(request.title())
                .topic(request.topic())
                .isOpen(false)
                .turnCnt(turnCnt)
                .startTime(now)
                .build();


        Room savedRoom = roomRepository.save(room);

        RoomParticipants hostParticipant = RoomParticipants.builder()
                .room(savedRoom)
                .user(host)
                .isHost(true)
                .isLeft(false)
                .firstJoinedAt(now)
                .lastRejoinedAt(now)
                .build();


        roomParticipantsRepository.save(hostParticipant);

        String roomCode = issueUniqueRoomCode();

        String codeKey = "room:code:" + savedRoom.getRoomId(); // roomId -> code
        String reverseKey = "room:id:" + roomCode;             // code -> roomId

        redisTemplate.opsForValue().set(codeKey, roomCode, 6, TimeUnit.HOURS);
        redisTemplate.opsForValue().set(reverseKey, String.valueOf(savedRoom.getRoomId()), 6, TimeUnit.HOURS);

        return new RoomCreateResponse(
                savedRoom.getRoomId(),
                host.getId(),
                savedRoom.getTitle(),
                savedRoom.getTopic(),
                savedRoom.getTurnCnt(),
                savedRoom.getCreatedAt(),
                roomCode
        );
    }

    private static final String ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    private String generateRoomCode(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            int idx = java.util.concurrent.ThreadLocalRandom.current().nextInt(ALPHANUM.length());
            sb.append(ALPHANUM.charAt(idx));
        }
        return sb.toString();
    }

    private String issueUniqueRoomCode() {
        while (true) {
            String code = generateRoomCode(6);
            String reverseKey = "room:id:" + code;
            Boolean exists = redisTemplate.hasKey(reverseKey);
            if (exists == null || !exists) return code;
        }
    }
}
