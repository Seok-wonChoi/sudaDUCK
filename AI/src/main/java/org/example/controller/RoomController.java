package org.example.controller;

import org.example.service.GptService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final GptService gptService;

    @PostMapping("/create")
    public Map<String, Object> createRoom() {
        String roomId = UUID.randomUUID().toString().substring(0, 8);
        var recommendations = gptService.getRecommendedTopics();

        Map<String, Object> response = new HashMap<>();
        response.put("roomId", roomId);
        response.put("topics", recommendations.getTopics());
        return response;
    }
}