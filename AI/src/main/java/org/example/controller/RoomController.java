package org.example.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.service.GptService;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
@Slf4j
public class RoomController {

    private final GptService gptService;

    /**
     * 방 생성 + 주제 추천
     * POST /api/rooms/create
     * 
     * Response:
     * {
     *   "roomId": "a1b2c3d4",
     *   "topics": [
     *     {"title": "오늘 뭐 했어?"},
     *     {"title": "좋아하는 음식은?"}
     *   ]
     * }
     */
    @PostMapping("/create")
    public Map<String, Object> createRoom() {
        String roomId = UUID.randomUUID().toString().substring(0, 8);
        
        // GPT에서 주제 추천 (List 직접 받음!)
        List<Map<String, String>> topics = gptService.getRecommendedTopics();
        
        log.info("방 생성 완료 - roomId: {}, 추천 주제 수: {}", roomId, topics.size());

        return Map.of(
            "roomId", roomId,
            "topics", topics  // 바로 사용!
        );
    }
}
