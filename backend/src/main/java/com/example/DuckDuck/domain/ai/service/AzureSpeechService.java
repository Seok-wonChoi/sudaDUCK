package com.example.DuckDuck.domain.ai.service;

import com.microsoft.cognitiveservices.speech.*;
import com.microsoft.cognitiveservices.speech.audio.AudioConfig;
import lombok.extern.slf4j.Slf4j;
import com.example.DuckDuck.domain.ai.exception.AzureSpeechException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
import java.util.concurrent.CompletableFuture;

@Service
@Slf4j
public class AzureSpeechService {

    @Value("${azure.speech.key}")
    private String speechKey;

    @Value("${azure.speech.region}")
    private String speechRegion;

    /**
     * 발음 평가 (비동기) ← 개선!
     * 
     * @param audioData 음성 파일 바이트
     * @param referenceText 정답 텍스트
     * @return 발음 점수 (0~100)
     */
    @Async("azureTaskExecutor")
    public CompletableFuture<Integer> getPronunciationScore(
            byte[] audioData,
            String referenceText) {

        File tempFile = null;
        try {
            // 1. 임시 파일 생성
            tempFile = File.createTempFile("pronunciation_", ".wav");
            try (FileOutputStream fos = new FileOutputStream(tempFile)) {
                fos.write(audioData);
            }

            // 2. Azure 설정
            SpeechConfig speechConfig = SpeechConfig.fromSubscription(speechKey, speechRegion);

            try (AudioConfig audioConfig = AudioConfig.fromWavFileInput(tempFile.getAbsolutePath());
                 SpeechRecognizer recognizer = new SpeechRecognizer(speechConfig, audioConfig)) {

                // 3. 발음 평가 설정
                PronunciationAssessmentConfig pronConfig = new PronunciationAssessmentConfig(
                        referenceText,
                        PronunciationAssessmentGradingSystem.HundredMark,
                        PronunciationAssessmentGranularity.Phoneme,
                        false
                );
                pronConfig.applyTo(recognizer);

                // 4. 비동기 실행
                SpeechRecognitionResult result = recognizer.recognizeOnceAsync().get();

                if (result.getReason() == ResultReason.RecognizedSpeech) {
                    PronunciationAssessmentResult pronResult =
                            PronunciationAssessmentResult.fromResult(result);
                    int score = pronResult.getAccuracyScore().intValue();
                    return CompletableFuture.completedFuture(score);
                } else {
                    log.warn("음성 인식 실패: {}", result.getReason());
                    throw new AzureSpeechException("음성을 인식할 수 없습니다.");
                }
            }
        } catch (Exception e) {
            log.error("발음 평가 실패: {}", e.getMessage(), e);
            throw new AzureSpeechException("발음 평가 중 오류 발생", e);
        } finally {
            // 5. 임시 파일 삭제
            if (tempFile != null && tempFile.exists()) {
                tempFile.delete();
            }
        }
    }

    /**
     * TTS 생성 (동기 - 빠르므로 그대로 유지)
     */
    public String generateTTS(String text, String roomId) {
        // 텍스트 검증 추가
        if (text == null || text.trim().isEmpty()) {
            log.warn("TTS 생성 요청: 빈 텍스트");
            throw new AzureSpeechException("TTS 생성할 텍스트가 비어있습니다.");
        }

        String directoryPath = "storage/audio/" + roomId;
        File directory = new File(directoryPath);
        if (!directory.exists()) {
            directory.mkdirs();
        }

        String fileName = System.currentTimeMillis() + ".wav";
        String savedFilePath = directoryPath + "/" + fileName;
        File savedFile = new File(savedFilePath);  // ← File 객체 미리 생성

        SpeechConfig speechConfig = SpeechConfig.fromSubscription(speechKey, speechRegion);
        speechConfig.setSpeechSynthesisVoiceName("en-US-AvaMultilingualNeural");

        try (AudioConfig audioConfig = AudioConfig.fromWavFileOutput(savedFilePath);
             SpeechSynthesizer synthesizer = new SpeechSynthesizer(speechConfig, audioConfig)) {

            SpeechSynthesisResult result = synthesizer.SpeakTextAsync(text).get();

            if (result.getReason() == ResultReason.SynthesizingAudioCompleted) {
                // 파일 크기 검증
                long fileSize = savedFile.length();
                log.info("TTS 생성 성공: {} ({}bytes)", savedFilePath, fileSize);

                if (fileSize < 5000) {  // 5KB 미만은 비정상
                    log.error("TTS 파일 크기 이상: {}bytes", fileSize);
                    savedFile.delete();  // ← 잘못된 파일 삭제
                    throw new AzureSpeechException("TTS 파일이 너무 작습니다: " + fileSize + "bytes");
                }

                return savedFilePath.replace("storage/audio/", "/audio/");

            } else {
                log.error("TTS 생성 실패: {}", result.getReason());

                // 실패 시 파일 삭제
                if (savedFile.exists()) {
                    savedFile.delete();
                    log.info("실패한 TTS 파일 삭제: {}", savedFilePath);
                }

                throw new AzureSpeechException("TTS 생성 실패: " + result.getReason());
            }

        } catch (Exception e) {
            log.error("TTS 생성 오류: {}", e.getMessage(), e);

            // 예외 발생 시에도 파일 삭제
            if (savedFile.exists()) {
                savedFile.delete();
                log.info("오류 발생으로 TTS 파일 삭제: {}", savedFilePath);
            }

            throw new AzureSpeechException("TTS 생성 중 오류 발생", e);
        }
    }
}
