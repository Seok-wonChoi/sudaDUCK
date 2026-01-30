package com.example.DuckDuck.domain.game.controller;

import com.example.DuckDuck.domain.game.dto.response.ScriptResponse;
import com.example.DuckDuck.domain.game.service.SessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Session", description = "session 관련 API")
@RestController
@RequestMapping("api/v1/session")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    @Operation(
            summary = "session별 쉐도잉 문제를 조회합니다.",
            description = "한 게임에서 나온 모든 스크립트 쉐도잉 문제를 모두 조회합니다."
    )
    @GetMapping("/{roomId}/turns/{turnNo}/scripts")
    public ResponseEntity<List<ScriptResponse>> getTurnScripts(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long roomId,
            @PathVariable Integer turnNo){

        String token = authHeader.substring(7);
        List<ScriptResponse> scripts = sessionService.getScriptsByTurn(token, roomId, turnNo);
        return ResponseEntity.ok(scripts);
    }

}
