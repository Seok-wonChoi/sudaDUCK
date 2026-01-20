package org.example.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.example.dto.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class GptService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${gms.token}")
    private String gmsToken;

    private final String GMS_URL = "https://gms.ssafy.io/gmsapi/api.openai.com/v1/chat/completions";

    // 1. 방 생성 시 주제 추천
    public TopicRecommendationResponse getRecommendedTopics() {
        String prompt = "보고 바로 고를 수 있게 '아주 짧고 간결한 구어체'로 주제 3가지를 추천해줘.\n\n" +
                "선정 및 말투 가이드:\n" +
                "1. 길이 제한: 'title'은 반드시 10자 내외의 아주 짧은 구어체로 작성할 것.\n" +
                "2. 중복 금지: 내가 예시로 준 '오늘 저녁', '좋아하는 음식', '흑백요리사'는 참고만 하고, 이와 똑같은 주제는 자제해.\n" +
                "3. 구성: 아주 평범한 일상 대화 3개.\n\n" +
                "응답 구조 (반드시 JSON만):\n" +
                "{\n" +
                "  \"topics\": [\n" +
                "    { \"title\": \"짧은 질문 형태\", \"description\": \"말을 시작하게 돕는 아주 짧은 한 문장\" }\n" +
                "  ]\n" +
                "}";

        return callGpt(prompt, TopicRecommendationResponse.class);
    }

    // 2. 실시간 번역 및 빈칸 스크립트, 유사표현 생성
    public GptScriptResponse generateScript(String koreanText) {
        String prompt = String.format(
                "너는 영어 회화 학습 콘텐츠 생성기야. 아래 한국어 문장을 분석해서 반드시 JSON 형식으로만 응답해.\n" +
                        "한국어 문장: \"%s\"\n\n" +
                        "조건:\n" +
                        "1. 'en': 자연스러운 영어 번역문을 작성할 것.\n" +
                        "2. 'blank_script': 위에서 만든 'en' 문장에서 핵심 단어(명사, 동사, 형용사 등) 2~3개를 골라 각각 [ ]로 치환할 것.\n" +
                        "3. 'similarity_phrases': 'en' 문장과 의미가 같은 다른 형태의 '영어 문장' 2개를 작성할 것 (한국어 금지).\n\n" +
                        "응답 예시 (반드시 이 구조로 JSON만 출력):\n" +
                        "{\n" +
                        "  \"en\": \"The weather is so beautiful that I want to take a stroll.\",\n" +
                        "  \"blank_script\": \"The [weather] is so [beautiful] that I want to take a [stroll].\",\n" +
                        "  \"similarity_phrases\": [\"It's such a nice day to go outside.\", \"I feel like walking because the weather is great.\"]\n" +
                        "}", koreanText);

        return callGpt(prompt, GptScriptResponse.class);
    }

    // 공통 GPT 호출 로직
    private <T> T callGpt(String prompt, Class<T> valueType) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + gmsToken);

        Map<String, Object> body = new HashMap<>();
        body.put("model", "gpt-4o-mini");
        body.put("messages", List.of(Map.of("role", "user", "content", prompt)));

        try {
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(GMS_URL, entity, Map.class);

            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
            String content = (String) ((Map<String, Object>) choices.get(0).get("message")).get("content");

            // JSON 시작점 { 와 끝점 } 사이만 추출 (objectMapper가 json아니면 에러남)
            int startIndex = content.indexOf("{");
            int endIndex = content.lastIndexOf("}");

            if (startIndex != -1 && endIndex != -1) {
                content = content.substring(startIndex, endIndex + 1);
            }
            return objectMapper.readValue(content, valueType);
        } catch (Exception e) {
            throw new RuntimeException("GPT 연동 중 오류 발생: " + e.getMessage());
        }
    }
}