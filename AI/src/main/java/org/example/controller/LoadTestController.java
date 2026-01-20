package org.example.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.dto.ChatResponse;
import org.example.service.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

/**
 * 동시성 및 성능 테스트용 컨트롤러
 */
@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
@Slf4j
public class LoadTestController {

    private final ChatService chatService;

    /**
     * 동시 요청 부하 테스트
     * GET /api/test/load?count=10
     * 
     * - count 개수만큼 동시에 비동기 요청 발생
     * - 모든 요청 완료 후 순서대로 응답
     * 
     * 테스트 시나리오:
     * 1. count=5: 기본 동시 요청 테스트
     * 2. count=10: ThreadPool 최대치 테스트
     * 3. count=20: 대기열(Queue) 동작 테스트
     */
    @GetMapping("/load")
    public ResponseEntity<TestResult> loadTest(@RequestParam(defaultValue = "5") int count) {
        log.info("===== 부하 테스트 시작: {}개 동시 요청 =====", count);
        
        long startTime = System.currentTimeMillis();
        
        // 비동기 요청 생성
        List<CompletableFuture<ChatResponse>> futures = new ArrayList<>();
        
        for (int i = 0; i < count; i++) {
            CompletableFuture<ChatResponse> future = chatService.translateAndGenerateAudioAsync(
                    "test-room",
                    "테스트 문장 " + i,
                    (long) i
            );
            futures.add(future);
        }
        
        // 모든 요청 완료 대기
        List<ChatResponse> responses = futures.stream()
                .map(CompletableFuture::join)
                .collect(Collectors.toList());
        
        long endTime = System.currentTimeMillis();
        long totalTime = endTime - startTime;
        
        // 순서 검증
        boolean orderCorrect = true;
        for (int i = 0; i < responses.size(); i++) {
            if (responses.get(i).getSequence() != i) {
                orderCorrect = false;
                log.warn("순서 불일치: 예상 {}, 실제 {}", i, responses.get(i).getSequence());
            }
        }
        
        log.info("===== 부하 테스트 완료 =====");
        log.info("총 요청 수: {}", count);
        log.info("총 소요 시간: {}ms", totalTime);
        log.info("평균 처리 시간: {}ms", totalTime / count);
        log.info("순서 정확도: {}", orderCorrect ? "정확" : "불일치");
        
        TestResult result = new TestResult();
        result.setTotalRequests(count);
        result.setTotalTimeMs(totalTime);
        result.setAverageTimeMs(totalTime / count);
        result.setOrderCorrect(orderCorrect);
        result.setResponses(responses);
        
        return ResponseEntity.ok(result);
    }

    // DTO 클래스들
    public static class TestResult {
        private int totalRequests;
        private long totalTimeMs;
        private long averageTimeMs;
        private boolean orderCorrect;
        private List<ChatResponse> responses;

        // Getters and Setters
        public int getTotalRequests() { return totalRequests; }
        public void setTotalRequests(int totalRequests) { this.totalRequests = totalRequests; }
        
        public long getTotalTimeMs() { return totalTimeMs; }
        public void setTotalTimeMs(long totalTimeMs) { this.totalTimeMs = totalTimeMs; }
        
        public long getAverageTimeMs() { return averageTimeMs; }
        public void setAverageTimeMs(long averageTimeMs) { this.averageTimeMs = averageTimeMs; }
        
        public boolean isOrderCorrect() { return orderCorrect; }
        public void setOrderCorrect(boolean orderCorrect) { this.orderCorrect = orderCorrect; }
        
        public List<ChatResponse> getResponses() { return responses; }
        public void setResponses(List<ChatResponse> responses) { this.responses = responses; }
    }

    public static class ComparisonResult {
        private int requestCount;
        private long syncTotalTimeMs;
        private long asyncTotalTimeMs;
        private double improvementPercent;
        private List<ChatResponse> syncResponses;
        private List<ChatResponse> asyncResponses;

        // Getters and Setters
        public int getRequestCount() { return requestCount; }
        public void setRequestCount(int requestCount) { this.requestCount = requestCount; }
        
        public long getSyncTotalTimeMs() { return syncTotalTimeMs; }
        public void setSyncTotalTimeMs(long syncTotalTimeMs) { this.syncTotalTimeMs = syncTotalTimeMs; }
        
        public long getAsyncTotalTimeMs() { return asyncTotalTimeMs; }
        public void setAsyncTotalTimeMs(long asyncTotalTimeMs) { this.asyncTotalTimeMs = asyncTotalTimeMs; }
        
        public double getImprovementPercent() { return improvementPercent; }
        public void setImprovementPercent(double improvementPercent) { this.improvementPercent = improvementPercent; }
        
        public List<ChatResponse> getSyncResponses() { return syncResponses; }
        public void setSyncResponses(List<ChatResponse> syncResponses) { this.syncResponses = syncResponses; }
        
        public List<ChatResponse> getAsyncResponses() { return asyncResponses; }
        public void setAsyncResponses(List<ChatResponse> asyncResponses) { this.asyncResponses = asyncResponses; }
    }
}
