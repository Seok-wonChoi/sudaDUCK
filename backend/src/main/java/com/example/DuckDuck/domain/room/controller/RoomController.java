package com.example.DuckDuck.domain.room.controller;

import com.example.DuckDuck.domain.room.dto.request.RoomCreateRequest;
import com.example.DuckDuck.domain.room.dto.request.RoomJoinRequest;
import com.example.DuckDuck.domain.room.dto.response.RoomCreateResponse;
import com.example.DuckDuck.domain.room.dto.response.RoomJoinResponse;
import com.example.DuckDuck.domain.room.service.RoomService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;


@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/rooms")
public class RoomController {

    private final RoomService roomService;

    // 방 생성
    @Operation(
            summary = "방 생성",
            description = "로그인한 사용자가 방을 생성하고 방장으로 등록됩니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "방 생성 성공"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청")
    })
    @PostMapping
    public ResponseEntity<RoomCreateResponse> createRoom(
            @Parameter(hidden = true) Authentication authentication,
            @Valid @RequestBody RoomCreateRequest request
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        String email = (String) authentication.getPrincipal();

        RoomCreateResponse response = roomService.createRoomByEmail(email, request);
        return ResponseEntity.ok(response);
    }


    // 방 참가(코드 입력)
    @Operation(
            summary = "방 참가",
            description = "로그인된 사용자가 참가 코드(roomCode)로 대기방에 입장합니다. 게임이 시작된 방(is_open=true)은 입장할 수 없습니다."
    )
    @PostMapping("/join")
    public ResponseEntity<RoomJoinResponse> joinRoom(
            Authentication authentication,
            @Valid @RequestBody RoomJoinRequest request
    ) {
        // JwtAuthenticationFilter에서 principal=email로 넣어둔 상태
        String email = (authentication != null) ? (String) authentication.getPrincipal() : null;

        // Security 설정에서 401을 처리한다면 아래 null 체크는 생략 가능
        if (email == null) {
            return ResponseEntity.status(401).build();
        }

        RoomJoinResponse response = roomService.joinRoom(email, request);
        return ResponseEntity.ok(response);
    }
}
