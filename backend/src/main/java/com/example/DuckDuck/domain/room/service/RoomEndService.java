package com.example.DuckDuck.domain.room.service;

import com.example.DuckDuck.domain.room.dto.response.RoomEndResponse;
import com.example.DuckDuck.domain.room.entity.Room;
import com.example.DuckDuck.domain.room.repository.RoomParticipantsRepository;
import com.example.DuckDuck.domain.room.repository.RoomRepository;
import com.example.DuckDuck.domain.user.entity.Member;
import com.example.DuckDuck.domain.user.repository.MemberRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class RoomEndService {

    private final RoomRepository roomRepository;
    private final RoomParticipantsRepository roomParticipantsRepository;
    private final MemberRepository memberRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    // ===== Redis Key =====
    private String keyRoomCodeToId(String roomCode) { return "room:code:" + roomCode; }
    private String keyRoomTopic(Long roomId) { return "room:" + roomId + ":topic"; }
    private String keyRoomMemberNames(Long roomId) { return "room:" + roomId + ":member"; }
    private String keyRoomParticipants(Long roomId) { return "room:" + roomId + ":participants"; }

    @Transactional
    public RoomEndResponse endRoom(String email, String roomCode) {

        // 0) 입력 검증
        if (roomCode == null || roomCode.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "roomCode는 필수입니다.");
        }

        // 1) member 조회
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "존재하지 않는 사용자입니다."));

        // 2) roomCode -> roomId 조회 (Redis)
        Object roomIdObj = redisTemplate.opsForValue().get(keyRoomCodeToId(roomCode));
        if (roomIdObj == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않거나 만료된 방 코드입니다.");
        }

        Long roomId;
        try {
            roomId = Long.parseLong(String.valueOf(roomIdObj));
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "방 코드 매핑 데이터가 올바르지 않습니다.");
        }

        // 3) Room 조회 (DB)
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "방을 찾을 수 없습니다."));

        // 4) 호출자 검증: 해당 방 참가자이며, 나가지 않은 사람만 가능
        boolean isParticipant = roomParticipantsRepository
                .findByRoom_RoomIdAndUser_Id(roomId, member.getId())
                .map(rp -> !Boolean.TRUE.equals(rp.getIsLeft()))
                .orElse(false);

        if (!isParticipant) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "해당 방 참가자만 종료할 수 있습니다.");
        }

        // 5) idempotent 처리: 이미 대기방이면 그대로 200
        if (!Boolean.TRUE.equals(room.getIsOpen())) {
            return RoomEndResponse.builder()
                    .roomId(roomId)
                    .roomCode(roomCode)
                    .isOpen(false)
                    .message("이미 대기방입니다.")
                    .build();
        }

        // 6) 방 종료(대기방 전환)
        room.setIsOpen(false);
        roomRepository.save(room);

        // 7) start에서 만들었던 세션성 데이터만 정리 (members/ready는 유지해야 대기방 유지됨)
        redisTemplate.delete(keyRoomTopic(roomId));
        redisTemplate.delete(keyRoomMemberNames(roomId));
        redisTemplate.delete(keyRoomParticipants(roomId));

        return RoomEndResponse.builder()
                .roomId(roomId)
                .roomCode(roomCode)
                .isOpen(false)
                .message("대기방으로 전환 완료")
                .build();
    }
}
