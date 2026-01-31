package com.example.DuckDuck.domain.ai.config;

import lombok.Getter;
import org.springframework.stereotype.Component;

/**
 * 텍스트 전처리 설정
 * application.yml 대신 Java 코드로 설정 관리
 */
@Component
@Getter
public class PreprocessingConfig {
    
    /**
     * 전처리 활성화 여부
     */
    private boolean enabled = true;
    
    /**
     * LLM 정제 사용 여부
     * Phase 1: false (규칙 기반만)
     * Phase 3: true (LLM 정제 추가)
     */
    private boolean useLlmRefinement = true;
    
    /**
     * 최소 텍스트 길이
     */
    private int minLength = 4;
    
    /**
     * 최대 텍스트 길이
     */
    private int maxLength = 100;
    
    // ====================================
    // Setter 메서드들 (필요시 설정 변경 가능)
    // ====================================
    
    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
    
    public void setUseLlmRefinement(boolean useLlmRefinement) {
        this.useLlmRefinement = useLlmRefinement;
    }
    
    public void setMinLength(int minLength) {
        this.minLength = minLength;
    }
    
    public void setMaxLength(int maxLength) {
        this.maxLength = maxLength;
    }
}
