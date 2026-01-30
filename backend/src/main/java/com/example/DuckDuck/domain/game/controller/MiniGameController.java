package com.example.DuckDuck.domain.game.controller;

import com.example.DuckDuck.domain.game.dto.response.ReviewQuestionResponse;
import com.example.DuckDuck.domain.game.service.MiniGameService;
import com.example.DuckDuck.global.security.jwt.JwtTokenProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "MiniGame", description = "miniGame 관련 API")
@RestController
@RequestMapping("api/v1/mini_game")
@RequiredArgsConstructor
public class MiniGameController {

    private final MiniGameService miniGameService;
    private final JwtTokenProvider jwtTokenProvider;

    @Operation(
            summary = "미니게임 입력하세요 랜덤 4문제를 조회합니다.",
            description = "미니게임 입력하세요에 나오는 개인별 랜덤 4문제를 조회할 수 있습니다."
    )
    @GetMapping("/{roomId}/review/questions")
    public ResponseEntity<List<ReviewQuestionResponse>> getQuestions(
            @Parameter(hidden = true) Authentication authentication,
            @PathVariable Long roomId){

        String token = (String) authentication.getCredentials();
        Long userId = jwtTokenProvider.getUserId(token);

        List<ReviewQuestionResponse> questions = miniGameService.getReviewQuestions(userId, roomId);
        return ResponseEntity.ok(questions);
    }
}
