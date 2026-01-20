package org.example.service;

import com.microsoft.cognitiveservices.speech.*;
import com.microsoft.cognitiveservices.speech.audio.AudioConfig;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
// import java.nio.file.Files;

@Service
public class AzureSpeechService {

    @Value("${azure.speech.key}")
    private String speechKey;

    @Value("${azure.speech.region}")
    private String speechRegion;

    public Integer getPronunciationScore(byte[] audioData, String referenceText) {
        File tempFile = null;
        try {
            // 1. 임시 파일 생성
            tempFile = File.createTempFile("azure_test_", ".wav");
            try (FileOutputStream fos = new FileOutputStream(tempFile)) {
                fos.write(audioData);
            }

            // 2. 설정
            SpeechConfig speechConfig = SpeechConfig.fromSubscription(speechKey, speechRegion);
            // 파일 경로를 통해 오디오 설정
            try (AudioConfig audioConfig = AudioConfig.fromWavFileInput(tempFile.getAbsolutePath());
                 SpeechRecognizer recognizer = new SpeechRecognizer(speechConfig, audioConfig)) {

                // 3. 발음 평가 설정
                PronunciationAssessmentConfig pronConfig = new PronunciationAssessmentConfig(
                        referenceText,
                        PronunciationAssessmentGradingSystem.HundredMark,
                        PronunciationAssessmentGranularity.Phoneme,         // 평가 단위
                        false
                );
                pronConfig.applyTo(recognizer);

                // 4. 결과 대기
                SpeechRecognitionResult result = recognizer.recognizeOnceAsync().get();

                if (result.getReason() == ResultReason.RecognizedSpeech) {
                    PronunciationAssessmentResult pronResult = PronunciationAssessmentResult.fromResult(result);
                    System.out.println("평가 성공: " + result.getText());
                    return pronResult.getAccuracyScore().intValue();
                } else {
                    System.out.println("인식 실패 사유: " + result.getReason());
                    return 0;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            return 0;
        } finally {
            // 5. 사용 후 임시 파일 삭제
            if (tempFile != null && tempFile.exists()) {
                tempFile.delete();
            }
        }
    }

    // AzureSpeechService.java
    public String generateTTS(String text, String roomId) {
        // 1. 폴더 생성 (storage/audio/{roomId})
        String directoryPath = "storage/audio/" + roomId;
        File directory = new File(directoryPath);
        if (!directory.exists()) {
            directory.mkdirs();
        }

        // 2. 파일명 및 저장 경로 설정
        String fileName = System.currentTimeMillis() + ".wav";
        String savedFilePath = directoryPath + "/" + fileName;

        // 3. Azure TTS 설정
        SpeechConfig speechConfig = SpeechConfig.fromSubscription(speechKey, speechRegion);
        speechConfig.setSpeechSynthesisVoiceName("en-US-AvaMultilingualNeural");

        try (AudioConfig audioConfig = AudioConfig.fromWavFileOutput(savedFilePath);
             SpeechSynthesizer synthesizer = new SpeechSynthesizer(speechConfig, audioConfig)) {

            // 4. 실행 및 결과 대기
            SpeechSynthesisResult result = synthesizer.SpeakTextAsync(text).get();

            if (result.getReason() == ResultReason.SynthesizingAudioCompleted) {
                System.out.println("TTS 파일 생성 성공: " + savedFilePath);

                // 물리 경로를 Web URL 경로로 즉시 변환해서 반환
                // 예: storage/audio/room1/123.wav -> /audio/audio/room1/123.wav
                return savedFilePath.replace("storage/", "/audio/");
            } else {
                System.err.println("TTS 생성 실패 사유: " + result.getReason());
                return null;
            }

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}

