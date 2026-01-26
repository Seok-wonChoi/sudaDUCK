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
     * 방 생성 시 주제 추천 (1차원 배열!)
     * @return 주제 리스트 ["주제1", "주제2", "주제3"]
     */
    public List<String> getRecommendedTopics() {
        String prompt = "보고 바로 고를 수 있게 '아주 짧고 간결한 구어체'로 주제 3가지를 추천해줘.\n\n" +
                "선정 및 말투 가이드:\n" +
                "1. 길이 제한: 반드시 10자 내외의 아주 짧은 구어체로 작성할 것.\n" +
                "2. 구성: 아주 평범한 일상 대화 3개.\n\n" +
                "응답 구조 (반드시 JSON 배열만, 다른 텍스트 없이!):\n" +
                "[\n" +
                "  \"짧은 질문 형태 1\",\n" +
                "  \"짧은 질문 형태 2\",\n" +
                "  \"짧은 질문 형태 3\"\n" +
                "]";

        try {
            // GPT 호출
            String jsonResponse = callGptRaw(prompt);

            // JSON 배열 직접 파싱
            @SuppressWarnings("unchecked")
            List<String> topics = objectMapper.readValue(jsonResponse, List.class);

            if (topics != null && !topics.isEmpty()) {
                log.info("주제 추천 성공: {}", topics);
                return topics;
            }

        } catch (Exception e) {
            log.error("주제 추천 파싱 실패: {}", e.getMessage(), e);
        }

        // 기본값 반환 (파싱 실패 또는 빈 결과)
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

        String jsonResponse = callGptRaw(prompt);
        
        try {
            return objectMapper.readValue(jsonResponse, GptScriptResponse.class);
        } catch (Exception e) {
            log.error("스크립트 생성 파싱 실패: {}", e.getMessage());
            throw new RuntimeException("GPT 응답 파싱 실패", e);
        }
    }

    /**
     * GPT 호출 (JSON 문자열 반환)
     */
    private String callGptRaw(String prompt) {
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

        // JSON 시작/끝 추출
        int startIndex = content.indexOf("{");
        int endIndex = content.lastIndexOf("}");
        
        return content.substring(startIndex, endIndex + 1);
    }
}
