package com.example.DuckDuck.domain.room.controller;

import com.example.DuckDuck.domain.room.dto.response.RoomLobbyResponse;
import com.example.DuckDuck.domain.room.service.RoomLobbyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/rooms")
@RequiredArgsConstructor
@Tag(name = "Room", description = "방 관련 API")
public class RoomLobbyController {

    private final RoomLobbyService roomLobbyService;

    @Operation(
            summary = "대기방 상태 조회",
            description = "방 코드(roomCode)를 이용해 대기방의 참가자 목록, 준비 상태, 방 오픈 여부를 조회한다."
    )
    @GetMapping("/lobby")
    public ResponseEntity<RoomLobbyResponse> getLobbyStatus(
            @Parameter(
                    description = "대기방 입장에 사용되는 방 코드",
                    example = "QKO3IF",
                    required = true
            )
            @RequestParam String roomCode
    ) {
        return ResponseEntity.ok(roomLobbyService.getLobbyStatus(roomCode));
    }
}