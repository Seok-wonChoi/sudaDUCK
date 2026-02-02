package com.example.DuckDuck.domain.game.service;

import com.example.DuckDuck.domain.game.dto.response.ScriptResponse;
import com.example.DuckDuck.domain.game.dto.response.SessionResultResponse;
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

    public List<ScriptResponse> getScriptsByTurn(String email, Long roomId, Integer turnNo){

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
            // key에서 scriptId 추출
            String scriptId = key.substring(key.lastIndexOf(":") + 1);

            // Hash 구조이므로 entries()를 사용하여 Map으로 가져옴
            Map<Object, Object> entries = redisTemplate.opsForHash().entries(key);

            if (!entries.isEmpty()) {
                String speakerId = entries.get("speaker_id").toString();

                //memberMap에서 해당 이름 찾기
                String speakerName = (String) memberMap.getOrDefault(speakerId, "Unknown");

                responses.add(ScriptResponse.builder()
                        // Redis CLI 결과에 맞게 필드 매핑 (String으로 변환 후 처리)
                        .order_no(Integer.parseInt(entries.get("order_no").toString()))
                        .scriptId(scriptId)
                        .speakerName(speakerName)
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

    //세션 별 report 화면 결과 내용 조회
    public List<SessionResultResponse> getSessionResults(Long roomId, Integer turnNo) {

        //방 맴버 정보 가져오기
        String memberKey = "room:" + roomId + ":member";
        Map<Object, Object> memberMap = redisTemplate.opsForHash().entries(memberKey);
        int participantCount = memberMap.isEmpty() ? 1 : memberMap.size();

        //해당 세션의 스크립트 키들 검색
        String pattern = "room:" + roomId + ":turn:" + turnNo + ":script:*";
        Set<String> scriptKeys = redisTemplate.keys(pattern);

        if (scriptKeys == null || scriptKeys.isEmpty()) {
            return Collections.emptyList();
        }

        List<SessionResultResponse> results = new ArrayList<>();

        for (String key : scriptKeys) {
            Map<Object, Object> data = redisTemplate.opsForHash().entries(key);

            String userScoreKey = key + ":scores";
            Map<Object, Object> scoreMap = redisTemplate.opsForHash().entries(userScoreKey);

            if (!data.isEmpty()) {
                double avgScore = 0.0;

                if (!scoreMap.isEmpty()) {
                    double totalSum = scoreMap.values().stream()
                            .mapToDouble(v -> Double.parseDouble(v.toString()))
                            .sum();
                    avgScore = totalSum / scoreMap.size();
                }

                String speakId = data.getOrDefault("speaker_id", "").toString();
                String speakerName = (String) memberMap.getOrDefault(speakId, "Unknown");

                double totalScore = Double.parseDouble(data.getOrDefault("score", "0").toString());

                results.add(SessionResultResponse.builder()
                        .order_no(Integer.parseInt(data.get("order_no").toString()))
                        .speakerName(speakerName)
                        .english((String) data.get("english"))
                        .korean((String) data.get("korean"))
                        .blank_script((String) data.get("blank_script"))
                        .score(totalScore)
                        .averageScore(Math.round(avgScore * 10.0) / 10.0)
                        .build());
            }
        }

        return results.stream()
                .sorted(Comparator.comparing(SessionResultResponse::getOrder_no))
                .collect(Collectors.toList());
    }
}
