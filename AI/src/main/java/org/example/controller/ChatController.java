package org.example.controller;

import org.example.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/translate")
    public Map<String, Object> translateAndTts(
            @RequestParam String roomId,
            @RequestParam String text) {

        return chatService.translateAndGenerateAudio(roomId, text);
    }
}