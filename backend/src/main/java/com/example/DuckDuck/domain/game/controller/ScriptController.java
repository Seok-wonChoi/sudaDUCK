package com.example.DuckDuck.domain.game.controller;

import com.example.DuckDuck.domain.game.dto.response.MySentenceResponse;
import com.example.DuckDuck.domain.game.entity.Sentence;
import com.example.DuckDuck.domain.game.service.ScriptService;
import com.example.DuckDuck.global.security.jwt.JwtTokenProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Tag(name = "Script", description = "스크립트 관련 API")
@RestController
@RequestMapping("api/v1/script")
@RequiredArgsConstructor
public class ScriptController {

    private final ScriptService scriptService;
    private final JwtTokenProvider jwtTokenProvider;

    @Operation(
            summary = "문장 좋아요 저장",
            description = "Redis에 임시 저장된 스크립트를 MySQL 'sentence' 테이블로 영구 저장합니다."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "성공적으로 저장됨"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
            @ApiResponse(responseCode = "404", description = "Redis에서 해당 스크립트를 찾을 수 없음")
    })
    @PostMapping("/{scriptId}/like")
    public ResponseEntity<Map<String, Object>> like(
            @RequestHeader("Authorization") String authHeader,
                                       @RequestParam(required = false) Long roomId,
                                       @RequestParam(required = false) Integer turnNo,
                                       @PathVariable String scriptId){

        String token = authHeader.substring(7);
        Long userId = jwtTokenProvider.getUserId(token);

        Map<String, Object> result = scriptService.
                likeSentence(userId, roomId, turnNo, scriptId);

        return ResponseEntity.ok(result);
    }

    @Operation(
            summary = "내가 좋아요한 문장 조회",
            description = "내가 좋아요를 눌러 저장한 문장 목록을 최신순으로 가져옵니다."
    )
    @GetMapping("/my")
    public ResponseEntity<List<MySentenceResponse>> getMySentences(
            @AuthenticationPrincipal String email
    ) {
        List<MySentenceResponse> response = scriptService.getMySentences(email);
        return ResponseEntity.ok(response);
    }
}
