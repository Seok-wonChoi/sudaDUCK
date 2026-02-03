package com.example.DuckDuck.domain.game.controller;

import com.example.DuckDuck.domain.game.dto.response.ScriptResponse;
import com.example.DuckDuck.domain.game.dto.response.SessionResultResponse;
import com.example.DuckDuck.domain.game.service.SessionService;
import com.example.DuckDuck.global.security.jwt.JwtTokenProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Session", description = "session 관련 API")
@RestController
@RequestMapping("api/v1/session")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;
    private final JwtTokenProvider jwtTokenProvider;

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
        Long userId = jwtTokenProvider.getUserId(token);

        List<ScriptResponse> scripts = sessionService.getScriptsByTurn(userId, roomId, turnNo);
        return ResponseEntity.ok(scripts);
    }

    @Operation(
            summary = "session별 스크립트, 개인점수, 평균 점수를 조회합니다.",
            description = "한 게임에서 나온 모든 스크립트와 점수를 모두 조회합니다."
    )
    @GetMapping("/room/{roomId}/turn/{turnNo}/results")
    public ResponseEntity<List<SessionResultResponse>> getTurnResults(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long roomId,
            @PathVariable Integer turnNo) {

        String token = authHeader.substring(7);
        Long userId = jwtTokenProvider.getUserId(token);

        List<SessionResultResponse> results = sessionService.getSessionResults(roomId, turnNo, userId);
        return ResponseEntity.ok(results);
    }
}
