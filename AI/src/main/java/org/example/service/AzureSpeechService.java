package org.example.service;

import com.microsoft.cognitiveservices.speech.*;
import com.microsoft.cognitiveservices.speech.audio.AudioConfig;
import lombok.extern.slf4j.Slf4j;
import org.example.exception.AzureSpeechException;
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

                // 4. 비동기 실행 (블로킹 아님!)
                SpeechRecognitionResult result = recognizer.recognizeOnceAsync().get();

                if (result.getReason() == ResultReason.RecognizedSpeech) {
                    PronunciationAssessmentResult pronResult = 
                        PronunciationAssessmentResult.fromResult(result);
                    int score = pronResult.getAccuracyScore().intValue();
                    
                    log.info("발음 평가 완료 - 점수: {}, 인식: {}", score, result.getText());
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
        String directoryPath = "storage/audio/" + roomId;
        File directory = new File(directoryPath);
        if (!directory.exists()) {
            directory.mkdirs();
        }

        String fileName = System.currentTimeMillis() + ".wav";
        String savedFilePath = directoryPath + "/" + fileName;

        SpeechConfig speechConfig = SpeechConfig.fromSubscription(speechKey, speechRegion);
        speechConfig.setSpeechSynthesisVoiceName("en-US-AvaMultilingualNeural");

        try (AudioConfig audioConfig = AudioConfig.fromWavFileOutput(savedFilePath);
             SpeechSynthesizer synthesizer = new SpeechSynthesizer(speechConfig, audioConfig)) {

            SpeechSynthesisResult result = synthesizer.SpeakTextAsync(text).get();

            if (result.getReason() == ResultReason.SynthesizingAudioCompleted) {
                log.info("TTS 생성 성공: {}", savedFilePath);
                return savedFilePath.replace("storage/", "/audio/");
            } else {
                log.error("TTS 생성 실패: {}", result.getReason());
                throw new AzureSpeechException("TTS 생성 실패");
            }

        } catch (Exception e) {
            log.error("TTS 생성 오류: {}", e.getMessage(), e);
            throw new AzureSpeechException("TTS 생성 중 오류 발생", e);
        }
    }
}
