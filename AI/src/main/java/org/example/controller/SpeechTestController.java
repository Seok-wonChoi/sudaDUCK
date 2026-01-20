package org.example.controller;

import org.example.service.AzureSpeechService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/speech")
@RequiredArgsConstructor
public class SpeechTestController {

    private final AzureSpeechService azureSpeechService;

    // 발음 평가 테스트
    @PostMapping("/test-assessment")
    public String testAssessment(
            @RequestParam("file") MultipartFile file,
            @RequestParam("text") String text) {
        try {
            Integer score = azureSpeechService.getPronunciationScore(file.getBytes(), text);
            return "발음 평가 점수: " + score;
        } catch (Exception e) {
            return "에러 발생: " + e.getMessage();
        }
    }

    // TTS 생성 테스트
    @GetMapping("/test-tts")
    public String testTts(@RequestParam("text") String text, @RequestParam("roomId") String roomId) {
        try {
            String ttsUrl = azureSpeechService.generateTTS(text, roomId);

            if (ttsUrl != null) {
                return "TTS 생성 성공! 접근 URL: " + ttsUrl;
            } else {
                return "TTS 생성 실패";
            }
        } catch (Exception e) {
            return "에러 발생: " + e.getMessage();
        }
    }
}