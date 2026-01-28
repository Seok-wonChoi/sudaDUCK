package com.example.DuckDuck.domain.room.service;

import com.example.DuckDuck.domain.room.dto.request.RoomSettingPatchRequest;
import com.example.DuckDuck.domain.room.dto.response.RoomSettingPatchResponse;
import com.example.DuckDuck.domain.room.dto.ws.RoomWsMessage;
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
import com.example.DuckDuck.domain.room.dto.ws.WsType;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@RequiredArgsConstructor
@Service
public class RoomSettingService {

    private final RoomRepository roomRepository;
    private final RoomParticipantsRepository roomParticipantsRepository;
    private final MemberRepository memberRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final RoomSocketService roomSocketService;

    private static final long ROOM_TTL_HOURS = 6;

    // ===== Redis Key =====
    private String keyRoomCodeToId(String roomCode) { return "room:code:" + roomCode; }
    private String keyRoomReady(Long roomId) { return "room:ready:" + roomId; }
    private String keyRoomMembers(Long roomId) { return "room:members:" + roomId; }

    @Transactional
    public RoomSettingPatchResponse updateRoomSetting(
            String email,
            String roomCode,
            RoomSettingPatchRequest request
    ){
        // 0) 입력 검증
        if(roomCode==null || roomCode.isBlank()){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"roomCode는 필수입니다.");
        }
        if(request==null){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"요청 바디가 필요합니다.");
        }

        // 1) member 조회
        Member member= memberRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "존재하지 않는 사용자입니다."
                ));

        // 2) roomCode -> roomId
        Object roomIdObj = redisTemplate.opsForValue().get(keyRoomCodeToId(roomCode));
        if(roomIdObj == null){
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,"유효하지 않거나 만료된 방 코드입니다."
            );
        }

        Long roomId;
        try {
            roomId = Long.parseLong(String.valueOf(roomIdObj));
        } catch (NumberFormatException e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "방 코드 매핑 오류");
        }

        // 3) Room 조회
        Room room = roomRepository.findById(roomId)
                .orElseThrow(()-> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,"방을 찾을 수 없습니다."
                ));

        // 4) 상태 검증 (대기방만 가능)
        if(Boolean.TRUE.equals(room.getIsOpen())){
            throw  new ResponseStatusException(
                    HttpStatus.CONFLICT,"게임 진행 중에는 방 정보를 수정할 수 없습니다."
            );
        }

        // 5) 방장 검증
        boolean isHost = roomParticipantsRepository
                .findByRoom_RoomIdAndUser_Id(roomId, member.getId())
                .map(rp -> Boolean.TRUE.equals(rp.getIsHost()) && !Boolean.TRUE.equals(rp.getIsLeft()))
                .orElse(false);

        if(!isHost){
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "방장만 방 정보를 수정할 수 있습니다."
            );
        }

        // 6) 값 검증 + 수정
        boolean changed = false;

        if(request.title() != null){
            if(request.title().isBlank() || request.title().length() > 30){
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "방 제목은 1~30자여야 합니다."
                );
            }
            room.setTitle(request.title());
            changed = true;
        }

        if(request.topic() != null){
            if(request.topic().isBlank() || request.topic().length()>40){
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,"방 주제는 1~40자여야 합니다."
                );
            }
            room.setTopic(request.topic());
            changed = true;
        }

        if(request.turnCnt() !=null){
            if(request.turnCnt() < 1 || request.turnCnt()>5){
                throw  new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,"턴 수는 3~5 사이어야 합니다."
                );
            }
            room.setTurnCnt(request.turnCnt());
            changed = true;
        }

        if(!changed){
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,"수정할 값이 없습니다."
            );
        }

        roomRepository.save(room);

        // 7) READY 상태 초기화 (방장 제외)
        Set<Object> members = redisTemplate.opsForSet().members(keyRoomMembers(roomId));
        if(members !=null) {
            for(Object m : members){
                String userIdStr = String.valueOf(m);
                if(!userIdStr.equals(String.valueOf(member.getId()))){
                    redisTemplate.opsForHash().put(
                            keyRoomReady(roomId),
                            userIdStr,
                            "NOT_READY"
                    );
                }
            }
        }

        // TTL 보정
        redisTemplate.expire(keyRoomReady(roomId),ROOM_TTL_HOURS, TimeUnit.HOURS);

        // 8) WebSokect 브로드캐스트
        RoomSettingPatchResponse payload = RoomSettingPatchResponse.builder()
                .roomId(roomId)
                .roomCode(roomCode)
                .title(room.getTitle())
                .topic(room.getTopic())
                .turnCnt(room.getTurnCnt())
                .readyReset(true)
                .build();

        roomSocketService.broadcast(
                roomCode,
                RoomWsMessage.of(
                        WsType.ROOM_UPDATED,
                        roomCode,
                        email,
                        payload
                )
        );


        return RoomSettingPatchResponse.builder()
                .roomId(roomId)
                .roomCode(roomCode)
                .title(room.getTitle())
                .topic(room.getTopic())
                .turnCnt(room.getTurnCnt())
                .readyReset(true)
                .build();
    }
}
