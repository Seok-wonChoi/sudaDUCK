package com.example.DuckDuck.domain.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.example.DuckDuck.domain.ai.dto.GptScriptResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class GptService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${gms.token}")
    private String gmsToken;

    private final String GMS_URL = "https://gms.ssafy.io/gmsapi/api.openai.com/v1/chat/completions";

    /**
     * 방 생성 시 주제 추천
     */
    public List<String> getRecommendedTopics() {
        String prompt = "보고 바로 고를 수 있게 '아주 짧고 간결한 구어체'로 주제 3가지를 추천해줘.\n\n" +
                "선정 및 말투 가이드:\n" +
                "1. 길이 제한: 반드시 10자 내외의 짧은 구어체로 작성할 것.\n" +
                "2. 구성: 아주 평범한 일상 대화 3개.\n\n" +
                "응답 구조 (반드시 JSON 배열만, 다른 텍스트 없이!):\n" +
                "[\n" +
                "  \"짧은 질문 형태 1\",\n" +
                "  \"짧은 질문 형태 2\",\n" +
                "  \"짧은 질문 형태 3\"\n" +
                "]";

        try {
            String jsonResponse = callGptRaw(prompt);
            @SuppressWarnings("unchecked")
            List<String> topics = objectMapper.readValue(jsonResponse, List.class);

            if (topics != null && !topics.isEmpty()) {
                log.info("주제 추천 성공: {}", topics);
                return topics;
            }

        } catch (Exception e) {
            log.error("주제 추천 파싱 실패: {}", e.getMessage(), e);
        }

        return List.of(
                "오늘 뭐 했어?",
                "좋아하는 음식은?",
                "요즘 관심사는?"
        );
    }

    /**
     * 번역 및 학습 콘텐츠 생성
     */
    public GptScriptResponse generateScript(String koreanText) {
        String prompt = String.format(
                "# Role\n" +
                        "당신은 영어 회화 학습 콘텐츠 생성 전문가입니다.\n\n" +

                        "# Context\n" +
                        "사용자가 음성으로 말한 한국어를 영어로 번역하고, 학습 자료를 만들어야 합니다.\n" +
                        "입력된 한국어는 이미 전처리된 자연스러운 구어체입니다.\n\n" +

                        "# Input\n" +
                        "한국어 문장: \"%s\"\n\n" +

                        "# Task\n" +
                        "위 한국어 문장을 분석하여 다음 JSON 형식으로 응답하세요:\n\n" +

                        "# Output Requirements\n" +
                        "1. **en** (영어 번역문)\n" +
                        "   - 구어체 특성을 살려 자연스럽게 번역\n" +
                        "   - 실제 원어민이 일상에서 사용하는 표현 우선\n" +
                        "   - 문법적으로 완벽하되 너무 격식적이지 않게\n\n" +

                        "2. **blank_script** (빈칸 학습지)\n" +
                        "   - 'en'에서 핵심 단어 2-3개를 [ ]로 치환\n" +
                        "   - 선택 기준: 명사 > 동사 > 형용사 순\n" +
                        "   - 학습 난이도를 고려하여 선택\n\n" +

                        "3. **similarity_phrases** (유사 표현 2개)\n" +
                        "   - 'en'과 완전히 같은 의미의 다른 영어 문장\n" +
                        "   - 다양한 표현 방식 제시 (격식/비격식, 직접/간접 등)\n" +
                        "   - 한국어 절대 금지, 순수 영어만\n\n" +

                        "# Output Format (JSON only, no extra text)\n" +
                        "{\n" +
                        "  \"en\": \"자연스러운 영어 번역\",\n" +
                        "  \"blank_script\": \"The [weather] is so [beautiful].\",\n" +
                        "  \"similarity_phrases\": [\n" +
                        "    \"첫 번째 유사 표현\",\n" +
                        "    \"두 번째 유사 표현\"\n" +
                        "  ]\n" +
                        "}\n\n" +

                        "# Examples\n" +
                        "입력: \"오늘 날씨 진짜 좋다\"\n" +
                        "출력:\n" +
                        "{\n" +
                        "  \"en\": \"The weather is really nice today.\",\n" +
                        "  \"blank_script\": \"The [weather] is really [nice] today.\",\n" +
                        "  \"similarity_phrases\": [\n" +
                        "    \"It's such a beautiful day today.\",\n" +
                        "    \"Today's weather is awesome.\"\n" +
                        "  ]\n" +
                        "}\n\n" +

                        "이제 위 한국어 문장을 처리해주세요.", koreanText
        );

        String jsonResponse = callGptRaw(prompt);
        
        try {
            return objectMapper.readValue(jsonResponse, GptScriptResponse.class);
        } catch (Exception e) {
            log.error("스크립트 생성 파싱 실패: {}", e.getMessage());
            throw new RuntimeException("GPT 응답 파싱 실패", e);
        }
    }

    /**
     * JSON 응답을 요청하는 범용 GPT 호출
     */
    public String callGptForJson(String prompt) {
        log.info("GPT JSON 호출 - prompt length: {}", prompt.length());
        return callGptRaw(prompt);
    }

    /**
     * JSON 문자열을 Map으로 파싱
     */
    public Map<String, Object> parseJsonResponse(String json) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = objectMapper.readValue(json, Map.class);
            return result;
        } catch (Exception e) {
            log.error("JSON 파싱 실패 - json: {}", json, e);
            throw new RuntimeException("GPT 응답 파싱 실패", e);
        }
    }

    /**
     * GPT 호출 (JSON 문자열 반환)
     * ✅ 에러 처리 강화
     */
    public String callGptRaw(String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + gmsToken);

        Map<String, Object> body = new HashMap<>();
        body.put("model", "gpt-4o-mini");
        body.put("messages", List.of(Map.of("role", "user", "content", prompt)));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(GMS_URL, entity, Map.class);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
        
        @SuppressWarnings("unchecked")
        Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
        String content = (String) message.get("content");

        // ✅ JSON 추출 개선 (에러 처리 강화)
        int startIndex = content.indexOf("{");
        int endIndex = content.lastIndexOf("}");
        
        // JSON 객체가 없으면 배열 확인
        if (startIndex == -1 || endIndex == -1) {
            startIndex = content.indexOf("[");
            endIndex = content.lastIndexOf("]");
        }
        
        // ✅ 여전히 JSON이 없으면 원본 반환
        if (startIndex == -1 || endIndex == -1 || startIndex > endIndex) {
            log.warn("JSON을 찾을 수 없음. 원본 반환: {}", content);
            return content;  // 원본 그대로 반환
        }
        
        String extracted = content.substring(startIndex, endIndex + 1);
        log.debug("JSON 추출 완료: {}", extracted);
        return extracted;
    }
}
