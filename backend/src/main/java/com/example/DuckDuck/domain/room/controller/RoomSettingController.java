package com.example.DuckDuck.domain.room.controller;

import com.example.DuckDuck.domain.room.dto.request.RoomSettingPatchRequest;
import com.example.DuckDuck.domain.room.dto.response.RoomSettingPatchResponse;
import com.example.DuckDuck.domain.room.service.RoomSettingService;
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
public class RoomSettingController {

    private final RoomSettingService roomSettingService;

    @Operation(
            summary = "방 정보 수정",
            description = """
                    방장이 대기방 상태에서 방 제목, 주제, 턴 수를 수정합니다.
                    - 방장만 수정 가능합니다.
                    - 게임 진행 중(isOpen=true)에는 수정할 수 없습니다.
                    - 방 정보 수정 시 모든 참가자의 READY 상태가 초기화됩니다.
                    """
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "방 정보 수정 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 (입력값 오류)"),
            @ApiResponse(responseCode = "403", description = "방장이 아님"),
            @ApiResponse(responseCode = "404", description = "존재하지 않는 방"),
            @ApiResponse(responseCode = "409", description = "게임 진행 중으로 수정 불가")
    })
    @PatchMapping("/{roomCode}/settings")
    public ResponseEntity<RoomSettingPatchResponse> updateRoomSetting(
            @Parameter(description = "방 코드", example = "AB12CD")
            @PathVariable String roomCode,

            @RequestBody RoomSettingPatchRequest request,
            Authentication authentication
    ) {
        String email = authentication.getName();

        return ResponseEntity.ok(
                roomSettingService.updateRoomSetting(email, roomCode, request)
        );
    }
}
