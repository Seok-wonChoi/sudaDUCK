package com.example.DuckDuck.domain.ai.service;

import com.example.DuckDuck.domain.ai.config.ContentFilterConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Pattern;

/**
 * Hybrid 콘텐츠 필터
 *
 * ✅ 1차: 규칙 기반 (90% 처리, 매우 빠름)
 *      - 금지/교육 문맥 선허용
 *      - 가벼운 놀림 허용
 *      - 명백한 욕설만 regex 차단
 *
 * ✅ 2차: (HIGH 레벨일 때만) LLM 판단
 *
 * → 과잉 차단 방지 + 비용 절감 + 속도 향상
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ContentFilter {

    private final GptService gptService;
    private final ContentFilterConfig config;
    private final ObjectMapper objectMapper;

    /* =========================================================
       1️⃣ 무조건 허용 (금지/교육/부정 문맥)
       ========================================================= */
    private static final List<String> NEGATION_PATTERNS = List.of(
            "하지마", "하지 말", "말하지마", "쓰지마", "금지",
            "하면 안", "하지 말자", "하지 말라고", "그만해"
    );

    /* =========================================================
       2️⃣ 가벼운 놀림/일상 표현 (허용)
       ========================================================= */
    private static final List<String> SOFT_WORDS = List.of(
            "바보", "멍청", "초딩", "애기같", "철없", "장난",
            "놀리", "웃겨", "허접"
    );

    /* =========================================================
       3️⃣ 명백한 욕설만 차단 (regex)
       ========================================================= */
    private static final Pattern HARD_PROFANITY = Pattern.compile(
            "(씨발|시발|ㅅㅂ|개새끼|병신|ㅂㅅ|지랄|ㅈㄹ|느금마|느금|꺼져|죽어|뒤져)",
            Pattern.CASE_INSENSITIVE
    );

    /* ========================================================= */

    public static class FilterResult {
        private final boolean isClean;
        private final String filteredText;
        private final String reason;

        public FilterResult(boolean isClean, String filteredText, String reason) {
            this.isClean = isClean;
            this.filteredText = filteredText;
            this.reason = reason;
        }

        public boolean isClean() {
            return isClean;
        }

        public String getFilteredText() {
            return filteredText;
        }

        public String getReason() {
            return reason;
        }
    }

    /* ========================================================= */

    public FilterResult filter(String text) {

        if (!config.isEnabled()) {
            return new FilterResult(true, text, null);
        }

        if (text == null || text.trim().isEmpty()) {
            return new FilterResult(true, text, null);
        }

        text = text.trim();

        /* =====================================================
           1️⃣ 부정/교육 문맥 → 무조건 허용
           ex) 욕하지마, 비하 하지마
           ===================================================== */
        if (isNegationContext(text)) {
            log.debug("NEGATION 문맥 → 허용: {}", text);
            return new FilterResult(true, text, null);
        }

        /* =====================================================
           2️⃣ 가벼운 표현 → 허용
           ex) 바보야, 초딩같아
           ===================================================== */
        if (isSoftExpression(text)) {
            log.debug("SOFT 표현 → 허용: {}", text);
            return new FilterResult(true, text, null);
        }

        /* =====================================================
           3️⃣ 명백한 욕설 → 즉시 차단 (LLM 안씀)
           ===================================================== */
        if (HARD_PROFANITY.matcher(text).find()) {
            log.warn("명백한 욕설 감지 → 차단: {}", text);

            if (config.getFilterAction() == ContentFilterConfig.FilterAction.REJECT) {
                return new FilterResult(false, null, "명백한 욕설");
            }

            String cleaned = HARD_PROFANITY.matcher(text).replaceAll("***");
            return new FilterResult(false, cleaned, "명백한 욕설");
        }

        /* =====================================================
           4️⃣ LOW/MEDIUM → 여기서 종료 (LLM 안씀)
           ===================================================== */
        if (config.getFilterLevel() != ContentFilterConfig.FilterLevel.HIGH) {
            return new FilterResult(true, text, null);
        }

        /* =====================================================
           5️⃣ HIGH 레벨만 LLM 호출 (애매한 케이스만)
           ===================================================== */
        return callLlmFilter(text);
    }

    /* ========================================================= */

    private boolean isNegationContext(String text) {
        return NEGATION_PATTERNS.stream().anyMatch(text::contains);
    }

    private boolean isSoftExpression(String text) {
        return SOFT_WORDS.stream().anyMatch(text::contains);
    }

    /* ========================================================= */

    private FilterResult callLlmFilter(String text) {
        try {
            String prompt = """
                    당신은 콘텐츠 안전성 검사 전문가입니다.

                    아래 문장이 실제 욕설/비하 의도로 사용되었는지만 판단하세요.
                    교육/금지/설명 문맥이면 반드시 false.

                    JSON ONLY:
                    {
                      "has_inappropriate": true/false,
                      "cleaned_text": "...",
                      "reason": "..."
                    }

                    문장:
                    "%s"
                    """.formatted(text);

            String json = gptService.callGptRaw(prompt);

            Map<String, Object> result =
                    objectMapper.readValue(json, Map.class);

            boolean hasBad = (Boolean) result.get("has_inappropriate");

            if (!hasBad) {
                return new FilterResult(true, text, null);
            }

            String cleaned = (String) result.getOrDefault("cleaned_text", text);
            String reason = (String) result.getOrDefault("reason", "LLM 판단");

            return new FilterResult(false, cleaned, reason);

        } catch (Exception e) {
            log.error("LLM 필터 실패 → 원본 허용", e);
            return new FilterResult(true, text, null);
        }
    }
}
