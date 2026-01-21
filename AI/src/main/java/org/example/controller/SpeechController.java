package org.example.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.service.AzureSpeechService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/speech")
@RequiredArgsConstructor
@Slf4j
public class SpeechController {

    private final AzureSpeechService azureSpeechService;
    private final SpeechExceptionHandler exceptionHandler;

    private int timeoutSeconds = 10;

    @PostMapping("/assessment")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> assessPronunciation(
            @RequestParam("audio") MultipartFile audioFile,
            @RequestParam("text") String referenceText,
            @RequestParam("sequence") Long sequence) throws IOException {

        log.info("발음 평가 요청 - seq: {}, text: {}", sequence, referenceText);

        return azureSpeechService.getPronunciationScoreAsync(
                        audioFile.getBytes(), referenceText
                )
                .orTimeout(timeoutSeconds, TimeUnit.SECONDS)
                .thenApply(score -> {
                    log.info("발음 평가 완료 - seq: {}, score: {}", sequence, score);

                    // HashMap 사용!
                    Map<String, Object> response = new HashMap<>();
                    response.put("sequence", sequence);
                    response.put("score", score);
                    response.put("referenceText", referenceText);

                    return ResponseEntity.ok(response);
                })
                .exceptionally(ex -> exceptionHandler.handle(ex, sequence));
    }
}