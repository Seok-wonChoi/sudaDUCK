package com.example.DuckDuck.domain.game.controller;

import com.example.DuckDuck.domain.game.dto.response.ScriptResponse;
import com.example.DuckDuck.domain.game.service.SessionService;
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

    @Operation(
            summary = "session별 쉐도잉 문제를 조회합니다.",
            description = "한 게임에서 나온 모든 스크립트 쉐도잉 문제를 모두 조회합니다."
    )
    @GetMapping("/{roomId}/turns/{turnNo}/scripts")
    public ResponseEntity<List<ScriptResponse>> getTurnScripts(
            @Parameter(hidden = true) Authentication authentication,
            @PathVariable Long roomId,
            @PathVariable Integer turnNo){

        if (authentication == null){
            return ResponseEntity.status(401).build();
        }

        String email = (String) authentication.getPrincipal();

        List<ScriptResponse> scripts = sessionService.getScriptsByTurn(email, roomId, turnNo);
        return ResponseEntity.ok(scripts);
    }

//    @Operation(
//            summary = "session별 스크립트, 개인점수, 평균 점수를 조회합니다.",
//            description = "한 게임에서 나온 모든 스크립트와 점수를 모두 조회합니다."
//    )
//    @GetMapping("/report/{roomId}/turns/{turnNo}/scripts")
//    public ResponseEntity<List<SessionResultResponse>> get
}
