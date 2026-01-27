package com.example.DuckDuck.domain.ai.controller;

import com.example.DuckDuck.domain.user.repository.MemberRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.example.DuckDuck.domain.ai.dto.TranslateRequest;
import com.example.DuckDuck.domain.ai.service.TranslateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Tag(name = "GPT", description = "번역, 주제 추천")
@RestController
@RequestMapping("/api/v1/gpt")
@RequiredArgsConstructor
@Slf4j
public class GptController {

    private final TranslateService translateService;
    private final GptExceptionHandler exceptionHandler;
    private final int timeoutSeconds = 10;
    private final MemberRepository memberRepository;

    /**
     * 번역 API - Redis에 저장
     * POST /api/v1/gpt/translate
     * Body: {
     *   "roomId": "1",
     *   "text": "안녕하세요",
     *   "turnNo": 1,
     *   "speakerId": 100
     * }
     */
    @Operation(
            summary = "스크립트 생성 및 redis에 저장",
            description = "생성된 스크립트를 Redis에 임시 저장합니다."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "성공적으로 저장됨"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
    })
    @PostMapping("/translate")
    public CompletableFuture<ResponseEntity<Map<String, String>>> translate(
            @Valid @RequestBody TranslateRequest request) {

        log.info("번역 요청 - roomId: {}, turn: {}, speaker: {}",
                request.getRoomId(), request.getTurnNo(), request.getSpeakerId());

        return translateService.translateAndSaveToRedis(
                        request.getRoomId(),
                        request.getText(),
                        request.getTurnNo(),
                        request.getSpeakerId())
                .orTimeout(timeoutSeconds, TimeUnit.SECONDS)
                .thenApply(success -> {
                    if (success) {
                        log.info("번역 완료 - roomId: {}, turn: {}",
                                request.getRoomId(), request.getTurnNo());
                        return ResponseEntity.ok(Map.of("message", "저장 완료"));
                    } else {
                        log.error("번역 실패 - roomId: {}, turn: {}",
                                request.getRoomId(), request.getTurnNo());
                        return ResponseEntity.status(500).body(Map.of("message", "저장 실패"));
                    }
                })
                .exceptionally(exceptionHandler::handle);
    }
}