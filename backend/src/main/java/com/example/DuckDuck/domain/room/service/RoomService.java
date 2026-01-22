package com.example.DuckDuck.domain.room.service;

import com.example.DuckDuck.domain.room.dto.request.RoomCreateRequest;
import com.example.DuckDuck.domain.room.dto.request.RoomJoinRequest;
import com.example.DuckDuck.domain.room.dto.response.RoomCreateResponse;
import com.example.DuckDuck.domain.room.dto.response.RoomJoinResponse;
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

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final RoomParticipantsRepository roomParticipantsRepository;
    private final MemberRepository memberRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    // ===================== 방 생성 =====================
    @Transactional
    public RoomCreateResponse createRoomByEmail(String email, RoomCreateRequest request) {

        // 1. 방장(Member) 조회 (JWT에서 얻은 userId 기준)
        Member host = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        // 2. 턴 수 기본값 처리
        int turnCnt = (request.turnCnt() == null) ? 3 : request.turnCnt();
        LocalDateTime now = LocalDateTime.now();

        // 3. Room 생성
        Room room = Room.builder()
                .creator(host)
                .title(request.title())
                .topic(request.topic())
                .isOpen(false) // 대기방
                .turnCnt(turnCnt)
                .startTime(now)
                .build();

        Room savedRoom = roomRepository.save(room);

        // 4. 방장을 참가자로 등록
        RoomParticipants hostParticipant = RoomParticipants.builder()
                .room(savedRoom)
                .user(host)
                .isHost(true)
                .isLeft(false)
                .firstJoinedAt(now)
                .lastRejoinedAt(now)
                .build();

        roomParticipantsRepository.save(hostParticipant);

        // 5. 룸 코드 발급 (Redis)
        String roomCode = issueUniqueRoomCode();

        String codeKey = "room:code:" + savedRoom.getRoomId(); // roomId -> code
        String reverseKey = "room:id:" + roomCode;             // code -> roomId

        redisTemplate.opsForValue().set(codeKey, roomCode, 6, TimeUnit.HOURS);
        redisTemplate.opsForValue().set(reverseKey, String.valueOf(savedRoom.getRoomId()), 6, TimeUnit.HOURS);

        // 6. 응답 반환
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

    // ===================== 방 참가 =====================
    @Transactional
    public RoomJoinResponse joinRoom(String email, RoomJoinRequest request) {

        // 1) member 조회 (인증에서 가져온 email 사용)
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException(
                        "존재하지 않는 이메일입니다. email=" + email
                ));

        // 2) Redis에서 roomCode -> roomId 조회
        String reverseKey = "room:id:" + request.getRoomCode();
        Object roomIdObj = redisTemplate.opsForValue().get(reverseKey);

        if (roomIdObj == null) {
            throw new IllegalArgumentException(
                    "유효하지 않거나 만료된 방 코드입니다. roomCode=" + request.getRoomCode()
            );
        }

        Long roomId;
        try {
            roomId = Long.parseLong(String.valueOf(roomIdObj));
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(
                    "방 코드 매핑 데이터가 올바르지 않습니다. roomCode=" + request.getRoomCode()
            );
        }

        // 3) Room 존재 확인
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("방을 찾을 수 없습니다. roomId=" + roomId));

        // ✅ 정책: 게임 시작(isOpen=true)이면 누구든 입장 불가
        if (Boolean.TRUE.equals(room.getIsOpen())) {
            throw new IllegalStateException("게임이 이미 시작된 방입니다. 입장할 수 없습니다.");
        }

        // 4) 기존 참가자 여부 확인
        var existingOpt = roomParticipantsRepository.findByRoom_RoomIdAndUser_Id(roomId, member.getId());
        boolean alreadyJoined = existingOpt.isPresent();

        // 5) 참가자 등록/재입장 처리
        LocalDateTime now = LocalDateTime.now();

        if (alreadyJoined) {
            RoomParticipants existing = existingOpt.get();

            if (Boolean.TRUE.equals(existing.getIsLeft())) {
                existing.setIsLeft(false);
            }
            existing.setLastRejoinedAt(now);
        } else {
            RoomParticipants participant = RoomParticipants.builder()
                    .room(room)
                    .user(member)
                    .isHost(false)
                    .isLeft(false)
                    .firstJoinedAt(now)
                    .lastRejoinedAt(now)
                    .build();

            roomParticipantsRepository.save(participant);
        }

        // 6) ReadyStatus Redis 초기화(없을 때만)
        String readyKey = "room:" + roomId + ":ready:" + member.getId();
        redisTemplate.opsForValue().setIfAbsent(readyKey, "NOT_READY", 6, TimeUnit.HOURS);

        return RoomJoinResponse.builder()
                .roomId(roomId)
                .roomCode(request.getRoomCode())
                .readyStatus("NOT_READY")
                .alreadyJoined(alreadyJoined)
                .build();
    }
}
