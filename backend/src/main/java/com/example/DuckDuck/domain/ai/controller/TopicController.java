package com.example.DuckDuck.domain.ai.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.example.DuckDuck.domain.ai.service.GptService;
import org.springframework.web.bind.annotation.*;
import java.util.*;

/**
 * 주제 추천 API
 */
@RestController
@RequestMapping("/api/v1/topics")
@RequiredArgsConstructor
@Slf4j
public class TopicController {

    private final GptService gptService;

    /**
     * 대화 주제 추천
     * GET /api/v1/topics
     */
    @GetMapping
    public Map<String, Object> getTopics() {

        List<String> topics = gptService.getRecommendedTopics();

        log.info("주제 추천 완료 - topics: {}", topics);

        return Map.of("topics", topics);
    }
}