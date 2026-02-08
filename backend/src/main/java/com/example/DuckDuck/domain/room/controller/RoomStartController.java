package com.example.DuckDuck.domain.room.controller;

import com.example.DuckDuck.domain.room.dto.response.RoomStartResponse;
import com.example.DuckDuck.domain.room.service.RoomStartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/rooms")
public class RoomStartController {

    private final RoomStartService roomStartService;

    @Operation(
            summary = "대화 시작(방장)",
            description = "방장이 대기방에서 대화를 시작합니다. (전원 READY일 때만 가능)"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "대화 시작 성공"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
            @ApiResponse(responseCode = "403", description = "방장이 아님"),
            @ApiResponse(responseCode = "409", description = "준비 미완료(READY 아님/없음) 또는 이미 시작됨"),
            @ApiResponse(responseCode = "400", description = "유효하지 않은 roomCode 또는 잘못된 요청"),
            @ApiResponse(responseCode = "404", description = "방 없음")
    })
    @PostMapping("/{roomCode}/start")
    public ResponseEntity<RoomStartResponse> startRoom(
            @Parameter(hidden = true) Authentication authentication,
            @PathVariable String roomCode
    ) {
        if(authentication == null || !authentication.isAuthenticated()){
            return ResponseEntity.status(401).build();
        }

        String email = (String) authentication.getPrincipal();
        if (email == null || email.isBlank()) {
            return ResponseEntity.status(401).build();
        }

        return ResponseEntity.ok(roomStartService.startRoom(email, roomCode));
    }
}
