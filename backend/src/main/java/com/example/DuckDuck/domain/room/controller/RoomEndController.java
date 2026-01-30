package com.example.DuckDuck.domain.room.controller;

import com.example.DuckDuck.domain.room.dto.response.RoomEndResponse;
import com.example.DuckDuck.domain.room.service.RoomEndService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/rooms")
@RequiredArgsConstructor
public class RoomEndController {

    private final RoomEndService roomEndService;

    @Operation(
            summary = "대기방 활성화 (게임 종료)",
            description = "게임 및 복습 게임이 종료되었을 때 방 상태를 대기방으로 전환합니다. " +
                    "isOpen 값을 false로 변경하여 새로운 참가자의 입장을 허용합니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "대기방 전환 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 roomCode 또는 요청"),
            @ApiResponse(responseCode = "403", description = "해당 방 참가자가 아님"),
            @ApiResponse(responseCode = "404", description = "방을 찾을 수 없음")
    })
    @PostMapping("/{roomCode}/end")
    public ResponseEntity<RoomEndResponse> endRoom(
            @Parameter(description = "방 코드", example = "QKO3IF")
            @PathVariable String roomCode,
            Authentication authentication
    ) {
        String email = authentication.getName(); // JWT principal email
        return ResponseEntity.ok(roomEndService.endRoom(email, roomCode));
    }
}
