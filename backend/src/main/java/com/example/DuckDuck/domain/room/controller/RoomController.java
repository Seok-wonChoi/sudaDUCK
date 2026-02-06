package com.example.DuckDuck.domain.room.controller;

import com.example.DuckDuck.domain.room.dto.request.RoomCreateRequest;
import com.example.DuckDuck.domain.room.dto.request.RoomJoinRequest;
import com.example.DuckDuck.domain.room.dto.request.RoomLeaveRequest;
import com.example.DuckDuck.domain.room.dto.response.RoomCreateResponse;
import com.example.DuckDuck.domain.room.dto.response.RoomJoinResponse;
import com.example.DuckDuck.domain.room.dto.response.RoomLeaveResponse;
import com.example.DuckDuck.domain.room.service.RoomService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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
    public ResponseEntity<?> createRoom(
            @Parameter(hidden = true) Authentication authentication,
            @Valid @RequestBody RoomCreateRequest request
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        String email = (String) authentication.getPrincipal();

        try {
            // 서비스 내부에서 validateText()가 실행되며 욕설 시 IllegalArgumentException 발생
            RoomCreateResponse response = roomService.createRoomByEmail(email, request);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            // 서비스에서 적어준 "방 주제에 부적절한 표현이..." 메시지가 e.getMessage()에 담김
            // 이를 그대로 프론트에 400 에러와 함께 반환
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "status", 400,
                            "error", "Bad Request",
                            "message", e.getMessage()
                    ));
        }
    }

    // 방 참가(코드 입력)
    @Operation(
            summary = "방 참가",
            description = "로그인한 사용자가 roomCode로 대기방에 참가합니다. 게임이 시작된 방(isOpen=true)은 참가할 수 없습니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "방 참가 성공"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
            @ApiResponse(responseCode = "400", description = "유효하지 않은 roomCode 또는 잘못된 요청"),
            @ApiResponse(responseCode = "409", description = "이미 시작된 방")
    })
    @PostMapping("/join")
    public ResponseEntity<RoomJoinResponse> joinRoom(
            @Parameter(hidden = true) Authentication authentication,
            @Valid @RequestBody RoomJoinRequest request
    ) {
        String email = (authentication != null) ? (String) authentication.getPrincipal() : null;

        if (email == null) {
            return ResponseEntity.status(401).build();
        }

        RoomJoinResponse response = roomService.joinRoom(email, request);
        return ResponseEntity.ok(response);
    }

    // 방 나가기
    @Operation(
            summary = "방 나가기",
            description = "로그인한 사용자가 대기방에서 나갑니다. 방장이 나가면 방이 종료됩니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "방 나가기 성공"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
            @ApiResponse(responseCode = "400", description = "유효하지 않은 roomCode 또는 잘못된 요청"),
            @ApiResponse(responseCode = "404", description = "방 또는 참가자 정보가 없음")
    })
    @PostMapping("/leave")
    public ResponseEntity<RoomLeaveResponse> leaveRoom(
            @Parameter(hidden = true) Authentication authentication,
            @Valid @RequestBody RoomLeaveRequest request
    ) {
        String email = (authentication != null) ? (String) authentication.getPrincipal() : null;

        if (email == null) {
            return ResponseEntity.status(401).build();
        }

        RoomLeaveResponse response = roomService.leaveRoom(email, request);
        return ResponseEntity.ok(response);
    }
}