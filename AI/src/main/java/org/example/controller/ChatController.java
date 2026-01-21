package org.example.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.dto.ChatResponse;
import org.example.service.ChatService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * 채팅 API 엔드포인트
 * - HTTP 요청/응답만 처리
 * - 비즈니스 로직은 Service에 위임
 */
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final ChatService chatService;
    private final ChatExceptionHandler exceptionHandler;

    private int timeoutSeconds = 10;

    /**
     * POST /api/chat/translate?roomId=xxx
     * Body: {"text": "안녕하세요", "sequence": 1}
     */
    @PostMapping("/translate")
    public CompletableFuture<ResponseEntity<ChatResponse>> translate(
            @RequestParam String roomId,
            @RequestParam String text,
            @RequestParam Long sequence) {

        // 파라미터 무결성 검증 (roomId 는 실제 있는 방인지 확인하는거 필요하지 않을까?)
        if (roomId == null || roomId.trim().isEmpty()) {
            return CompletableFuture.completedFuture(
                    ResponseEntity.badRequest()
                            .body(ChatResponse.error(sequence, "INVALID_ROOM_ID", "방이 존재하지 않습니다."))
            );
        }

        if (text == null || text.trim().isEmpty()) {
            return CompletableFuture.completedFuture(
                    ResponseEntity.badRequest()
                            .body(ChatResponse.error(sequence, "INVALID_TEXT", "빈 텍스트 입니다."))
            );
        }

        log.info("요청 수신 - roomId: {}, seq: {}", roomId, sequence);

        return chatService.translateAndGenerateAudio(roomId, text, sequence)
                .orTimeout(timeoutSeconds, TimeUnit.SECONDS)
                .thenApply(ResponseEntity::ok)
                .exceptionally(ex -> exceptionHandler.handle(ex, sequence));
    }
}
