package com.example.DuckDuck.domain.ai.controller;

import com.example.DuckDuck.domain.ai.service.SilenceDetectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 정적 감지 대화 추천 API
 * 
 * 프론트엔드에서 일정 시간 동안 음성 입력이 없을 때 호출
 */
@RestController
@RequestMapping("/api/v1/silence")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Silence Detection", description = "정적 감지 대화 추천 API")
public class SilenceDetectionController {

    private final SilenceDetectionService silenceService;

    /**
     * 정적 감지 시 대화 추천 요청
     * 
     * @param roomId 방 ID
     * @param turn 현재 턴
     * @return 추천 대화 주제/질문
     */
    @PostMapping("/suggest")
    @Operation(
            summary = "대화 추천 생성",
            description = """
                    정적(침묵) 감지 시 대화 추천을 생성합니다.
                    
                    동작 방식:
                    - 대화 내용이 있으면: 맥락에 맞는 후속 질문 생성
                    - 대화 내용이 없으면: 방 주제 기반 시작 질문 생성
                    
                    프론트엔드 권장 사항:
                    - 10초 정도 음성 입력이 없을 때 호출
                    - 중복 호출 방지 (연속 호출 금지)
                    """
    )
    public ResponseEntity<SilenceDetectionService.ConversationSuggestion> suggest(
            @Parameter(description = "방 ID", required = true)
            @RequestParam Long roomId,
            
            @Parameter(description = "현재 턴", required = true)
            @RequestParam Integer turn) {

        log.info("정적 감지 API 호출 - roomId: {}, turn: {}", roomId, turn);

        SilenceDetectionService.ConversationSuggestion suggestion = 
                silenceService.generateSuggestion(roomId, turn);

        return ResponseEntity.ok(suggestion);
    }
}
