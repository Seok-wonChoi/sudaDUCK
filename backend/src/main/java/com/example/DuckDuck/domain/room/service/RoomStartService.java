package com.example.DuckDuck.domain.room.service;

import com.example.DuckDuck.domain.room.dto.response.RoomStartResponse;
import com.example.DuckDuck.domain.room.entity.Room;
import com.example.DuckDuck.domain.room.repository.RoomParticipantsRepository;
import com.example.DuckDuck.domain.room.repository.RoomRepository;
import com.example.DuckDuck.domain.user.entity.Member;
import com.example.DuckDuck.domain.user.repository.MemberRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import jakarta.transaction.Transactional;

import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoomStartService {

    private final RoomRepository roomRepository;
    private final RoomParticipantsRepository roomParticipantsRepository;
    private final MemberRepository memberRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final long ROOM_TTL_HOURS = 6;

    // ===== Redis Key (RoomService와 동일 규칙) =====
    private String keyRoomCodeToId(String roomCode) { return "room:code:" + roomCode; }
    private String keyRoomIdToCode(Long roomId) { return "room:" + roomId + ":code"; }
    private String keyRoomMembers(Long roomId) { return "room:members:" + roomId; }
    private String keyRoomReady(Long roomId) { return "room:ready:" + roomId; }

    private void refreshRoomTtl(Long roomId, String roomCode) {
        redisTemplate.expire(keyRoomMembers(roomId), ROOM_TTL_HOURS, TimeUnit.HOURS);
        redisTemplate.expire(keyRoomReady(roomId), ROOM_TTL_HOURS, TimeUnit.HOURS);
        redisTemplate.expire(keyRoomIdToCode(roomId), ROOM_TTL_HOURS, TimeUnit.HOURS);
        redisTemplate.expire(keyRoomCodeToId(roomCode), ROOM_TTL_HOURS, TimeUnit.HOURS);
    }

    @Transactional
    public RoomStartResponse startRoom(String email, String roomCode) {

        // 0) 입력 검증
        if (roomCode == null || roomCode.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "roomCode는 필수입니다.");
        }

        // 1) member 조회
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "존재하지 않는 사용자입니다."));

        // 2) roomCode -> roomId 조회
        Object roomIdObj = redisTemplate.opsForValue().get(keyRoomCodeToId(roomCode));
        if (roomIdObj == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않거나 만료된 방 코드입니다. roomCode=" + roomCode);
        }

        Long roomId;
        try {
            roomId = Long.parseLong(String.valueOf(roomIdObj));
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "방 코드 매핑 데이터가 올바르지 않습니다. roomCode=" + roomCode);
        }

        // 3) DB room 조회
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "방을 찾을 수 없습니다. roomId=" + roomId));

        // 이미 시작된 방이면 거절
        if (Boolean.TRUE.equals(room.getIsOpen())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 대화가 시작된 방입니다.");
        }

        // 4) 요청자가 방장인지 확인(DB)
        boolean isHost = roomParticipantsRepository
                .findByRoom_RoomIdAndUser_Id(roomId, member.getId())
                .map(rp -> Boolean.TRUE.equals(rp.getIsHost()) && !Boolean.TRUE.equals(rp.getIsLeft()))
                .orElse(false);

        if (!isHost) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "방장만 대화를 시작할 수 있습니다.");
        }

        String hostIdStr = String.valueOf(member.getId());

        // 5) Redis members 목록 가져오기
        Set<Object> members = redisTemplate.opsForSet().members(keyRoomMembers(roomId));
        if (members == null || members.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "현재 방 참가자 정보가 없습니다.");
        }

        long totalCount = members.size();
        long readyTargetCount = totalCount - 1; // 방장 제외

        if (readyTargetCount <= 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "대화를 시작하려면 최소 1명 이상의 참가자가 필요합니다.");
        }

        // 6) members(방장 제외) 전원이 READY인지 확인 (없음/NOT_READY면 409)
        long readyCount = 0L;

        for (Object m : members) {
            String userIdStr = String.valueOf(m);

            if (hostIdStr.equals(userIdStr)) continue; // 방장은 준비 대상 아님

            Object statusObj = redisTemplate.opsForHash().get(keyRoomReady(roomId), userIdStr);

            if (statusObj == null) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "준비 상태가 없는 참가자가 있습니다. userId=" + userIdStr);
            }

            String status = String.valueOf(statusObj);

            if (!"READY".equals(status)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "아직 준비되지 않은 참가자가 있습니다. userId=" + userIdStr);
            }

            readyCount++;
        }

        // (안전망) 개수도 일치하는지 체크
        if (readyCount != readyTargetCount) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "준비 완료 인원이 부족합니다.");
        }

        // 7) 모두 READY면 room.is_open = true 업데이트
        room.setIsOpen(true);
        roomRepository.save(room);

        //====== redis에 topic과 member id-name 정보 저장 ======
        String topicKey = "room:"+roomId + ":topic";
        redisTemplate.opsForValue().set(topicKey, room.getTopic(), ROOM_TTL_HOURS, TimeUnit.HOURS);

        String memberNamesKey = "room:" + roomId +":member";
        String participantsKey = "room:" + roomId + ":participants";

        List<Long> memberIds = members.stream()
                .map(m -> Long.parseLong(String.valueOf(m)))
                .toList();

        List<Member> memberList = memberRepository.findAllById(memberIds);

        Map<String, String> idToNameMap = new HashMap<>();
        List<String> allNames = new ArrayList<>();

        for(Member m : memberList){
            idToNameMap.put(m.getId().toString(), m.getNickname());
            allNames.add(m.getNickname());
        }

        //Redis에 저장
        redisTemplate.opsForHash().putAll(memberNamesKey, idToNameMap);
        redisTemplate.expire(memberNamesKey, ROOM_TTL_HOURS, TimeUnit.HOURS);

        //Redis에 저장
        try{
            String jsonNames = new ObjectMapper().writeValueAsString(allNames);
            redisTemplate.opsForValue().set(participantsKey, jsonNames, ROOM_TTL_HOURS);
        } catch (Exception e){
            log.error("참여자 리스트 변환 실패", e);
        }
        // 8) TTL 갱신
        refreshRoomTtl(roomId, roomCode);

        // (선택) OpenVidu 세션 생성/시작 트리거는 여기서 호출
        // openViduService.createSession(roomId) ...

        return RoomStartResponse.builder()
                .roomId(roomId)
                .roomCode(roomCode)
                .isOpen(true)
                .totalCount(totalCount)
                .readyTargetCount(readyTargetCount)
                .readyCount(readyCount)
                .message("대화 시작 성공")
                .build();
    }
}
