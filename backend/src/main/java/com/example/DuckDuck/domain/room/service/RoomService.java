package com.example.DuckDuck.domain.room.service;

import com.example.DuckDuck.domain.ai.service.AiProfanityFilterService;
import com.example.DuckDuck.domain.game.service.MiniGameService;
import com.example.DuckDuck.domain.room.dto.request.RoomCreateRequest;
import com.example.DuckDuck.domain.room.dto.request.RoomJoinRequest;
import com.example.DuckDuck.domain.room.dto.request.RoomLeaveRequest;
import com.example.DuckDuck.domain.room.dto.response.RoomCreateResponse;
import com.example.DuckDuck.domain.room.dto.response.RoomJoinResponse;
import com.example.DuckDuck.domain.room.dto.response.RoomLeaveResponse;
import com.example.DuckDuck.domain.room.dto.ws.ParticipantChangedPayload;
import com.example.DuckDuck.domain.room.dto.ws.ParticipantLeftPayload;
import com.example.DuckDuck.domain.room.dto.ws.RoomWsMessage;
import com.example.DuckDuck.domain.room.dto.ws.WsType;
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
    private final RoomSocketService roomSocketService;
    private final AiProfanityFilterService aiProfanityFilterService;
    private static final long ROOM_TTL_HOURS = 6;
    private static final String ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private final MiniGameService miniGameService;

    // ===== Redis Key =====
    private String keyRoomCodeToId(String roomCode) { // roomCode -> roomId
        return "room:code:" + roomCode;
    }
    private String keyRoomIdToCode(Long roomId) {     // roomId -> roomCode
        return "room:" + roomId + ":code";
    }
    private String keyRoomMembers(Long roomId) {
        return "room:members:" + roomId;
    }
    private String keyRoomReady(Long roomId) {
        return "room:ready:" + roomId;
    }
    private String keyRoomTopic(Long roomId) { return "room:" + roomId + ":topic"; }
    private String keyRoomMember(Long roomId) { return "room:" + roomId + ":member";}
    private String keyRoomParticipants(Long roomId) { return "room:" + roomId + ":participants";}

    private void refreshRoomTtl(Long roomId, String roomCode) {
        redisTemplate.expire(keyRoomMembers(roomId), ROOM_TTL_HOURS, TimeUnit.HOURS);
        redisTemplate.expire(keyRoomReady(roomId), ROOM_TTL_HOURS, TimeUnit.HOURS);
        redisTemplate.expire(keyRoomIdToCode(roomId), ROOM_TTL_HOURS, TimeUnit.HOURS);
        redisTemplate.expire(keyRoomCodeToId(roomCode), ROOM_TTL_HOURS, TimeUnit.HOURS);
        // 👇 [추가] 오픈비두 키도 수명 연장! (안 하면 6시간 뒤에 마이크 끊김)
        redisTemplate.expire(keyRoomOpenVidu(roomId), ROOM_TTL_HOURS, TimeUnit.HOURS);
    }

    // ===================== 방 생성 =====================
    @Transactional
    public RoomCreateResponse createRoomByEmail(String email, RoomCreateRequest request) {

        // gpt 방 제목, 주제 필터링
        aiProfanityFilterService.validateText(request.title(), "방 제목");
        aiProfanityFilterService.validateText(request.topic(), "방 주제");

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

        //오픈비듀 로직 추가사항 : 오픈비듀도 세션만들고 저장하기
        if (request.openviduSessionId() != null) {
            // 1. 이름표 만들기: "room:100:openvidu"
            String key = keyRoomOpenVidu(savedRoom.getRoomId());

            // 2. 내용물: "ses_123" (프론트에서 받은 거)
            String value = request.openviduSessionId();

            // 3. 레디스에 저장 (6시간 뒤 삭제)
            redisTemplate.opsForValue().set(key, value, ROOM_TTL_HOURS, TimeUnit.HOURS);
        }


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

        // (1) roomCode -> roomId
        redisTemplate.opsForValue().set(
                keyRoomCodeToId(roomCode),
                String.valueOf(savedRoom.getRoomId()),
                ROOM_TTL_HOURS, TimeUnit.HOURS
        );

        // (2) roomId -> roomCode
        redisTemplate.opsForValue().set(
                keyRoomIdToCode(savedRoom.getRoomId()),
                roomCode,
                ROOM_TTL_HOURS, TimeUnit.HOURS
        );

        // (3) members set에 방장 추가 (필수)
        redisTemplate.opsForSet().add(
                keyRoomMembers(savedRoom.getRoomId()),
                String.valueOf(host.getId())
        );

        // (4) TTL 동기화(키들 TTL 통일)
        refreshRoomTtl(savedRoom.getRoomId(), roomCode);

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
            Boolean exists = redisTemplate.hasKey(keyRoomCodeToId(code));
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
        String codeToIdKey = keyRoomCodeToId(request.getRoomCode());
        Object roomIdObj = redisTemplate.opsForValue().get(codeToIdKey);

        if (roomIdObj == null) {
            throw new IllegalArgumentException("유효하지 않거나 만료된 방 코드입니다. roomCode=" + request.getRoomCode());
        }

        Long roomId;
        try {
            roomId = Long.parseLong(String.valueOf(roomIdObj));
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("방 코드 매핑 데이터가 올바르지 않습니다. roomCode=" + request.getRoomCode());
        }

        // 3) Room 존재 확인
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("방을 찾을 수 없습니다. roomId=" + roomId));

        // 정책: 게임 시작(isOpen=true)이면 누구든 입장 불가
        if (Boolean.TRUE.equals(room.getIsOpen())) {
            throw new IllegalStateException("게임이 이미 시작된 방입니다. 입장할 수 없습니다.");
        }

        // 4) 기존 참가자 여부 확인
        var existingOpt = roomParticipantsRepository.findByRoom_RoomIdAndUser_Id(roomId, member.getId());
        boolean alreadyJoined = existingOpt.isPresent();
        boolean wasLeft = false;

        // 5) 참가자 등록/재입장 처리
        LocalDateTime now = LocalDateTime.now();

        if (alreadyJoined) {
            RoomParticipants existing = existingOpt.get();
            wasLeft = Boolean.TRUE.equals(existing.getIsLeft());

            if (wasLeft) {
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

        // ===== Redis =====

        // members에 추가
        redisTemplate.opsForSet().add(keyRoomMembers(roomId), String.valueOf(member.getId()));

        // ready 초기화 / 재입장 처리
        if (alreadyJoined && wasLeft) {
            // 재입장인 경우: ready를 NOT_READY로 초기화(덮어쓰기)
            redisTemplate.opsForHash().put(
                    keyRoomReady(roomId),
                    String.valueOf(member.getId()),
                    "NOT_READY"
            );
        } else {
            // 처음 들어온 경우만 없을 때 초기화
            redisTemplate.opsForHash().putIfAbsent(
                    keyRoomReady(roomId),
                    String.valueOf(member.getId()),
                    "NOT_READY"
            );
        }

        // roomId -> code 키 보정 (혹시 누락된 경우)
        redisTemplate.opsForValue().setIfAbsent(
                keyRoomIdToCode(roomId),
                request.getRoomCode(),
                ROOM_TTL_HOURS, TimeUnit.HOURS
        );

        // TTL 동기화(참가 이벤트마다 갱신)
        refreshRoomTtl(roomId, request.getRoomCode());

        roomSocketService.broadcast(
                request.getRoomCode(),
                RoomWsMessage.of(
                        WsType.PARTICIPANT_JOINED,
                        request.getRoomCode(),
                        String.valueOf(member.getId()),
                        new ParticipantChangedPayload(
                                member.getId(),
                                member.getNickname(),
                                member.getProfileImageUrl(),
                                false
                        )
                )
        );
        //레디스에서 오픈비두 세션 ID 꺼내오기 [오픈비듀 추우가아]
        String ovSessionId = (String) redisTemplate.opsForValue().get(keyRoomOpenVidu(roomId));


        return RoomJoinResponse.builder()
                .roomId(roomId)
                .roomCode(request.getRoomCode())
                .readyStatus("NOT_READY")
                .openviduSessionId(ovSessionId) // 👈 [핵심] 여기서 실어서 보냅니다!
                .alreadyJoined(alreadyJoined)
                .build();

    }

    // ===================== 방 나가기 =====================
    @Transactional
    public RoomLeaveResponse leaveRoom(String email, RoomLeaveRequest request) {

        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다. email=" + email));

        String roomCode = request.getRoomCode();

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

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("방을 찾을 수 없습니다. roomId=" + roomId));

        RoomParticipants participant = roomParticipantsRepository
                .findByRoom_RoomIdAndUser_Id(roomId, member.getId())
                .orElseThrow(() -> new IllegalArgumentException("해당 방에 참가 중인 사용자가 아닙니다. roomId=" + roomId));

        boolean isHost = Boolean.TRUE.equals(participant.getIsHost());

        // DB 상태 업데이트 (나감)
        participant.setIsLeft(true);
        participant.setLastRejoinedAt(LocalDateTime.now());

        // Redis에서 members/ready 제거
        redisTemplate.opsForSet().remove(keyRoomMembers(roomId), String.valueOf(member.getId()));
        redisTemplate.opsForHash().delete(keyRoomReady(roomId), String.valueOf(member.getId()));

        // ===================== 방장 퇴장 -> 방 종료 =====================
        if (isHost) {
            LocalDateTime now = LocalDateTime.now();
            roomParticipantsRepository.markAllLeftByRoomId(roomId, now);

            room.setIsOpen(false);
            roomRepository.save(room);

            // 방송
            roomSocketService.broadcast(
                    roomCode,
                    RoomWsMessage.of(
                            WsType.ROOM_CLOSED,
                            roomCode,
                            String.valueOf(member.getId()),
                            "방장이 퇴장하여 방이 종료되었습니다."
                    )
            );

            // Redis 정리
            redisTemplate.delete(keyRoomMembers(roomId));
            redisTemplate.delete(keyRoomReady(roomId));
            redisTemplate.delete(keyRoomIdToCode(roomId));
            redisTemplate.delete(keyRoomCodeToId(roomCode));

            redisTemplate.delete(keyRoomTopic(roomId));
            redisTemplate.delete(keyRoomMember(roomId));
            redisTemplate.delete(keyRoomParticipants(roomId));

            //미니게임/스크립트도 삭제
            miniGameService.clearReviewData(roomId);

            return RoomLeaveResponse.builder()
                    .roomId(roomId)
                    .roomCode(roomCode)
                    .hostLeft(true)
                    .roomClosed(true)
                    .remainingCount(0L)
                    .build();
        }

        // ===================== 참가자 퇴장 -> 남은 인원 체크 =====================
        Long remaining = redisTemplate.opsForSet().size(keyRoomMembers(roomId));
        if (remaining == null) remaining = 0L;

        if (remaining == 0L) {
            room.setIsOpen(false);
            roomRepository.save(room);

            // 방송
            roomSocketService.broadcast(
                    roomCode,
                    RoomWsMessage.of(
                            WsType.ROOM_CLOSED,
                            roomCode,
                            String.valueOf(member.getId()),
                            "모든 참가자가 퇴장하여 방이 종료되었습니다."
                    )
            );

            // Redis 정리
            redisTemplate.delete(keyRoomMembers(roomId));
            redisTemplate.delete(keyRoomReady(roomId));
            redisTemplate.delete(keyRoomIdToCode(roomId));
            redisTemplate.delete(keyRoomCodeToId(roomCode));

            redisTemplate.delete(keyRoomTopic(roomId));
            redisTemplate.delete(keyRoomMember(roomId));
            redisTemplate.delete(keyRoomParticipants(roomId));

            miniGameService.clearReviewData(roomId);

            return RoomLeaveResponse.builder()
                    .roomId(roomId)
                    .roomCode(roomCode)
                    .hostLeft(false)
                    .roomClosed(true)
                    .remainingCount(0L)
                    .build();
        }

        // 방 유지: TTL 갱신
        refreshRoomTtl(roomId, roomCode);

        // 참가자 퇴장 브로드캐스트
        roomSocketService.broadcast(
                roomCode,
                RoomWsMessage.of(
                        WsType.PARTICIPANT_LEFT,
                        roomCode,
                        String.valueOf(member.getId()),
                        new ParticipantLeftPayload(member.getId())
                )
        );

        return RoomLeaveResponse.builder()
                .roomId(roomId)
                .roomCode(roomCode)
                .hostLeft(false)
                .roomClosed(false)
                .remainingCount(remaining)
                .build();
    }

    private String keyRoomOpenVidu(Long roomId) {  //추가사항 :레디스에 저장된 방번호에 해당된 오픈비듀 세션아이디를 가져옵시다!
        return "room:" + roomId + ":openvidu";
    }
}