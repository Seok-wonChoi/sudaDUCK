package com.example.DuckDuck.domain.ai.controller;

import com.example.DuckDuck.domain.ai.service.EnglishQuizEventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 영어 퀴즈 API
 */
@RestController
@RequestMapping("/api/v1/quiz")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "English Quiz", description = "영어 퀴즈 API")
public class EnglishQuizEventController {

    private final EnglishQuizEventService quizService;

    /**
     * 퀴즈 스케줄 등록
     * 
     * 3번째 턴 시작 시 호출
     */
    @PostMapping("/schedule")
    @Operation(summary = "퀴즈 스케줄", 
               description = "3번째 턴 시작 시 호출. 15-40초 후 랜덤 발생")
    public ResponseEntity<Void> schedule(
            @RequestParam Long roomId,
            @RequestParam Integer turn,
            @RequestParam Integer participantCount) {
        
        log.info("퀴즈 스케줄 요청 - roomId: {}, turn: {}, participants: {}", 
                roomId, turn, participantCount);
        
        quizService.scheduleTurnQuiz(roomId, turn, participantCount);
        return ResponseEntity.ok().build();
    }

    /**
     * 답변 제출
     */
    @PostMapping("/submit")
    @Operation(summary = "답변 제출", description = "영어 답변 제출")
    public ResponseEntity<Void> submit(
            @RequestParam String quizId,
            @RequestParam Long userId,
            @RequestBody String answer) {
        
        log.info("답변 제출 - quizId: {}, userId: {}", quizId, userId);
        
        quizService.submitAnswer(quizId, userId, answer);
        return ResponseEntity.ok().build();
    }
}
