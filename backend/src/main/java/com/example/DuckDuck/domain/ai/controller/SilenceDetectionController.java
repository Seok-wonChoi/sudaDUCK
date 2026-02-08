package com.example.DuckDuck.domain.ai.controller;

import com.example.DuckDuck.domain.ai.service.SilenceDetectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 중앙 집중식 정적 감지 API
 */
@RestController
@RequestMapping("/api/v1/silence/central")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Central Silence Detection", description = "중앙 집중식 정적 감지 API")
public class SilenceDetectionController {

    private final SilenceDetectionService silenceService;

    /**
     * 음성 활동 알림
     *
     * 프론트에서 누군가 말할 때마다 호출
     */
    @PostMapping("/voice-activity")
    @Operation(
            summary = "음성 활동 알림",
            description = """
                    누군가 말을 시작하면 호출합니다.
                    
                    백엔드에서 방의 마지막 음성 활동 시간을 업데이트하고,
                    15초 동안 추가 호출이 없으면 자동으로 추천 질문을 생성하여
                    WebSocket으로 모든 참가자에게 전송합니다.
                    """
    )
    public ResponseEntity<Void> reportVoiceActivity(
            @RequestParam Long roomId,
            @RequestParam Long userId,
            @RequestParam Integer turn) {

        log.info("음성 활동 API 호출 - roomId: {}, userId: {}, turn: {}", roomId, userId, turn);

        silenceService.reportVoiceActivity(roomId, userId, turn);

        return ResponseEntity.ok().build();
    }

    /**
     * 모니터링 시작 (방 입장 시)
     */
    @PostMapping("/start-monitoring")
    @Operation(summary = "모니터링 시작", description = "방 입장 시 정적 감지 시작")
    public ResponseEntity<Void> startMonitoring(
            @RequestParam Long roomId,
            @RequestParam(defaultValue = "1") Integer turn) {

        log.info("모니터링 시작 API 호출 - roomId: {}, turn: {}", roomId, turn);

        silenceService.startMonitoring(roomId, turn);

        return ResponseEntity.ok().build();
    }

    /**
     * 모니터링 종료
     */
    @PostMapping("/stop-monitoring")
    @Operation(summary = "모니터링 종료", description = "방 퇴장 시 정적 감지 종료")
    public ResponseEntity<Void> stopMonitoring(@RequestParam Long roomId) {

        log.info("모니터링 종료 API 호출 - roomId: {}", roomId);

        silenceService.stopMonitoring(roomId);

        return ResponseEntity.ok().build();
    }
}
