package com.example.DuckDuck.domain.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * GPT를 활용한 AI 기반 부적절한 단어 감지 서비스
 * 기존 GptService를 활용하여 욕설, 비속어, 혐오표현 등을 감지합니다.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiProfanityFilterService {

    private final GptService gptService;
    private final ObjectMapper objectMapper;

    /**
     * 텍스트에 부적절한 표현이 포함되어 있는지 GPT로 검사
     * 
     * @param text 검사할 텍스트 (방 주제, 제목 등)
     * @return true면 부적절한 표현 포함, false면 깨끗함
     */
    public boolean containsProfanity(String text) {
        if (text == null || text.trim().isEmpty()) {
            return false;
        }

        try {
            String prompt = createProfanityCheckPrompt(text);
            String jsonResponse = gptService.callGptRaw(prompt);
            
            // JSON 파싱
            @SuppressWarnings("unchecked")
            Map<String, Object> result = objectMapper.readValue(jsonResponse, Map.class);
            
            Boolean isProfane = (Boolean) result.get("isProfane");
            String reason = (String) result.get("reason");
            
            if (Boolean.TRUE.equals(isProfane)) {
                log.warn("부적절한 표현 감지 - 텍스트: '{}', 이유: {}", text, reason);
                return true;
            }
            
            log.info("텍스트 검증 통과: '{}'", text);
            return false;
            
        } catch (Exception e) {
            log.error("GPT 욕설 감지 중 오류 발생: {}", e.getMessage(), e);
            // API 오류 시 안전하게 통과시킴 (false positive 방지)
            return false;
        }
    }

    /**
     * 텍스트 검증 및 예외 발생
     * 
     * @param text 검증할 텍스트
     * @param fieldName 필드명 (에러 메시지용)
     * @throws IllegalArgumentException 부적절한 표현이 있을 경우
     */
    public void validateText(String text, String fieldName) {
        if (containsProfanity(text)) {
            throw new IllegalArgumentException(
                fieldName + "에 부적절한 표현이 포함되어 있습니다. 다른 내용으로 작성해주세요."
            );
        }
    }

    /**
     * GPT 프롬프트 생성
     */
    private String createProfanityCheckPrompt(String text) {
        return String.format(
            "# Role\n" +
            "당신은 텍스트 내용 검열 전문가입니다.\n\n" +

            "# Task\n" +
            "다음 텍스트에 부적절한 표현(욕설, 비속어, 혐오 표현, 성적 표현, 폭력적 표현 등)이 포함되어 있는지 판단하세요.\n\n" +

            "# Input\n" +
            "텍스트: \"%s\"\n\n" +

            "# Criteria (부적절한 표현 판단 기준)\n" +
            "1. 욕설 및 비속어 (명시적이거나 완곡한 표현 모두 포함)\n" +
            "2. 특정 집단에 대한 혐오 표현 (인종, 성별, 종교, 지역, 장애 등)\n" +
            "3. 성적인 표현 (노골적이거나 암시적인 표현)\n" +
            "4. 폭력적이거나 위협적인 표현\n" +
            "5. 타인을 모욕하거나 괴롭히는 표현\n" +
            "6. 변형된 욕설 (특수문자, 초성 등으로 변형한 경우도 감지)\n\n" +

            "# Important Notes\n" +
            "- 문맥을 고려하여 판단하세요\n" +
            "- 일상적인 대화나 중립적인 표현은 허용하세요\n" +
            "- 애매한 경우는 허용 쪽으로 판단하세요\n" +
            "- 한국어, 영어, 혼용 표현 모두 검사하세요\n\n" +

            "# Output Format (JSON only, no extra text)\n" +
            "{\n" +
            "  \"isProfane\": true,  // 부적절한 표현 포함 여부 (true/false)\n" +
            "  \"reason\": \"구체적인 이유 설명\",  // 왜 부적절한지 또는 정상인지\n" +
            "  \"category\": \"욕설\"  // 부적절한 경우 카테고리: 욕설, 혐오표현, 성적표현, 폭력적표현, 기타 중 하나\n" +
            "}\n\n" +

            "# Examples\n" +
            "입력: \"오늘 날씨 좋네요\"\n" +
            "출력: {\"isProfane\": false, \"reason\": \"일상적이고 긍정적인 표현\", \"category\": null}\n\n" +

            "입력: \"시X\"\n" +
            "출력: {\"isProfane\": true, \"reason\": \"욕설이 포함되어 있음\", \"category\": \"욕설\"}\n\n" +

            "이제 위 텍스트를 검사해주세요.",
            text
        );
    }

    /**
     * 검증 결과를 담는 DTO
     */
    public static class ProfanityCheckResult {
        private final boolean isProfane;
        private final String reason;
        private final String category;

        public ProfanityCheckResult(boolean isProfane, String reason, String category) {
            this.isProfane = isProfane;
            this.reason = reason;
            this.category = category;
        }

        public boolean isProfane() {
            return isProfane;
        }

        public String getReason() {
            return reason;
        }

        public String getCategory() {
            return category;
        }

        @Override
        public String toString() {
            return String.format("ProfanityCheckResult{isProfane=%s, reason='%s', category='%s'}", 
                isProfane, reason, category);
        }
    }
}
