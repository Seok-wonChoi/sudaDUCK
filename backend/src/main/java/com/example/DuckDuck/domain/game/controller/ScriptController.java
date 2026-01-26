package com.example.DuckDuck.domain.game.controller;

import com.example.DuckDuck.domain.game.service.ScriptService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Script", description = "스크립트 관련 API")
@RestController
@RequestMapping("api/v1/script")
@RequiredArgsConstructor
public class ScriptController {

    private final ScriptService scriptService;

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
    public ResponseEntity<String> like(@AuthenticationPrincipal String email,
                                       @RequestParam Long roomId,
                                       @RequestParam int turnNo,
                                       @PathVariable String scriptId){
        scriptService.likeSentence(email, roomId, turnNo, scriptId);
        return ResponseEntity.ok("좋아요 저장 완료!");
    }
}
