package com.example.DuckDuck.domain.ai.service;

import com.example.DuckDuck.domain.ai.config.PreprocessingConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * STT 텍스트 전처리기 (규칙 기반)
 * 최종 수정 버전
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SttTextPreprocessor {
    
    private final PreprocessingConfig config;
    
    /**
     * STT 원본 텍스트 전처리
     */
    public String preprocess(String rawText) {
        if (rawText == null || rawText.trim().isEmpty()) {
            log.debug("전처리 실패: 빈 텍스트");
            return null;
        }
        
        String cleaned = rawText;
        
        // 1. 반복되는 점과 특수문자 먼저 제거
        cleaned = normalizeSpecialChars(cleaned);
        
        // 2. 간투사 제거 (여러 번 반복)
        cleaned = removeFillersAndHesitations(cleaned);
        cleaned = removeFillersAndHesitations(cleaned); // 두 번 실행
        
        // 3. 반복 단어 정리
        cleaned = removeRepeatedWords(cleaned);
        
        // 4. 과도한 공백 정리
        cleaned = normalizeWhitespace(cleaned);
        
        // 5. 길이 검증
        if (!isValidLength(cleaned)) {
            log.debug("전처리 필터링: 부적절한 길이 - 원본: '{}', 정제: '{}'", rawText, cleaned);
            return null;
        }
        
        log.info("전처리 완료 - 원본: '{}' → 정제: '{}'", rawText, cleaned);
        return cleaned.trim();
    }
    
    /**
     * 간투사 및 망설임 표현 제거 (강화 버전)
     */
    private String removeFillersAndHesitations(String text) {
        String result = text;
        
        // 간투사 목록 (순서 중요: 긴 것부터)
        String[] fillers = {
            "그니까", "그런데", "근데",  // 긴 간투사 먼저
            "음", "어", "아", "그", "저", "에",
            "뭐", "좀", "막", "이제"
        };
        
        for (String filler : fillers) {
            // 패턴 1: 문장 시작 (공백 포함)
            result = result.replaceAll("^" + filler + "\\s+", "");
            result = result.replaceAll("^" + filler + "$", "");
            
            // 패턴 2: 공백 + 간투사 + 공백
            result = result.replaceAll("\\s+" + filler + "\\s+", " ");
            
            // 패턴 3: 공백 + 간투사 (문장 끝)
            result = result.replaceAll("\\s+" + filler + "$", "");
        }
        
        return result;
    }
    
    /**
     * 반복 단어 제거 (강화 버전)
     */
    private String removeRepeatedWords(String text) {
        String result = text;
        
        // 패턴 1: 조사 포함 반복 ("날씨가 날씨가")
        result = result.replaceAll("([가-힣]+[가을를이은는에의도만부터까지에서으로로와과])\\s+\\1", "$1");
        
        // 패턴 2: 일반 단어 반복 ("저 저", "그 그")
        result = result.replaceAll("(\\S+)\\s+\\1", "$1");
        
        // 패턴 3: 3회 이상 반복도 제거
        result = result.replaceAll("(\\S+)(\\s+\\1){2,}", "$1");
        
        return result;
    }
    
    /**
     * 특수문자 정리 (먼저 실행)
     */
    private String normalizeSpecialChars(String text) {
        String result = text;
        
        // 1. 반복되는 점과 쉼표 제거
        result = result.replaceAll("\\.{2,}", " ");  // "..." → " "
        result = result.replaceAll(",{2,}", " ");    // ",,," → " "
        
        // 2. 불필요한 특수문자 제거 (마침표, 물음표, 느낌표, 쉼표는 유지)
        result = result.replaceAll("[^가-힣a-zA-Z0-9\\s.?!,]", "");
        
        return result;
    }
    
    /**
     * 공백 정규화
     */
    private String normalizeWhitespace(String text) {
        return text.replaceAll("\\s+", " ").trim();
    }
    
    /**
     * 길이 검증
     */
    private boolean isValidLength(String text) {
        int length = text.trim().length();
        int minLength = config.getMinLength();
        int maxLength = config.getMaxLength();
        
        if (length < minLength) {
            log.debug("너무 짧은 텍스트: {} (최소: {})", length, minLength);
            return false;
        }
        
        if (length > maxLength) {
            log.debug("너무 긴 텍스트: {} (최대: {})", length, maxLength);
            return false;
        }
        
        return true;
    }
    
    /**
     * 의미 없는 문장 필터링
     */
    public boolean isMeaningful(String text) {
        if (text == null || text.trim().isEmpty()) {
            return false;
        }
        
        // 단어 수 체크
        String[] words = text.trim().split("\\s+");
        if (words.length < 2) {
            log.debug("단어 수 부족: {} 단어", words.length);
            return false;
        }
        
        // 의미 없는 응답 필터링
        String[] meaninglessResponses = {
            "응", "네", "아니", "어", "음", "예", "그래",
            "그", "저", "아"
        };
        String trimmed = text.trim();
        for (String meaningless : meaninglessResponses) {
            if (trimmed.equals(meaningless)) {
                log.debug("의미 없는 응답: {}", text);
                return false;
            }
        }
        
        return true;
    }
}
