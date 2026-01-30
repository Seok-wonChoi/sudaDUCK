package com.example.DuckDuck.domain.game.service;

import com.example.DuckDuck.domain.game.dto.response.ScriptResponse;
import com.example.DuckDuck.global.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final JwtTokenProvider jwtTokenProvider;

    public List<ScriptResponse> getScriptsByTurn(String token, Long roomId, Integer turnNo){
        Long userId = jwtTokenProvider.getUserId(token);

        // 해당 방의 맴버 정보를 먼저 가져옴
        String memberKey = "room:" + roomId + ":member";
        Map<Object, Object> memberMap = redisTemplate.opsForHash().entries(memberKey);

        String pattern = "room:" + roomId + ":turn:" + turnNo + ":script:*";
        Set<String> keys = redisTemplate.keys(pattern);

        if (keys == null || keys.isEmpty()){
            return Collections.emptyList();
        }

        List<ScriptResponse> responses = new ArrayList<>();

        for (String key : keys) {
            // Hash 구조이므로 entries()를 사용하여 Map으로 가져옴
            Map<Object, Object> entries = redisTemplate.opsForHash().entries(key);

            if (!entries.isEmpty()) {
                String speakerId = entries.get("speaker_id").toString();

                //memberMap에서 해당 이름 찾기
                String speakerName = (String) memberMap.getOrDefault(speakerId, "Unknown");

                responses.add(ScriptResponse.builder()
                        // Redis CLI 결과에 맞게 필드 매핑 (String으로 변환 후 처리)
                        .order_no(Integer.parseInt(entries.get("order_no").toString()))
                        .speakerName(speakerName) // CLI엔 id로 되어있음
                        .english((String) entries.get("english"))
                        .korean((String) entries.get("korean"))
                        .blank_script((String) entries.get("blank_script"))
                        .tts_url((String) entries.get("tts_url"))
                        .build());
            }
        }

        return responses.stream()
                .sorted(Comparator.comparing(ScriptResponse::getOrder_no))
                .collect(Collectors.toList());

    }
}
