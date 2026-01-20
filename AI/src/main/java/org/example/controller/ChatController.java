package org.example.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.dto.ChatRequest;
import org.example.dto.ChatResponse;
import org.example.service.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import org.springframework.http.HttpStatus;
import org.example.exception.GptServiceException;
import org.example.exception.AzureSpeechException;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final ChatService chatService;

    /**
     * 비동기 방식 : CompletableFuture 반환
     * POST /api/chat/translate-async
     * - 동시 요청이 들어와도 각각 별도 쓰레드에서 처리
     * - 순서는 응답의 sequence 필드로 클라이언트가 정렬
     */
    @PostMapping("/translate")
    public CompletableFuture<ResponseEntity<ChatResponse>> translateAsync(
            @RequestParam String roomId,
            @RequestBody ChatRequest request) {

        log.info("비동기 요청 시작 - roomId: {}, seq: {}", roomId, request.getSequence());

        return chatService.translateAndGenerateAudioAsync(
                        roomId,
                        request.getText(),
                        request.getSequence()
                )
                .orTimeout(5, TimeUnit.SECONDS) // 5초 타임아웃 설정
                .thenApply(ResponseEntity::ok)
                .exceptionally(ex -> {
                    Throwable cause = (ex instanceof java.util.concurrent.CompletionException)
                            ? ex.getCause() : ex;

                    // 타임아웃
                    if (cause instanceof TimeoutException) {
                        log.error("타임아웃 발생 (5s) - seq: {}", request.getSequence());
                        return ResponseEntity.status(HttpStatus.REQUEST_TIMEOUT)
                                .body(ChatResponse.error(request.getSequence(), "TIMEOUT",
                                        "처리 시간 초과"));
                    }

                    // GPT 관련 에러
                    if (cause instanceof GptServiceException) {
                        GptServiceException gptEx = (GptServiceException) cause;
                        log.error("GPT 오류 - seq: {}, code: {}",
                                request.getSequence(), gptEx.getErrorCode());
                        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                                .body(ChatResponse.error(request.getSequence(),
                                        gptEx.getErrorCode(), gptEx.getMessage()));
                    }

                    // Azure 관련 에러
                    if (cause instanceof AzureSpeechException) {
                        log.error("Azure Speech 오류 - seq: {}", request.getSequence());
                        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                                .body(ChatResponse.error(request.getSequence(),
                                        "AZURE_ERROR", cause.getMessage()));
                    }

                    // 기타 에러
                    log.error("비동기 처리 중 예기치 않은 오류 - seq: {}, error: {}",
                            request.getSequence(), cause.getMessage(), cause);
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(ChatResponse.error(request.getSequence(),
                                    "SERVER_ERROR", "서버 내부 오류가 발생했습니다."));
                });
    }
}
