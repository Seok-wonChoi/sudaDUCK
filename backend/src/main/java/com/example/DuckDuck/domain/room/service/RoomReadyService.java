package com.example.DuckDuck.domain.room.service;

import com.example.DuckDuck.domain.room.dto.request.RoomReadyPatchRequest;
import com.example.DuckDuck.domain.room.dto.response.RoomReadyPatchResponse;
import com.example.DuckDuck.domain.room.repository.RoomParticipantsRepository;
import com.example.DuckDuck.domain.user.entity.Member;
import com.example.DuckDuck.domain.user.repository.MemberRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class RoomReadyService {

    private final MemberRepository memberRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final RoomParticipantsRepository roomParticipantsRepository;

    private static final long ROOM_TTL_HOURS = 6;

    // ===== Redis Key (RoomService와 동일 규칙) =====
    private String keyRoomCodeToId(String roomCode) { return "room:code:" + roomCode; }
    private String keyRoomMembers(Long roomId) { return "room:members:" + roomId; }
    private String keyRoomReady(Long roomId) { return "room:ready:" + roomId; }
    private String keyRoomIdToCode(Long roomId) { return "room:" + roomId + ":code"; }

    private void refreshRoomTtl(Long roomId, String roomCode) {
        redisTemplate.expire(keyRoomMembers(roomId), ROOM_TTL_HOURS, TimeUnit.HOURS);
        redisTemplate.expire(keyRoomReady(roomId), ROOM_TTL_HOURS, TimeUnit.HOURS);
        redisTemplate.expire(keyRoomIdToCode(roomId), ROOM_TTL_HOURS, TimeUnit.HOURS);
        redisTemplate.expire(keyRoomCodeToId(roomCode), ROOM_TTL_HOURS, TimeUnit.HOURS);
    }

    /**
     * 참가자 준비 상태 변경
     * @param email 로그인 사용자 이메일 (Authentication principal)
     * @param roomCode PathVariable로 받은 방 코드
     * @param request ready true/false
     */
    @Transactional
    public RoomReadyPatchResponse patchReady(String email, String roomCode, RoomReadyPatchRequest request) {

        // 0) 입력 검증
        if (roomCode == null || roomCode.isBlank()) {
            throw new IllegalArgumentException("roomCode는 필수입니다.");
        }
        if (request == null || request.getReady() == null) {
            throw new IllegalArgumentException("ready(true/false)는 필수입니다.");
        }

        // 1) member 조회
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다. email=" + email));

        // 2) roomCode -> roomId 조회
        Object roomIdObj = redisTemplate.opsForValue().get(keyRoomCodeToId(roomCode));
        if (roomIdObj == null) {
            throw new IllegalArgumentException("유효하지 않거나 만료된 방 코드입니다. roomCode=" + roomCode);
        }

        Long roomId;
        try {
            roomId = Long.parseLong(String.valueOf(roomIdObj));
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("방 코드 매핑 데이터가 올바르지 않습니다. roomCode=" + roomCode);
        }

        String userIdStr = String.valueOf(member.getId());

        boolean isHost = roomParticipantsRepository
                .findByRoom_RoomIdAndUser_Id(roomId, member.getId())
                .map(rp -> Boolean.TRUE.equals(rp.getIsHost()))
                .orElse(false);

        if (isHost) {
            throw new IllegalArgumentException("방장은 준비 상태를 변경할 수 없습니다.");
        }

        // 3) members 포함 여부 검증
        Boolean isMember = redisTemplate.opsForSet().isMember(keyRoomMembers(roomId), userIdStr);
        if (isMember == null || !isMember) {
            throw new IllegalArgumentException("해당 방의 참가자가 아닙니다. roomId=" + roomId + ", userId=" + member.getId());
        }

        // 4) ready 갱신
        String newStatus = Boolean.TRUE.equals(request.getReady()) ? "READY" : "NOT_READY";
        redisTemplate.opsForHash().put(keyRoomReady(roomId), userIdStr, newStatus);

        // 5) readyCount 계산
        Collection<Object> values = redisTemplate.opsForHash().values(keyRoomReady(roomId));
        long readyCount = 0L;
        if (values != null) {
            readyCount = values.stream()
                    .map(String::valueOf)
                    .filter("READY"::equals)
                    .count();
        }

        // 6) totalCount 계산
        Long totalCount = redisTemplate.opsForSet().size(keyRoomMembers(roomId));
        if (totalCount == null) totalCount = 0L;

        boolean isAllReady = (totalCount > 0 && readyCount == totalCount);

        // 7) TTL 갱신
        refreshRoomTtl(roomId, roomCode);

        return RoomReadyPatchResponse.builder()
                .roomId(roomId)
                .roomCode(roomCode)
                .readyCount(readyCount)
                .totalCount(totalCount)
                .isAllReady(isAllReady)
                .myReadyStatus(newStatus)
                .isHost(isHost)
                .build();
    }
}
