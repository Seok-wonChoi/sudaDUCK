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
@RequestMapping("/audio")
@Slf4j
public class AudioController {
    
    public AudioController() {
        // 이 로그가 찍히면 파일이 존재하고, 스프링 빈으로 등록까지 된 것임
        log.info("========================================");
        log.info("📢 AudioController가 정상적으로 생성되었습니다!");
        log.info("========================================");
    }

    /**
     * TTS 오디오 파일 서빙
     *
     * @param roomId 방 ID
     * @param filename 파일명 (예: 1770014615345.wav)
     * @return 오디오 파일
     */
    @GetMapping("/{roomId}/{filename}")
    public ResponseEntity<Resource> getAudioFile(
            @PathVariable String roomId,
            @PathVariable String filename) {

        // 1. 경로 검증 (보안)
        if (filename.contains("..") || roomId.contains("..")) {
            log.warn("❌ [Audio] 잘못된 경로 요청: roomId={}, filename={}", roomId, filename);
            return ResponseEntity.badRequest().build();
        }

        if (!filename.endsWith(".wav")) {
            log.warn("❌ [Audio] WAV 파일이 아님: {}", filename);
            return ResponseEntity.badRequest().build();
        }

        // 2. 파일 경로 생성
        String currentDir = System.getProperty("user.dir");
        File file = new File(currentDir, "storage/audio/" + roomId + "/" + filename);

        log.info("🎵 [Audio] 파일 요청: roomId={}, filename={}", roomId, filename);
        log.info("🎵 [Audio] 절대 경로: {}", file.getAbsolutePath());

        // 3. 파일 존재 확인
        if (!file.exists()) {
            log.error("❌ [Audio] 파일 없음: {}", file.getAbsolutePath());
            return ResponseEntity.notFound().build();
        }

        // 4. 파일 크기 확인
        long fileSize = file.length();
        log.info("📊 [Audio] 파일 크기: {} bytes ({} KB)", fileSize, fileSize / 1024);

        if (fileSize < 5000) {
            log.error("❌ [Audio] 파일 크기 이상 ({}bytes) - 손상된 파일일 가능성", fileSize);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }

        try {
            // 5. Resource 생성
            Resource resource = new FileSystemResource(file);

            if (!resource.exists() || !resource.isReadable()) {
                log.error("❌ [Audio] 파일 읽기 불가: {}", file.getAbsolutePath());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }

            // 6. Content-Type 결정
            String contentType;
            try {
                contentType = Files.probeContentType(file.toPath());
                if (contentType == null) {
                    contentType = "audio/wav";
                }
            } catch (IOException e) {
                contentType = "audio/wav";
            }

            log.info("✅ [Audio] 파일 전송 시작: {} ({} bytes, {})",
                    filename, fileSize, contentType);

            // 7. 응답 생성
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(fileSize))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=3600")
                    .body(resource);

        } catch (Exception e) {
            log.error("❌ [Audio] 파일 처리 실패: {}", file.getAbsolutePath(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}