package com.example.DuckDuck.domain.room.controller;

import com.example.DuckDuck.domain.room.dto.request.RoomReadyPatchRequest;
import com.example.DuckDuck.domain.room.dto.response.RoomReadyPatchResponse;
import com.example.DuckDuck.domain.room.service.RoomReadyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/rooms")
public class RoomReadyController {

    private final RoomReadyService roomReadyService;

    @Operation(
            summary = "준비 상태 변경",
            description = "대기방 참가자가 준비/준비해제를 토글합니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "준비 상태 변경 성공"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
            @ApiResponse(responseCode = "400", description = "유효하지 않은 roomCode 또는 잘못된 요청")
    })
    @PatchMapping("/{roomCode}/ready")
    public ResponseEntity<RoomReadyPatchResponse> patchReady(
            @Parameter(hidden = true) Authentication authentication,
            @PathVariable String roomCode,
            @Valid @RequestBody RoomReadyPatchRequest request
    ) {
        String email = (authentication != null) ? (String) authentication.getPrincipal() : null;
        if (email == null) return ResponseEntity.status(401).build();

        return ResponseEntity.ok(roomReadyService.patchReady(email, roomCode, request));
    }
}
