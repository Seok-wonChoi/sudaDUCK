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
                        "당신은 온라인 커뮤니티의 콘텐츠 검토 전문가입니다.\n\n" +

                        "# Task\n" +
                        "방 제목/주제에 **명백히 부적절한 표현**만 감지하세요. " +
                        "일상적이고 중립적인 표현은 모두 허용해야 합니다.\n\n" +

                        "# Input\n" +
                        "텍스트: \"%s\"\n\n" +

                        "# ✅ 반드시 허용해야 할 표현 (MUST ALLOW)\n" +
                        "1. 일상 대화 표현: \"힘들어\", \"피곤해\", \"짜증나\", \"화나\", \"슬퍼\", \"우울해\" 등\n" +
                        "2. 중립적 단어: \"싸움\", \"전쟁\", \"공격\", \"방어\", \"죽음\", \"살인\" (게임/역사/교육 맥락)\n" +
                        "3. 감정 표현: \"미워\", \"싫어\", \"짜증\", \"스트레스\", \"망했다\", \"최악\" 등\n" +
                        "4. 일반 명사: \"욕심\", \"분노\", \"질투\", \"증오\" (학술/교육적 맥락)\n" +
                        "5. 관용구/속담: \"개구리 올챙이 적 생각 못한다\" 등\n\n" +

                        "# ❌ 반드시 거부해야 할 표현 (MUST REJECT)\n" +
                        "1. 명백한 욕설: \"씨발\", \"시발\", \"병신\", \"ㅅㅂ\", \"ㅂㅅ\" 등\n" +
                        "2. 성적 표현: \"섹스\", \"야동\", \"19금\" 등\n" +
                        "3. 혐오 표현: \"김치녀\", \"한남충\", 지역비하, 인종차별 등\n" +
                        "4. 특정 집단 공격: \"~은 죽어야 해\", \"~는 쓰레기\" 등\n\n" +

                        "# Important Rules (매우 중요!) 🔥\n" +
                        "1. **Default to ALLOW**: 의심스러우면 허용하세요\n" +
                        "2. **명백한 욕설/혐오만 차단**: 위 \"❌ MUST REJECT\" 리스트에 해당하는 것만\n" +
                        "3. **일상 표현 절대 금지 안 됨**: \"힘들어\", \"싫어\" 같은 감정 표현은 100%% 허용\n" +
                        "4. **게임/교육 용어 허용**: \"전쟁\", \"공격\", \"죽음\" 등은 맥락 무관하게 허용\n" +
                        "5. **판단 기준 10점 척도**: 8점 이상 확신할 때만 차단 (7점 이하는 모두 허용)\n\n" +

                        "# Output Format (JSON only, no extra text)\n" +
                        "{\n" +
                        "  \"isProfane\": false,  // true는 10%% 미만의 경우만 사용\n" +
                        "  \"reason\": \"구체적인 이유\",\n" +
                        "  \"category\": null  // \"욕설\", \"혐오표현\", \"성적표현\" 중 하나 (허용 시 null)\n" +
                        "}\n\n" +

                        "# Examples\n" +
                        "입력: \"힘들어\"\n" +
                        "출력: {\"isProfane\": false, \"reason\": \"일상적 감정 표현\", \"category\": null}\n\n" +

                        "입력: \"전쟁 게임\"\n" +
                        "출력: {\"isProfane\": false, \"reason\": \"게임 관련 중립 표현\", \"category\": null}\n\n" +

                        "입력: \"씨발\"\n" +
                        "출력: {\"isProfane\": true, \"reason\": \"명백한 욕설\", \"category\": \"욕설\"}\n\n" +

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
