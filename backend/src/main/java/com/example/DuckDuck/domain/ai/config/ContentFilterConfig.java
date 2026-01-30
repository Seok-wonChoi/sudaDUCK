package com.example.DuckDuck.domain.ai.config;

import lombok.Getter;
import org.springframework.stereotype.Component;

/**
 * 콘텐츠 필터링 설정
 * 욕설, 비속어, 부적절한 표현 필터링
 */
@Component
@Getter
public class ContentFilterConfig {
    
    /**
     * 콘텐츠 필터링 활성화 여부
     */
    private boolean enabled = true;
    
    /**
     * 필터링 시 대체 문자
     */
    private String replacementChar = "*";
    
    /**
     * 필터링 감도
     * LOW: 명백한 욕설만
     * MEDIUM: 일반적인 부적절한 표현
     * HIGH: 민감한 표현까지 포함
     */
    private FilterLevel filterLevel = FilterLevel.LOW;
    
    /**
     * 필터링된 텍스트 처리 방식
     */
    private FilterAction filterAction = FilterAction.REJECT;  // 마스킹 or 거부
    
    public enum FilterLevel {
        LOW,     // 명백한 욕설만
        MEDIUM,  // 일반적인 부적절 표현
        HIGH     // 민감한 표현까지
    }
    
    public enum FilterAction {
        MASK,    // 욕설을 ***로 치환
        REJECT   // 문장 전체 거부
    }
    
    // Setter 메서드들
    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
    
    public void setReplacementChar(String replacementChar) {
        this.replacementChar = replacementChar;
    }
    
    public void setFilterLevel(FilterLevel filterLevel) {
        this.filterLevel = filterLevel;
    }
    
    public void setFilterAction(FilterAction filterAction) {
        this.filterAction = filterAction;
    }
}
