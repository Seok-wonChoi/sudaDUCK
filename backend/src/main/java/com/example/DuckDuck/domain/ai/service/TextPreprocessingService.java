package com.example.DuckDuck.domain.ai.service;

import com.example.DuckDuck.domain.ai.config.PreprocessingConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 텍스트 전처리 서비스
 * Phase 1: 규칙 기반 전처리
 * Phase 3: LLM 정제 추가
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TextPreprocessingService {
    
    private final SttTextPreprocessor ruleBasedPreprocessor;
    private final LlmTextRefiner llmRefiner;
    private final PreprocessingConfig config;
    
    /**
     * 텍스트 전처리
     * Phase 1: 규칙 기반만
     * Phase 3: LLM 정제 추가
     * 
     * @param rawText STT 원본 텍스트
     * @return 정제된 텍스트 (필터링 시 null)
     */
    public String preprocess(String rawText) {
        // 전처리 비활성화 시 원본 반환
        if (!config.isEnabled()) {
            log.debug("전처리 비활성화 - 원본 사용");
            return rawText;
        }
        
        log.info("전처리 시작 - 원본: '{}'", rawText);
        
        // ===== Phase 1: 규칙 기반 전처리 =====
        String cleaned = ruleBasedPreprocessor.preprocess(rawText);
        
        if (cleaned == null) {
            log.info("규칙 기반 필터링됨 (길이 또는 빈 텍스트) - 원본: '{}'", rawText);
            return null;
        }
        
        // 의미 있는 문장인지 추가 검증
        if (!ruleBasedPreprocessor.isMeaningful(cleaned)) {
            log.info("의미 없는 문장 필터링 - 정제본: '{}'", cleaned);
            return null;
        }
        
        log.info("규칙 기반 전처리 완료 - 원본: '{}' → 정제: '{}'", rawText, cleaned);
        
        // ===== Phase 3: LLM 정제 (선택적) =====
        if (config.isUseLlmRefinement() && llmRefiner.needsRefinement(cleaned)) {
            log.info("LLM 정제 시작 - 입력: '{}'", cleaned);
            
            String refined = llmRefiner.refineWithLlm(cleaned);
            
            if (refined == null) {
                log.info("LLM 정제 결과 무효 - 입력: '{}'", cleaned);
                return null;
            }
            
            log.info("LLM 정제 완료 - 규칙 기반: '{}' → LLM 정제: '{}'", cleaned, refined);
            return refined;
        }
        
        log.info("전처리 최종 완료 - 원본: '{}' → 정제: '{}'", rawText, cleaned);
        return cleaned;
    }
    
    /**
     * 전처리 통계 정보 (향후 모니터링용)
     */
    public PreprocessingStats getStats() {
        // TODO: 향후 통계 수집 로직 구현
        return new PreprocessingStats();
    }
    
    /**
     * 통계 정보 클래스 (향후 확장)
     */
    public static class PreprocessingStats {
        private long totalProcessed = 0;
        private long ruleBasedFiltered = 0;
        private long llmRefined = 0;
        private long llmFiltered = 0;
        private long passed = 0;
        
        public long getTotalProcessed() {
            return totalProcessed;
        }
        
        public long getRuleBasedFiltered() {
            return ruleBasedFiltered;
        }
        
        public long getLlmRefined() {
            return llmRefined;
        }
        
        public long getLlmFiltered() {
            return llmFiltered;
        }
        
        public long getPassed() {
            return passed;
        }
        
        public double getFilterRate() {
            if (totalProcessed == 0) return 0.0;
            long totalFiltered = ruleBasedFiltered + llmFiltered;
            return (double) totalFiltered / totalProcessed * 100;
        }
        
        public double getLlmRefinementRate() {
            if (totalProcessed == 0) return 0.0;
            return (double) llmRefined / totalProcessed * 100;
        }
    }
}
