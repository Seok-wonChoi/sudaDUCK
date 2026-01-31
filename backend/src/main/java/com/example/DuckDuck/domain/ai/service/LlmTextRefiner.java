package com.example.DuckDuck.domain.ai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * LLM 기반 텍스트 정제기
 * STT 오인식 교정 포함 - 최종 버전
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class LlmTextRefiner {
    
    private final GptService gptService;
    
    /**
     * GPT를 사용한 텍스트 정제
     */
    public String refineWithLlm(String preprocessedText) {
        String prompt = buildRefinementPrompt(preprocessedText);
        
        try {
            String refined = gptService.callGptRaw(prompt);
            
            // "INVALID" 응답 처리
            if (refined != null && refined.trim().equalsIgnoreCase("INVALID")) {
                log.info("LLM 정제 결과: 무효 문장 - {}", preprocessedText);
                return null;
            }
            
            // 응답 정제
            refined = cleanLlmResponse(refined);
            
            if (refined == null || refined.trim().isEmpty()) {
                log.warn("LLM 정제 결과가 비어있음 - 입력: '{}', 원본 사용", preprocessedText);
                return preprocessedText;  // 실패 시 원본 반환
            }
            
            log.info("LLM 정제 완료 - 입력: '{}' → 출력: '{}'", 
                    preprocessedText, refined);
            
            return refined;
            
        } catch (Exception e) {
            log.error("LLM 정제 실패, 원본 사용 - 입력: '{}', 에러: {}", 
                    preprocessedText, e.getMessage());
            return preprocessedText;  // 실패 시 원본 반환
        }
    }
    
    /**
     * LLM 응답 정제
     */
    private String cleanLlmResponse(String response) {
        if (response == null) {
            return null;
        }
        
        String cleaned = response.trim();
        
        // 앞뒤 따옴표 제거
        cleaned = cleaned.replaceAll("^[\"']|[\"']$", "");
        
        // JSON 객체 형식 제거
        if (cleaned.startsWith("{") && cleaned.contains("\"")) {
            // {"text": "내용"} 형식 처리
            int colonIndex = cleaned.indexOf(":");
            if (colonIndex > 0) {
                cleaned = cleaned.substring(colonIndex + 1).trim();
                cleaned = cleaned.replaceAll("^[\"']|[\"']$", "");
                cleaned = cleaned.replaceAll("\\}$", "").trim();
            }
        }
        
        // 불필요한 줄바꿈 제거
        cleaned = cleaned.replaceAll("\\n+", " ");
        
        // 과도한 공백 정리
        cleaned = cleaned.replaceAll("\\s+", " ");
        
        return cleaned.trim();
    }
    
    /**
     * 정제용 프롬프트 생성
     */
    private String buildRefinementPrompt(String text) {
        return String.format(
            "당신은 음성인식(STT) 결과를 정제하는 전문가입니다.\n\n" +
            
            "# Task\n" +
            "아래 텍스트는 음성인식 후 1차 정제를 거친 텍스트입니다.\n" +
            "STT가 잘못 인식한 부분을 문맥에 맞게 교정하고, 자연스러운 한국어 문장으로 다듬어주세요.\n\n" +
            
            "# Input\n" +
            "\"%s\"\n\n" +
            
            "# Rules\n" +
            "1. STT 오인식 교정:\n" +
            "   - 발음이 비슷한 단어를 문맥에 맞게 교정\n" +
            "   - 예: \"수요일\" → \"소유\" (라멘 문맥에서)\n" +
            "   - 예: \"배고 파\" → \"배고파\"\n\n" +
            
            "2. 원문의 의미를 최대한 보존\n" +
            "3. 문법 오류를 교정하고 자연스럽게 만들기\n" +
            "4. 구어체 특성 유지 (너무 격식적으로 바꾸지 말 것)\n" +
            "5. 문맥상 의미가 불명확하면 'INVALID' 응답\n" +
            "6. 응답은 정제된 문장만 출력 (설명 없이, 따옴표 없이)\n" +
            "7. 종결어미는 원문 스타일 유지\n\n" +
            
            "# Examples\n\n" +
            
            "입력: \"유자 수요일 라멘 먹고 싶어\"\n" +
            "출력: 유자 소유 라멘 먹고 싶어\n\n" +
            
            "입력: \"오늘 날씨 좋네\"\n" +
            "출력: 오늘 날씨 좋네요\n\n" +
            
            "입력: \"배고 파서 뭐 좀 먹을래\"\n" +
            "출력: 배고파서 뭐 좀 먹을래\n\n" +
            
            "입력: \"응\"\n" +
            "출력: INVALID\n\n" +
            
            "---\n\n" +
            "이제 위 텍스트를 정제해주세요.\n" +
            "정제된 문장만 출력하세요 (설명 없이):",
            text
        );
    }
    
    /**
     * LLM 정제가 필요한지 판단
     * 조건 완화: 더 많은 경우에 LLM 정제 실행
     */
    public boolean needsRefinement(String text) {
        if (text == null || text.isEmpty()) {
            return false;
        }
        
        // 조건 1: 항상 LLM 정제 실행 (STT 오인식 가능성)
        // 주석 처리하고 항상 true 반환하도록 수정할 수도 있음
        
        // 조건 2: 문장이 짧음 (5단어 미만으로 완화)
        String[] words = text.trim().split("\\s+");
        if (words.length < 5) {
            log.debug("LLM 정제 필요: 짧은 문장 ({} 단어)", words.length);
            return true;
        }
        
        // 조건 3: 종결어미가 없음
        if (!text.matches(".*[.!?요다네어야]$")) {
            log.debug("LLM 정제 필요: 종결어미 없음");
            return true;
        }
        
        // 조건 4: 불완전한 문장 패턴
        if (text.matches(".*(그래서|근데|그런데|저|이거|저거)\\s*$")) {
            log.debug("LLM 정제 필요: 불완전한 문장");
            return true;
        }
        
        // 조건 5: 의문문인데 물음표 없음
        if (text.matches(".*(어디|누구|뭐|무엇|어떻게|왜|언제|뭘|어떤).*") && !text.endsWith("?")) {
            log.debug("LLM 정제 필요: 의문문인데 물음표 없음");
            return true;
        }
        
        // 조건 6: STT 오인식 패턴 (항상 체크)
        if (hasPotentialSttError(text)) {
            log.debug("LLM 정제 필요: STT 오인식 가능성");
            return true;
        }
        
        // 조건 7: 모든 문장에 대해 LLM 정제 시도
        // 비용이 걱정되면 이 부분 주석 처리
        log.debug("LLM 정제 시도: 품질 향상을 위해");
        return true;
    }
    
    /**
     * STT 오인식 가능성 검사
     */
    private boolean hasPotentialSttError(String text) {
        // STT 오인식 패턴들
        String[] suspiciousPatterns = {
            // 요일이 어색한 위치
            ".*(월|화|수|목|금|토|일)요일\\s+(라멘|돈까스|스시|카레|우동|국수).*",
            
            // 띄어쓰기 오류
            ".*[가-힣]\\s[가-힣]{1}\\s[가-힣].*",  // "배 고 파"
            
            // 동사 분리
            ".*할\\s+(래|게|까).*",
        };
        
        for (String pattern : suspiciousPatterns) {
            if (text.matches(pattern)) {
                return true;
            }
        }
        
        return false;
    }
}
