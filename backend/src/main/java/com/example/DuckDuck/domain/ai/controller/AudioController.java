package com.example.DuckDuck.domain.ai.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;

@RestController
@Slf4j
public class AudioController {

    public AudioController() {
        log.info("========================================");
        log.info("📢 AudioController가 정상적으로 생성되었습니다!");
        log.info("========================================");
    }

    @RequestMapping(value = "/audio/{roomId}/{filename}", method = RequestMethod.GET)
    public ResponseEntity<Resource> getAudioFile(
            @PathVariable("roomId") String roomId,
            @PathVariable("filename") String filename) {

        log.info("🎵🎵🎵 [Audio] API 호출됨! roomId={}, filename={}", roomId, filename);

        // 1. 경로 검증
        if (filename.contains("..") || roomId.contains("..")) {
            log.warn("❌ [Audio] 잘못된 경로");
            return ResponseEntity.badRequest().build();
        }

        if (!filename.endsWith(".wav")) {
            log.warn("❌ [Audio] WAV 아님");
            return ResponseEntity.badRequest().build();
        }

        // 2. 파일 경로
        String currentDir = System.getProperty("user.dir");
        File file = new File(currentDir, "storage/audio/" + roomId + "/" + filename);

        log.info("📂 [Audio] 파일 경로: {}", file.getAbsolutePath());

        // 3. 파일 존재 확인
        if (!file.exists()) {
            log.error("❌ [Audio] 파일 없음: {}", file.getAbsolutePath());
            return ResponseEntity.notFound().build();
        }

        // 4. 파일 크기 확인
        long fileSize = file.length();
        log.info("📊 [Audio] 파일 크기: {} bytes ({} KB)", fileSize, fileSize / 1024);

        if (fileSize < 5000) {
            log.error("❌ [Audio] 파일 크기 이상: {}bytes", fileSize);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }

        try {
            Resource resource = new FileSystemResource(file);

            if (!resource.exists() || !resource.isReadable()) {
                log.error("❌ [Audio] 파일 읽기 불가");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }

            String contentType = "audio/wav";
            try {
                String detected = Files.probeContentType(file.toPath());
                if (detected != null) {
                    contentType = detected;
                }
            } catch (IOException e) {
                log.warn("Content-Type 감지 실패, 기본값 사용");
            }

            log.info("✅✅✅ [Audio] 파일 전송: {} ({} bytes)", filename, fileSize);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(fileSize))
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .body(resource);

        } catch (Exception e) {
            log.error("❌ [Audio] 처리 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}