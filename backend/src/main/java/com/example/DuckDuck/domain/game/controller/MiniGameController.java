package com.example.DuckDuck.domain.game.controller;

import com.example.DuckDuck.domain.game.dto.response.ReviewQuestionResponse;
import com.example.DuckDuck.domain.game.dto.request.ReviewSubmitRequest;
import com.example.DuckDuck.domain.game.dto.response.ReviewRankingResponse;
import com.example.DuckDuck.domain.game.dto.response.ReviewSubmitResponse;
import com.example.DuckDuck.domain.game.service.MiniGameService;
import com.example.DuckDuck.global.security.jwt.JwtTokenProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "MiniGame", description = "miniGame 관련 API")
@RestController
@RequestMapping("api/v1/mini_game")
@RequiredArgsConstructor
public class MiniGameController {

    private final MiniGameService miniGameService;
    private final JwtTokenProvider jwtTokenProvider;

    @Operation(
            summary = "미니게임 랜덤 4문제 조회",
            description = "복습 게임에 필요한 개인별 랜덤 4문제를 조회합니다."
    )
    @GetMapping("/{roomId}/review/questions")
    public ResponseEntity<List<ReviewQuestionResponse>> getQuestions(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long roomId){

        String token = authHeader.substring(7);
        Long userId = jwtTokenProvider.getUserId(token);

        List<ReviewQuestionResponse> questions = miniGameService.getReviewQuestions(userId, roomId);
        return ResponseEntity.ok(questions);
    }

    @Operation(
            summary = "미니게임 정답 제출",
            description = "복습 게임 정답을 제출하고 맞춘 개수와 메시지를 반환합니다."
    )
    @PostMapping("/{roomId}/review/submit")
    public ResponseEntity<ReviewSubmitResponse> submitReview(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long roomId,
            @RequestBody ReviewSubmitRequest request){

        String token = authHeader.substring(7);
        Long userId = jwtTokenProvider.getUserId(token);

        ReviewSubmitResponse response = miniGameService.submitReviewAnswers(userId, roomId, request);

        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "복습 게임 랭킹 조회",
            description = "복습 게임 종료 후 참여자들의 점수와 프로필 정보를 순위별로 조회합니다."
    )
    @GetMapping("/{roomId}/review/ranking")
    public ResponseEntity<List<ReviewRankingResponse>> getRanking(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long roomId) {

        String token = authHeader.substring(7);
        Long userId = jwtTokenProvider.getUserId(token);

        List<ReviewRankingResponse> ranking = miniGameService.getReviewRanking(userId, roomId);

        return ResponseEntity.ok(ranking);
    }
}
