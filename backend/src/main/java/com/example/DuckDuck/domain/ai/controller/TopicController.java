package com.example.DuckDuck.domain.ai.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.example.DuckDuck.domain.ai.service.GptService;
import org.springframework.web.bind.annotation.*;
import java.util.*;

/**
 * 주제 추천 API
 */
@Tag(name = "topic", description = "주제 추천")
@RestController
@RequestMapping("/api/v1/topics")
@RequiredArgsConstructor
@Slf4j
public class TopicController {

    private final GptService gptService;

    /**
     * 대화 주제 추천
     * GET /api/v1/topics
     *
     * Response:
     * {
     *   "topics": ["오늘 뭐 했어?", "좋아하는 음식은?", "요즘 취미가 뭐야?"]
     * }
     */
    @GetMapping
    public Map<String, Object> getTopics() {

        List<String> topics = gptService.getRecommendedTopics();

        log.info("주제 추천 완료 - topics: {}", topics);

        return Map.of("topics", topics);
    }
}